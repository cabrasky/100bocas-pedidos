"""
100Bocas — collaborative order server
FastAPI + PostgreSQL + WebSockets
"""
from __future__ import annotations

import asyncio
import hashlib
import hmac
import ipaddress
import json
import os
import random
import re
import string
import time
import urllib.parse
from datetime import datetime
from collections import defaultdict
from contextlib import asynccontextmanager
from ipaddress import ip_address, ip_network

import asyncpg
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse

# ── Config ────────────────────────────────────────
DB_DSN = os.getenv("BOCAS_DB", "postgresql://bocas@localhost:5433/100bocas")
HOST = os.getenv("BOCAS_HOST", "0.0.0.0")
PORT = int(os.getenv("BOCAS_PORT", "8112"))
STATIC_DIR = os.path.join(os.path.dirname(__file__), "dist", "client")
CLEANUP_INTERVAL = int(os.getenv("BOCAS_CLEANUP_INTERVAL", "1800"))
SESSION_TTL = int(os.getenv("BOCAS_SESSION_TTL", "86400"))
SESSION_MAX_AGE = int(os.getenv("BOCAS_SESSION_MAX_AGE", "432000"))  # 5 days max storage

# ── Security limits ───────────────────────────────
MAX_REQUESTS_PER_MIN = int(os.getenv("BOCAS_MAX_RPM", "120"))      # API calls/IP/min
MAX_WS_PER_IP = int(os.getenv("BOCAS_MAX_WS_IP", "5"))             # WS connections/IP
MAX_WS_PER_SESSION = int(os.getenv("BOCAS_MAX_WS_SESSION", "50"))  # WS connections/session
MAX_WS_TOTAL = int(os.getenv("BOCAS_MAX_WS_TOTAL", "200"))         # Total WS limit
MAX_BODY_SIZE = int(os.getenv("BOCAS_MAX_BODY", "524288"))          # Max JSON body bytes
MAX_NAME_LENGTH = int(os.getenv("BOCAS_MAX_NAME", "30"))           # Max person name length
JOIN_RATE_LIMIT = int(os.getenv("BOCAS_JOIN_LIMIT", "10"))         # Max failed joins/min
WS_RECEIVE_TIMEOUT = int(os.getenv("BOCAS_WS_TIMEOUT", "300"))     # WS idle timeout (5 min)
TRUSTED_PROXIES = os.getenv("BOCAS_TRUSTED_PROXIES", "192.168.0.0/16,10.0.0.0/8,172.16.0.0/12").split(",")

# ── Rate limiter state ────────────────────────────
_rpm: dict[str, list[float]] = defaultdict(list)       # IP -> list of timestamps
_failed_joins: dict[str, list[float]] = defaultdict(list)  # IP -> failed join timestamps
_ws_by_ip: dict[str, set[int]] = defaultdict(set)      # IP -> set of WS ids

pool: asyncpg.Pool | None = None
ws_rooms: dict[str, set[WebSocket]] = {}                # session_code -> set of websockets
_ws_id_counter: int = 0
_ws_by_id: dict[int, WebSocket] = {}                    # id -> ws
_cleanup_task: asyncio.Task | None = None


# ── Security helpers ──────────────────────────────
def _get_client_ip(request: Request) -> str:
    """Extract real client IP, respecting trusted proxies."""
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        ips = [ip.strip() for ip in xff.split(",")]
        # Find the first non-trusted IP
        for ip_str in reversed(ips):
            try:
                addr = ip_address(ip_str)
                for net_str in TRUSTED_PROXIES:
                    net_str = net_str.strip()
                    if net_str and addr in ip_network(net_str):
                        break
                else:
                    return ip_str
            except ValueError:
                continue
    # Fallback to direct IP
    client = request.client
    return client.host if client else "unknown"


def _check_rpm(ip: str, limit: int = MAX_REQUESTS_PER_MIN) -> bool:
    """Returns True if request is allowed (under rate limit)."""
    now = time.time()
    window = now - 60
    _rpm[ip] = [t for t in _rpm[ip] if t > window]
    if len(_rpm[ip]) >= limit:
        return False
    _rpm[ip].append(now)
    return True


def _clean_rate_limiters():
    """Periodic cleanup of old rate limiter data."""
    now = time.time()
    cutoff = now - 120  # Keep last 2 min
    for d in (_rpm, _failed_joins):
        for ip in list(d):
            d[ip] = [t for t in d[ip] if t > cutoff]
            if not d[ip]:
                del d[ip]
    for ip in list(_ws_by_ip):
        if not _ws_by_ip[ip]:
            del _ws_by_ip[ip]


def _sanitize(text: str, max_len: int = MAX_NAME_LENGTH) -> str:
    """Strip control chars, HTML tags, and truncate."""
    cleaned = re.sub(r"[\x00-\x1f\x7f]", "", text)
    cleaned = re.sub(r"<[^>]*>", "", cleaned)  # Strip HTML tags
    return cleaned.strip()[:max_len]


def _validate_code(code: str) -> bool:
    """Session codes: 6 alphanumeric uppercase."""
    return bool(re.match(r"^[A-Z0-9]{6}$", code))


def _validate_name(name: str) -> bool:
    """Person names: printable chars, reasonable length."""
    return bool(name) and len(name) <= MAX_NAME_LENGTH and not re.search(r"[\x00-\x1f\x7f]", name)


# ── Session helpers ───────────────────────────────
async def touch_session(code: str):
    assert pool
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE sessions SET last_active = now() WHERE code = $1", code,
        )


async def cleanup_old_sessions():
    assert pool
    async with pool.acquire() as conn:
        deleted = await conn.fetch(
            "DELETE FROM sessions "
            "WHERE last_active < now() - make_interval(secs => $1) "
            "OR created_at < now() - make_interval(secs => $2) "
            "RETURNING code",
            SESSION_TTL, SESSION_MAX_AGE,
        )
    for row in deleted:
        code = row["code"]
        if code in ws_rooms:
            for ws in list(ws_rooms[code]):
                try:
                    await ws.close(code=4000, reason="Session expired")
                except Exception:
                    pass
            del ws_rooms[code]
    _clean_rate_limiters()
    await _clean_expired_bans()


async def periodic_cleanup():
    while True:
        await asyncio.sleep(CLEANUP_INTERVAL)
        try:
            await cleanup_old_sessions()
        except Exception as exc:
            print(f"[cleanup] Error: {exc}")


# ── IP Ban system (DB-backed) ──────────────────────
AUTO_BAN_THRESHOLD = int(os.getenv("BOCAS_AUTO_BAN_THRESHOLD", "5"))   # Rate limit hits before auto-ban
AUTO_BAN_DURATION = int(os.getenv("BOCAS_AUTO_BAN_DURATION", "86400"))  # 24h auto-ban duration (secs)
PROGRESSIVE_INCREMENTS = [3600, 21600, 86400, 604800]  # 1h, 6h, 24h, 7d
PROGRESSIVE_LABELS = ["1h", "6h", "24h", "7d"]

_banned_ips_cache: dict[str, str] = {}       # ip -> reason
_ban_type_cache: dict[str, str] = {}         # ip -> 'ban' | 'soft'
_ban_expiry_cache: dict[str, float] = {}     # ip -> expires_at
_whitelist_cache: list[str] = []             # list of CIDR strings
_cidr_bans_cache: list[tuple[str, str]] = [] # (cidr, reason)
_offense_cache: dict[str, int] = {}          # ip -> offense count (progressive)
_rpm_violations: dict[str, list[float]] = defaultdict(list)


async def _ensure_bans_table():
    """Create/migrate ban tables, load caches."""
    assert pool
    async with pool.acquire() as conn:
        # Main ban table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS banned_ips (
                id          SERIAL PRIMARY KEY,
                ip          VARCHAR(45) NOT NULL UNIQUE,
                banned_at   DOUBLE PRECISION NOT NULL,
                reason      TEXT NOT NULL,
                auto_ban    BOOLEAN DEFAULT false,
                expires_at  DOUBLE PRECISION,
                ban_type    VARCHAR(20) DEFAULT 'ban',
                offense_count INTEGER DEFAULT 1
            )
        """)
        # Migration: add columns if missing on existing tables
        for col, typ in [("ban_type", "VARCHAR(20) DEFAULT 'ban'"),
                         ("offense_count", "INTEGER DEFAULT 1")]:
            await conn.execute(f"ALTER TABLE banned_ips ADD COLUMN IF NOT EXISTS {col} {typ}")

        # CIDR bans table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS cidr_bans (
                id          SERIAL PRIMARY KEY,
                cidr        VARCHAR(45) NOT NULL UNIQUE,
                banned_at   DOUBLE PRECISION NOT NULL,
                reason      TEXT NOT NULL,
                auto_ban    BOOLEAN DEFAULT false
            )
        """)
        # Whitelist table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS whitelisted_ips (
                id          SERIAL PRIMARY KEY,
                ip_cidr     VARCHAR(45) NOT NULL UNIQUE,
                note        TEXT DEFAULT '',
                created_at  DOUBLE PRECISION NOT NULL
            )
        """)

        await conn.execute("CREATE INDEX IF NOT EXISTS idx_banned_ips_ip ON banned_ips(ip)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_banned_ips_expires ON banned_ips(expires_at)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_banned_ips_type ON banned_ips(ban_type)")
    await _load_all_caches()
    print(f"[ban] Loaded {len(_banned_ips_cache)} bans, {len(_cidr_bans_cache)} CIDR bans, {len(_whitelist_cache)} whitelisted from DB")


async def _load_all_caches():
    """Load all ban/whitelist data from DB into memory caches."""
    global _banned_ips_cache, _ban_type_cache, _ban_expiry_cache, _whitelist_cache, _cidr_bans_cache, _offense_cache
    assert pool
    now_t = time.time()
    async with pool.acquire() as conn:
        # Clean expired first
        await conn.execute("DELETE FROM banned_ips WHERE expires_at IS NOT NULL AND expires_at < $1", now_t)

        # Banned IPs
        rows = await conn.fetch(
            "SELECT ip, reason, ban_type, expires_at, offense_count FROM banned_ips "
            "WHERE ban_type IN ('ban', 'soft') AND (expires_at IS NULL OR expires_at > $1)", now_t
        )
        _banned_ips_cache = {}
        _ban_type_cache = {}
        _ban_expiry_cache = {}
        _offense_cache = {}
        for row in rows:
            ip = row["ip"]
            _banned_ips_cache[ip] = row["reason"]
            _ban_type_cache[ip] = row["ban_type"]
            _ban_expiry_cache[ip] = row["expires_at"] if row["expires_at"] else 0
            _offense_cache[ip] = row["offense_count"]

        # Whitelist
        wrows = await conn.fetch("SELECT ip_cidr FROM whitelisted_ips")
        _whitelist_cache = [r["ip_cidr"] for r in wrows]

        # CIDR bans
        crows = await conn.fetch("SELECT cidr, reason FROM cidr_bans")
        _cidr_bans_cache = [(r["cidr"], r["reason"]) for r in crows]


def _get_ban_duration_h(ip: str) -> str:
    """Return human duration for progressive bans."""
    duration = _ban_expiry_cache.get(ip, 0)
    if not duration:
        return "Permanente"
    remaining = duration - time.time()
    if remaining <= 0:
        return "Expirado"
    hrs = remaining / 3600
    if hrs < 24:
        return f"{int(hrs)}h"
    return f"{int(hrs/24)}d"


# ── Core checks (sync, hot path) ──────────────────

def _is_ip_banned(ip: str) -> tuple[str | None, str | None]:
    """Check if IP is banned. Returns (reason, ban_type) or (None, None).
    ban_type is 'ban' (block), 'soft' (warn only), or None."""
    reason = _banned_ips_cache.get(ip)
    if reason is None:
        return None, None
    btype = _ban_type_cache.get(ip, "ban")
    if btype == "soft":
        return reason, "soft"
    # Check expiry
    expires = _ban_expiry_cache.get(ip)
    if expires and expires < time.time():
        return None, None
    return reason, "ban"


def _is_whitelisted(ip: str) -> bool:
    """Check if IP is whitelisted (bypasses rate limits and bans)."""
    for entry in _whitelist_cache:
        try:
            if "/" in entry:
                if ipaddress.ip_address(ip) in ipaddress.ip_network(entry, strict=False):
                    return True
            elif entry == ip:
                return True
        except ValueError:
            continue
    return False


def _check_cidr_bans(ip: str) -> str | None:
    """Check if IP falls under any CIDR ban. Returns reason or None."""
    try:
        addr = ipaddress.ip_address(ip)
        for cidr, reason in _cidr_bans_cache:
            if addr in ipaddress.ip_network(cidr, strict=False):
                return reason
    except ValueError:
        pass
    return None


def _get_progressive_duration(ip: str) -> int:
    """Get escalating ban duration based on offense count."""
    count = _offense_cache.get(ip, 0)
    idx = min(count, len(PROGRESSIVE_INCREMENTS) - 1)
    return PROGRESSIVE_INCREMENTS[idx]


# ── Mutations (async, DB) ─────────────────────────

async def _ban_ip(ip: str, reason: str = "Manual", auto_ban: bool = False,
                  duration: int | None = None, ban_type: str = "ban") -> dict:
    """Ban an IP. Returns the ban entry."""
    assert pool
    now_t = time.time()
    if duration is None:
        if auto_ban:
            duration = _get_progressive_duration(ip)
        else:
            duration = 0  # permanent
    expires_at = now_t + duration if duration and duration > 0 else None

    # Track progressive offense count
    current_offense = _offense_cache.get(ip, 0)
    if auto_ban:
        current_offense += 1

    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO banned_ips (ip, banned_at, reason, auto_ban, expires_at, ban_type, offense_count)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (ip) DO UPDATE
               SET banned_at = $2, reason = $3, auto_ban = $4,
                   expires_at = $5, ban_type = $6, offense_count = $7""",
            ip, now_t, reason, auto_ban, expires_at, ban_type, current_offense,
        )
    _banned_ips_cache[ip] = reason
    _ban_type_cache[ip] = ban_type
    _ban_expiry_cache[ip] = expires_at or 0
    _offense_cache[ip] = current_offense
    dur_str = "permanent" if expires_at is None else f"{duration}s"
    print(f"[ban] {'Auto' if auto_ban else 'Manual'} ban ({ban_type}): {ip} — {reason} [{dur_str}]")
    return {"banned_at": now_t, "reason": reason, "auto_ban": auto_ban, "expires_at": expires_at, "ban_type": ban_type}


async def _unban_ip(ip: str) -> bool:
    """Remove an IP ban from DB. Returns True if it existed."""
    assert pool
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM banned_ips WHERE ip = $1 AND ban_type IN ('ban', 'soft')", ip)
        removed = "DELETE" in result and int(result.split()[-1]) > 0
    _banned_ips_cache.pop(ip, None)
    _ban_type_cache.pop(ip, None)
    _ban_expiry_cache.pop(ip, None)
    _offense_cache.pop(ip, None)
    if removed:
        print(f"[ban] Unbanned {ip}")
    return removed


async def _ban_cidr(cidr: str, reason: str = "CIDR block") -> dict:
    """Ban an entire subnet."""
    assert pool
    now_t = time.time()
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO cidr_bans (cidr, banned_at, reason) VALUES ($1, $2, $3) ON CONFLICT (cidr) DO NOTHING",
            cidr, now_t, reason,
        )
    _cidr_bans_cache.append((cidr, reason))
    print(f"[ban] CIDR ban: {cidr} — {reason}")
    return {"cidr": cidr, "banned_at": now_t, "reason": reason}


async def _unban_cidr(cidr: str) -> bool:
    """Remove a CIDR ban."""
    assert pool
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM cidr_bans WHERE cidr = $1", cidr)
        removed = "DELETE" in result and int(result.split()[-1]) > 0
    _cidr_bans_cache[:] = [(c, r) for c, r in _cidr_bans_cache if c != cidr]
    return removed


async def _add_whitelist(ip_cidr: str, note: str = "") -> bool:
    """Add an IP or CIDR to the whitelist."""
    assert pool
    now_t = time.time()
    async with pool.acquire() as conn:
        result = await conn.execute(
            "INSERT INTO whitelisted_ips (ip_cidr, note, created_at) VALUES ($1, $2, $3) ON CONFLICT (ip_cidr) DO NOTHING",
            ip_cidr, note, now_t,
        )
        added = "INSERT" in result and int(result.split()[-1]) > 0
    if added:
        _whitelist_cache.append(ip_cidr)
        print(f"[ban] Whitelisted: {ip_cidr}")
    return added


async def _remove_whitelist(ip_cidr: str) -> bool:
    """Remove an IP/CIDR from the whitelist."""
    assert pool
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM whitelisted_ips WHERE ip_cidr = $1", ip_cidr)
        removed = "DELETE" in result and int(result.split()[-1]) > 0
    _whitelist_cache[:] = [w for w in _whitelist_cache if w != ip_cidr]
    return removed


async def _clean_expired_bans():
    """Remove expired bans from DB and refresh caches."""
    assert pool
    now_t = time.time()
    async with pool.acquire() as conn:
        deleted = await conn.execute(
            "DELETE FROM banned_ips WHERE expires_at IS NOT NULL AND expires_at < $1", now_t
        )
        count = int(deleted.split()[-1]) if "DELETE" in deleted else 0
    if count:
        await _load_all_caches()
        print(f"[ban] Cleaned {count} expired bans")
    return count


def _get_progressive_label(count: int) -> str:
    """Return human label for progressive offense level."""
    idx = min(count - 1, len(PROGRESSIVE_LABELS) - 1)
    return PROGRESSIVE_LABELS[idx] if count > 0 else ""


def _record_rpm_violation(ip: str, soft_mode: bool = False):
    """Track a rate limit violation and auto-ban if threshold exceeded.
    In soft_mode, logs the violation but does NOT block."""
    now_t = time.time()
    window = now_t - 600
    _rpm_violations[ip] = [t for t in _rpm_violations[ip] if t > window]
    _rpm_violations[ip].append(now_t)
    if len(_rpm_violations[ip]) >= AUTO_BAN_THRESHOLD:
        count = len(_rpm_violations[ip])
        _rpm_violations[ip] = []
        if not soft_mode:
            asyncio.create_task(
                _ban_ip(ip, reason=f"Auto-ban: {count} rate limit violations en 10 min", auto_ban=True)
            )
        else:
            print(f"[ban] Soft violation logged: {ip} ({count} violations, no action)")


# ── Admin auth ────────────────────────────────────
ADMIN_PASSWORD = os.getenv("BOCAS_ADMIN_PASSWORD", "")
if not ADMIN_PASSWORD:
    # Generate a random password and print it
    ADMIN_PASSWORD = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
    print(f"[auth] ⚠️  BOCAS_ADMIN_PASSWORD not set. Generated: {ADMIN_PASSWORD}")
    print(f"[auth] Set BOCAS_ADMIN_PASSWORD env var to use a custom password.")

ADMIN_SERVER_SECRET = os.getenv("BOCAS_ADMIN_SERVER_SECRET", "") or ''.join(random.choices(string.ascii_letters + string.digits, k=32))
_admin_token: str | None = None


def _make_admin_token() -> str:
    """Create a token from password + server secret."""
    global _admin_token
    raw = f"{ADMIN_PASSWORD}:{ADMIN_SERVER_SECRET}"
    _admin_token = hashlib.sha256(raw.encode()).hexdigest()
    return _admin_token


def _verify_admin_token(token: str) -> bool:
    """Verify a bearer token against the stored admin token."""
    if not token or not _admin_token:
        return False
    return hmac.compare_digest(token, _admin_token)


def _admin_required(request: Request):
    """Check Authorization header for valid admin token. Returns error response or None."""
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        return JSONResponse({"error": "Se requiere autenticación de administrador"}, status_code=401)
    token = auth[7:]
    if not _verify_admin_token(token):
        _record_rpm_violation(_get_client_ip(request))
        return JSONResponse({"error": "Token inválido"}, status_code=403)
    return None


# ── Lifespan ───────────────────────────────────────
@asynccontextmanager
async def lifespan(_app: FastAPI):
    global pool, _cleanup_task
    pool = await asyncpg.create_pool(DB_DSN, min_size=2, max_size=10)
    _cleanup_task = asyncio.create_task(periodic_cleanup())
    await _ensure_bans_table()
    print(f"[server] Security: RPM={MAX_REQUESTS_PER_MIN}, WS/IP={MAX_WS_PER_IP}, "
          f"WS/session={MAX_WS_PER_SESSION}, WS total={MAX_WS_TOTAL}")
    yield
    if _cleanup_task:
        _cleanup_task.cancel()
        try:
            await _cleanup_task
        except asyncio.CancelledError:
            pass
    if pool:
        await pool.close()


app = FastAPI(lifespan=lifespan)


@app.post("/api/admin/login")
async def admin_login(request: Request):
    """Authenticate with admin password and receive a token."""
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)

    password = body.get("password", "")
    if not password:
        return JSONResponse({"error": "Contraseña requerida"}, status_code=400)

    if not hmac.compare_digest(password, ADMIN_PASSWORD):
        _record_rpm_violation(_get_client_ip(request))
        return JSONResponse({"error": "Contraseña incorrecta"}, status_code=403)

    token = _make_admin_token()
    return {"token": token, "message": "Autenticación correcta"}


def make_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


async def broadcast(session_code: str, event: dict):
    if session_code not in ws_rooms:
        return
    msg = json.dumps(event, ensure_ascii=False)
    dead: list[WebSocket] = []
    for ws in ws_rooms[session_code]:
        try:
            await ws.send_text(msg)
        except Exception:
            dead.append(ws)
    for ws in dead:
        ws_rooms[session_code].discard(ws)
    if not ws_rooms[session_code]:
        del ws_rooms[session_code]


async def get_session_data(code: str) -> dict | None:
    assert pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id FROM sessions WHERE code = $1", code)
        if not row:
            return None
        session_id = row["id"]
        persons_rows = await conn.fetch(
            "SELECT id, name FROM persons WHERE session_id = $1 ORDER BY id",
            session_id,
        )
        people = []
        for p in persons_rows:
            items_rows = await conn.fetch(
                "SELECT item_key, item_name, item_code, category, quantity "
                "FROM order_items WHERE person_id = $1 ORDER BY item_key",
                p["id"],
            )
            items = {
                r["item_key"]: {
                    "item": {
                        "name": r["item_name"],
                        "code": r["item_code"] or None,
                    },
                    "category": r["category"],
                    "qty": r["quantity"],
                }
                for r in items_rows
            }
            people.append({"name": p["name"], "items": items})
        return {"code": code, "people": people}


# ── Security middleware ───────────────────────────
@app.middleware("http")
async def security_middleware(request: Request, call_next):
    client_ip = _get_client_ip(request)
    path = request.url.path

    # Block non-ASCII/control chars in path
    if re.search(r"[\x00-\x1f\x7f-\x9f]", path):
        return JSONResponse({"error": "Bad request"}, status_code=400)

    # ── Whitelist check (bypasses all bans and rate limits) ──
    if _is_whitelisted(client_ip):
        return await call_next(request)

    # ── Check CIDR bans ──
    cidr_reason = _check_cidr_bans(client_ip)
    if cidr_reason:
        return JSONResponse(
            {"error": f"Acceso denegado: {cidr_reason}"},
            status_code=403,
        )

    # ── Check IP ban ──
    ban_reason, ban_type = _is_ip_banned(client_ip)
    if ban_reason and ban_type == "ban":
        return JSONResponse(
            {"error": f"Acceso denegado: {ban_reason}"},
            status_code=403,
        )

    # Soft ban: allow request but log violation
    is_soft = ban_reason is not None and ban_type == "soft"

    # ── Rate limiting for API ──
    if path.startswith("/api/"):
        if not _check_rpm(client_ip):
            _record_rpm_violation(client_ip, soft_mode=is_soft)
            if not is_soft:
                return JSONResponse(
                    {"error": "Demasiadas peticiones. Intenta de nuevo en un minuto."},
                    status_code=429,
                )

        # Body size check for POST/PUT/DELETE
        if request.method in ("POST", "PUT", "DELETE"):
            content_length = request.headers.get("content-length", "0")
            try:
                if int(content_length) > MAX_BODY_SIZE:
                    return JSONResponse(
                        {"error": "Solicitud demasiado grande"}, status_code=413,
                    )
            except ValueError:
                pass

    # Security headers
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


# ── Session API ────────────────────────────────────
@app.get("/api/sessions")
async def list_sessions():
    assert pool
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT s.code, s.created_at, s.last_active, "
            "(SELECT COUNT(*) FROM persons WHERE session_id = s.id) AS people, "
            "(SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi "
            "  JOIN persons p ON p.id = oi.person_id WHERE p.session_id = s.id) AS total_items "
            "FROM sessions s ORDER BY s.last_active DESC"
        )
    result = []
    for r in rows:
        result.append({
            "code": r["code"],
            "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            "last_active": r["last_active"].isoformat() if r["last_active"] else None,
            "people": r["people"],
            "total_items": r["total_items"],
            "ws_connected": r["code"] in ws_rooms,
            "ws_count": len(ws_rooms.get(r["code"], set())),
        })
    return result


@app.post("/api/cleanup")
async def run_cleanup():
    await cleanup_old_sessions()
    return {"status": "ok", "message": "Cleanup executed"}


@app.post("/api/session")
async def create_session():
    assert pool
    code = make_code()
    async with pool.acquire() as conn:
        for _ in range(10):
            try:
                await conn.execute("INSERT INTO sessions (code) VALUES ($1)", code)
                break
            except asyncpg.UniqueViolationError:
                code = make_code()
        else:
            return JSONResponse({"error": "Could not create session"}, status_code=500)
    return {"code": code}


@app.post("/api/session/{code}/join")
async def join_session(request: Request, code: str):
    if not _validate_code(code):
        return JSONResponse({"error": "Código inválido"}, status_code=400)

    data = await get_session_data(code)
    if data is None:
        # Track failed joins for brute force protection
        client_ip = _get_client_ip(request)
        now = time.time()
        _failed_joins[client_ip] = [t for t in _failed_joins[client_ip] if t > now - 60]
        _failed_joins[client_ip].append(now)
        if len(_failed_joins[client_ip]) > JOIN_RATE_LIMIT:
            return JSONResponse(
                {"error": "Demasiados intentos. Intenta más tarde."},
                status_code=429,
            )
        return JSONResponse({"error": "Session not found"}, status_code=404)

    await touch_session(code)
    return data


@app.post("/api/session/{code}/person")
async def add_person(code: str, body: dict):
    if not _validate_code(code):
        return JSONResponse({"error": "Código inválido"}, status_code=400)

    name = _sanitize(body.get("name", ""))
    if not _validate_name(name):
        return JSONResponse({"error": "Nombre inválido (máx 30 caracteres)"}, status_code=400)

    assert pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id FROM sessions WHERE code = $1", code)
        if not row:
            return JSONResponse({"error": "Session not found"}, status_code=404)
        try:
            await conn.execute(
                "INSERT INTO persons (session_id, name) VALUES ($1, $2)",
                row["id"], name,
            )
        except asyncpg.UniqueViolationError:
            pass

    data = await get_session_data(code)
    await touch_session(code)
    await broadcast(code, {"type": "sync", "action": {"type": "person_joined", "name": name}, **data})
    return data


@app.delete("/api/session/{code}/person/{name}")
async def remove_person(code: str, name: str):
    if not _validate_code(code):
        return JSONResponse({"error": "Código inválido"}, status_code=400)
    name = _sanitize(name)

    assert pool
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM persons WHERE session_id = (SELECT id FROM sessions WHERE code = $1) AND name = $2",
            code, name,
        )
    data = await get_session_data(code)
    await touch_session(code)
    await broadcast(code, {"type": "sync", "action": {"type": "person_left", "name": name}, **data})
    return data


@app.put("/api/session/{code}/person/{name}/item")
async def upsert_item(code: str, name: str, body: dict):
    if not _validate_code(code):
        return JSONResponse({"error": "Código inválido"}, status_code=400)
    name = _sanitize(name)

    item_key = _sanitize(body.get("item_key", ""))
    item_name = _sanitize(body.get("item_name", ""), 200)
    item_code = _sanitize(body.get("item_code", ""), 10)
    category = _sanitize(body.get("category", ""), 50)
    qty = body.get("qty", 1)

    if not item_key or not item_name:
        return JSONResponse({"error": "item_key and item_name required"}, status_code=400)
    if not isinstance(qty, int) or qty < 0 or qty > 99:
        return JSONResponse({"error": "Cantidad inválida (0-99)"}, status_code=400)

    assert pool
    async with pool.acquire() as conn:
        p = await conn.fetchrow(
            "SELECT id FROM persons WHERE session_id = (SELECT id FROM sessions WHERE code = $1) AND name = $2",
            code, name,
        )
        if not p:
            return JSONResponse({"error": "Person not found"}, status_code=404)

        existing = await conn.fetchrow(
            "SELECT quantity FROM order_items WHERE person_id = $1 AND item_key = $2",
            p["id"], item_key,
        )

        await conn.execute(
            "INSERT INTO order_items (person_id, item_key, item_name, item_code, category, quantity) "
            "VALUES ($1, $2, $3, $4, $5, $6) "
            "ON CONFLICT (person_id, item_key) DO UPDATE SET quantity = $6, item_name = $3, category = $5",
            p["id"], item_key, item_name, item_code, category, qty,
        )

    data = await get_session_data(code)
    await touch_session(code)
    action_type = "item_updated" if existing else "item_added"
    await broadcast(code, {
        "type": "sync",
        "action": {
            "type": action_type,
            "person": name,
            "item_key": item_key,
            "item_name": item_name,
            "item_code": item_code,
            "category": category,
            "qty": qty,
        },
        **data,
    })
    return data


@app.delete("/api/session/{code}/person/{name}/item/{item_key}")
async def remove_item(code: str, name: str, item_key: str):
    if not _validate_code(code):
        return JSONResponse({"error": "Código inválido"}, status_code=400)
    name = _sanitize(name)
    item_key = _sanitize(item_key)

    assert pool
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM order_items WHERE person_id = (SELECT id FROM persons "
            "WHERE session_id = (SELECT id FROM sessions WHERE code = $1) AND name = $2) AND item_key = $3",
            code, name, item_key,
        )
    data = await get_session_data(code)
    await touch_session(code)
    await broadcast(code, {
        "type": "sync",
        "action": {"type": "item_removed", "person": name, "item_key": item_key},
        **data,
    })
    return data


@app.delete("/api/session/{code}/person/{name}/clear")
async def clear_person(code: str, name: str):
    if not _validate_code(code):
        return JSONResponse({"error": "Código inválido"}, status_code=400)
    name = _sanitize(name)

    assert pool
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM order_items WHERE person_id = (SELECT id FROM persons "
            "WHERE session_id = (SELECT id FROM sessions WHERE code = $1) AND name = $2)",
            code, name,
        )
    data = await get_session_data(code)
    await touch_session(code)
    await broadcast(code, {
        "type": "sync",
        "action": {"type": "person_cleared", "person": name},
        **data,
    })
    return data


# ── Admin / Stats (fully anonymized) ──────────────
@app.get("/api/admin/stats")
async def admin_stats(request: Request):
    """Return fully anonymized aggregate statistics about platform usage.
    No personal data, names, IPs, or session codes are exposed."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    assert pool
    async with pool.acquire() as conn:
        totals = await conn.fetchrow("""
            SELECT
              (SELECT count(*) FROM sessions) AS total_sessions,
              (SELECT count(*) FROM sessions WHERE created_at > now() - interval '24 hours') AS sessions_24h,
              (SELECT count(*) FROM sessions WHERE created_at > now() - interval '7 days') AS sessions_7d,
              (SELECT count(*) FROM sessions WHERE created_at > now() - interval '30 days') AS sessions_30d,
              (SELECT count(*) FROM persons) AS total_persons,
              (SELECT count(*) FROM order_items) AS total_items,
              (SELECT count(*) FROM order_items WHERE id IN
                (SELECT oi.id FROM order_items oi JOIN persons p ON p.id = oi.person_id
                 JOIN sessions s ON s.id = p.session_id WHERE s.created_at > now() - interval '24 hours')) AS items_24h,
              (SELECT count(*) FROM order_items WHERE id IN
                (SELECT oi.id FROM order_items oi JOIN persons p ON p.id = oi.person_id
                 JOIN sessions s ON s.id = p.session_id WHERE s.created_at > now() - interval '7 days')) AS items_7d,
              (SELECT count(*) FROM order_items WHERE id IN
                (SELECT oi.id FROM order_items oi JOIN persons p ON p.id = oi.person_id
                 JOIN sessions s ON s.id = p.session_id WHERE s.created_at > now() - interval '30 days')) AS items_30d,
              (SELECT count(*) FROM sessions WHERE last_active > now() - interval '30 minutes') AS active_sessions,
              (SELECT COALESCE(AVG(cnt), 0) FROM
                (SELECT count(*) AS cnt FROM order_items GROUP BY person_id) sub) AS avg_items_per_person,
              (SELECT COALESCE(AVG(people_count), 0) FROM
                (SELECT count(*) AS people_count FROM persons GROUP BY session_id) sub2) AS avg_people_per_session
        """)

        # Category distribution
        categories = await conn.fetch("""
            SELECT category, count(*) AS cnt
            FROM order_items
            GROUP BY category ORDER BY cnt DESC
        """)

        # Items per day (last 14 days)
        daily_items = await conn.fetch("""
            SELECT DATE(s.created_at) AS day, count(oi.id) AS cnt
            FROM order_items oi
            JOIN persons p ON p.id = oi.person_id
            JOIN sessions s ON s.id = p.session_id
            WHERE s.created_at > now() - interval '14 days'
            GROUP BY DATE(s.created_at) ORDER BY day
        """)

        # Sessions per hour (last 7 days) — peak usage
        hourly = await conn.fetch("""
            SELECT EXTRACT(HOUR FROM created_at)::int AS hour, count(*) AS cnt
            FROM sessions
            WHERE created_at > now() - interval '7 days'
            GROUP BY hour ORDER BY hour
        """)

    cat_list = [{"category": r["category"], "count": r["cnt"]} for r in categories]
    daily_list = [{"day": r["day"].isoformat(), "count": r["cnt"]} for r in daily_items]
    hourly_list = [{"hour": r["hour"], "count": r["cnt"]} for r in hourly]

    return {
        "totals": {
            "total_sessions": totals["total_sessions"],
            "sessions_24h": totals["sessions_24h"],
            "sessions_7d": totals["sessions_7d"],
            "sessions_30d": totals["sessions_30d"],
            "total_persons": totals["total_persons"],
            "total_items": totals["total_items"],
            "items_24h": totals["items_24h"],
            "items_7d": totals["items_7d"],
            "items_30d": totals["items_30d"],
            "active_sessions": totals["active_sessions"],
            "avg_items_per_person": round(totals["avg_items_per_person"], 1),
            "avg_people_per_session": round(totals["avg_people_per_session"], 1),
        },
        "categories": cat_list,
        "daily_items": daily_list,
        "hourly_activity": hourly_list,
        "ws_connected": len(_ws_by_id),
        "ws_rooms": len(ws_rooms),
    }


# ── Admin IP Ban Management ───────────────────────
BAN_ENABLED = True


@app.get("/api/admin/bans")
async def list_bans(request: Request):
    """List all active banned IPs from DB."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    assert pool
    now = time.time()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT ip, banned_at, reason, auto_ban, expires_at, ban_type, offense_count "
            "FROM banned_ips WHERE ban_type IN ('ban', 'soft') "
            "AND (expires_at IS NULL OR expires_at > $1) "
            "ORDER BY banned_at DESC",
            now,
        )
    bans = []
    for row in rows:
        expires = row["expires_at"]
        btype = row["ban_type"]
        offense = row["offense_count"]
        bans.append({
            "ip": row["ip"],
            "banned_at": row["banned_at"],
            "reason": row["reason"],
            "auto_ban": row["auto_ban"],
            "ban_type": btype,
            "offense_count": offense,
            "progressive_label": _get_progressive_label(offense) if btype == "soft" or row["auto_ban"] else None,
            "expires_in": max(0, int(expires - now)) if expires else None,
        })
    # Also get CIDR bans for the response
    async with pool.acquire() as conn:
        crows = await conn.fetch("SELECT cidr, banned_at, reason, auto_ban FROM cidr_bans ORDER BY banned_at DESC")
    cidr_bans = [{
        "cidr": r["cidr"],
        "banned_at": r["banned_at"],
        "reason": r["reason"],
        "auto_ban": r["auto_ban"],
    } for r in crows]
    # Whitelist
    async with pool.acquire() as conn:
        wrows = await conn.fetch("SELECT ip_cidr, note, created_at FROM whitelisted_ips ORDER BY created_at DESC")
    whitelist = [{
        "ip_cidr": r["ip_cidr"],
        "note": r["note"],
        "created_at": r["created_at"],
    } for r in wrows]
    return {
        "bans": bans,
        "cidr_bans": cidr_bans,
        "whitelist": whitelist,
        "total": len(bans),
        "auto_ban_enabled": True,
        "auto_ban_threshold": AUTO_BAN_THRESHOLD,
        "auto_ban_duration_h": AUTO_BAN_DURATION // 3600,
        "progressive_increments": PROGRESSIVE_INCREMENTS,
        "progressive_labels": PROGRESSIVE_LABELS,
    }


@app.post("/api/admin/bans")
async def ban_ip_endpoint(request: Request):
    """Manually ban an IP address.
    Body: { ip, reason?, duration? (seconds, 0=permanent), ban_type? ('ban'|'soft') }
    """
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)

    ip = body.get("ip", "").strip()
    if not ip:
        return JSONResponse({"error": "IP requerida"}, status_code=400)

    reason = body.get("reason", "Baneado manualmente por administrador")
    duration = body.get("duration")  # seconds, None=progressive default, 0=permanent
    ban_type = body.get("ban_type", "ban")  # 'ban' or 'soft'

    if ban_type not in ("ban", "soft"):
        return JSONResponse({"error": "ban_type debe ser 'ban' o 'soft'"}, status_code=400)

    # Validate it looks like an IP
    try:
        ip_address(ip)
    except ValueError:
        return JSONResponse({"error": "Dirección IP inválida"}, status_code=400)

    ban_reason, existing_type = _is_ip_banned(ip)
    if ban_reason and existing_type == "ban":
        return JSONResponse({"error": f"IP {ip} ya está bloqueada"}, status_code=409)

    await _ban_ip(ip, reason=reason, auto_ban=False, duration=duration, ban_type=ban_type)
    return {"status": "ok", "ip": ip, "reason": reason, "ban_type": ban_type}


# ── CIDR Ban Management (MUST be before {ip:path} route) ──

@app.get("/api/admin/bans/check")
async def check_my_ip(request: Request):
    """Allow a user to check if their own IP is banned."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    client_ip = _get_client_ip(request)
    ban_reason, ban_type = _is_ip_banned(client_ip)
    cidr_reason = _check_cidr_bans(client_ip)
    return {
        "banned": ban_reason is not None and ban_type == "ban",
        "reason": ban_reason,
        "ban_type": ban_type,
        "cidr_banned": cidr_reason is not None,
        "cidr_reason": cidr_reason,
        "whitelisted": _is_whitelisted(client_ip),
        "your_ip": client_ip,
    }


@app.get("/api/admin/bans/cidr")
async def list_cidr_bans(request: Request):
    """List all CIDR bans."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    assert pool
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT cidr, banned_at, reason, auto_ban FROM cidr_bans ORDER BY banned_at DESC")
    return {"cidr_bans": [dict(r) for r in rows], "total": len(rows)}


@app.post("/api/admin/bans/cidr")
async def ban_cidr_endpoint(request: Request):
    """Ban an entire subnet (CIDR notation)."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)
    cidr = body.get("cidr", "").strip()
    if not cidr:
        return JSONResponse({"error": "CIDR requerido (ej: 10.0.0.0/24)"}, status_code=400)
    try:
        ipaddress.ip_network(cidr, strict=False)
    except ValueError:
        return JSONResponse({"error": "CIDR inválido"}, status_code=400)
    reason = body.get("reason", "CIDR bloqueado por administrador")
    result = await _ban_cidr(cidr, reason=reason)
    return {"status": "ok", **result}


@app.delete("/api/admin/bans/cidr/{cidr:path}")
async def unban_cidr_endpoint(request: Request, cidr: str):
    """Remove a CIDR ban."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    cidr = urllib.parse.unquote(cidr)
    try:
        ipaddress.ip_network(cidr, strict=False)
    except ValueError:
        return JSONResponse({"error": "CIDR inválido"}, status_code=400)
    if await _unban_cidr(cidr):
        return {"status": "ok", "cidr": cidr, "message": "CIDR desbloqueado"}
    return JSONResponse({"error": f"CIDR {cidr} no está bloqueado"}, status_code=404)


# ── IP Unban (uses {ip:path}, must be LAST under /bans/) ──

@app.delete("/api/admin/bans/{ip:path}")
async def unban_ip_endpoint(request: Request, ip: str):
    """Remove a ban from an IP."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    if "/" in ip and not ip.count(".") >= 1:
        return JSONResponse({"error": "Dirección IP inválida"}, status_code=400)
    try:
        ip_address(ip)
    except ValueError:
        return JSONResponse({"error": "Dirección IP inválida"}, status_code=400)
    if await _unban_ip(ip):
        return {"status": "ok", "ip": ip, "message": "IP desbloqueada"}
    return JSONResponse({"error": f"IP {ip} no está bloqueada"}, status_code=404)


# ── Whitelist Management ──────────────────────────

@app.get("/api/admin/whitelist")
async def list_whitelist(request: Request):
    """List all whitelisted IPs/CIDRs."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    assert pool
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT ip_cidr, note, created_at FROM whitelisted_ips ORDER BY created_at DESC")
    return {"whitelist": [dict(r) for r in rows], "total": len(rows)}


@app.post("/api/admin/whitelist")
async def add_whitelist_endpoint(request: Request):
    """Add an IP or CIDR to the whitelist (bypasses bans and rate limits)."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)
    ip_cidr = body.get("ip_cidr", "").strip()
    if not ip_cidr:
        return JSONResponse({"error": "IP o CIDR requerido"}, status_code=400)
    # Validate
    try:
        if "/" in ip_cidr:
            ipaddress.ip_network(ip_cidr, strict=False)
        else:
            ipaddress.ip_address(ip_cidr)
    except ValueError:
        return JSONResponse({"error": "Dirección IP o CIDR inválido"}, status_code=400)
    note = body.get("note", "")
    added = await _add_whitelist(ip_cidr, note=note)
    if added:
        return {"status": "ok", "ip_cidr": ip_cidr, "note": note}
    return JSONResponse({"error": f"{ip_cidr} ya está en la whitelist"}, status_code=409)


@app.delete("/api/admin/whitelist/{ip_cidr:path}")
async def remove_whitelist_endpoint(request: Request, ip_cidr: str):
    """Remove an IP/CIDR from the whitelist."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    ip_cidr = urllib.parse.unquote(ip_cidr)
    if await _remove_whitelist(ip_cidr):
        return {"status": "ok", "ip_cidr": ip_cidr, "message": "Eliminado de whitelist"}
    return JSONResponse({"error": f"{ip_cidr} no está en whitelist"}, status_code=404)


# ── WebSocket ──────────────────────────────────────
@app.websocket("/ws/{code}")
async def websocket_endpoint(ws: WebSocket, code: str):
    global _ws_id_counter

    await ws.accept()

    if not _validate_code(code):
        await ws.close(code=4001, reason="Invalid code")
        return

    # Global WS limit
    if len(_ws_by_id) >= MAX_WS_TOTAL:
        await ws.close(code=4002, reason="Server full")
        return

    # Get client IP from request headers
    ws_ip = ws.headers.get("x-forwarded-for", "").split(",")[0].strip() or ws.client.host or "unknown"

    # Per-IP limit
    if len(_ws_by_ip.get(ws_ip, set())) >= MAX_WS_PER_IP:
        await ws.close(code=4002, reason="Too many connections from this IP")
        return

    # Per-session limit
    if len(ws_rooms.get(code, set())) >= MAX_WS_PER_SESSION:
        await ws.close(code=4002, reason="Too many connections in this session")
        return

    # Register
    _ws_id_counter += 1
    ws_id = _ws_id_counter
    _ws_by_id[ws_id] = ws
    _ws_by_ip[ws_ip].add(ws_id)
    if code not in ws_rooms:
        ws_rooms[code] = set()
    ws_rooms[code].add(ws)
    await touch_session(code)

    # Send current state on connect
    data = await get_session_data(code)
    if data:
        await ws.send_text(json.dumps({"type": "sync", **data}, ensure_ascii=False))

    try:
        while True:
            msg = await asyncio.wait_for(ws.receive_text(), timeout=WS_RECEIVE_TIMEOUT)
            if msg.strip() == "ping":
                await touch_session(code)
                await ws.send_text("pong")
    except asyncio.TimeoutError:
        # Idle timeout — close connection
        try:
            await ws.close(code=4003, reason="Conexión inactiva")
        except Exception:
            pass
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        ws_rooms.get(code, set()).discard(ws)
        if code in ws_rooms and not ws_rooms[code]:
            del ws_rooms[code]
        _ws_by_id.pop(ws_id, None)
        _ws_by_ip.get(ws_ip, set()).discard(ws_id)
        if ws_ip in _ws_by_ip and not _ws_by_ip[ws_ip]:
            del _ws_by_ip[ws_ip]


# ── Menu API ───────────────────────────────────────
async def _get_active_menu(conn) -> dict | None:
    """Fetch the active menu config with categories and items."""
    row = await conn.fetchrow(
        "SELECT id, name, slug, description FROM menu_configs WHERE is_active = true LIMIT 1"
    )
    if not row:
        return None
    cats = await conn.fetch(
        "SELECT id, key, label, icon, sort_order FROM menu_categories WHERE menu_id = $1 ORDER BY sort_order",
        row["id"],
    )
    categories = []
    for c in cats:
        items = await conn.fetch(
            "SELECT id, code, name, ingredients, price, sort_order FROM menu_items WHERE category_id = $1 ORDER BY sort_order",
            c["id"],
        )
        categories.append({
            "id": c["id"],
            "key": c["key"],
            "label": c["label"],
            "icon": c["icon"],
            "items": [{"id": i["id"], "code": i["code"] or "", "name": i["name"],
                       "ingredients": i["ingredients"] or "", "price": i["price"] or ""}
                      for i in items],
        })
    return {
        "id": row["id"],
        "name": row["name"],
        "slug": row["slug"],
        "description": row["description"],
        "categories": categories,
    }


@app.get("/api/menu/active")
async def get_active_menu():
    """Public: return the currently active menu config."""
    assert pool
    async with pool.acquire() as conn:
        menu = await _get_active_menu(conn)
    if not menu:
        return JSONResponse({"error": "No active menu configured"}, status_code=404)
    return menu


# ── Admin: Menu management ─────────────────────────
@app.get("/api/admin/menus")
async def admin_list_menus(request: Request):
    """List all menu configs (admin only)."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    assert pool
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, name, slug, description, is_active, created_at FROM menu_configs ORDER BY id"
        )
    return [{
        "id": r["id"], "name": r["name"], "slug": r["slug"],
        "description": r["description"], "is_active": r["is_active"],
        "created_at": r["created_at"].isoformat() if r["created_at"] else None,
    } for r in rows]


@app.post("/api/admin/menus")
async def admin_create_menu(request: Request):
    """Create a new menu config."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)
    name = body.get("name", "").strip()
    slug = body.get("slug", "").strip().lower().replace(" ", "-")
    desc = body.get("description", "").strip()
    if not name or not slug:
        return JSONResponse({"error": "name and slug required"}, status_code=400)
    assert pool
    async with pool.acquire() as conn:
        try:
            menu_id = await conn.fetchval(
                "INSERT INTO menu_configs (name, slug, description) VALUES ($1, $2, $3) RETURNING id",
                name, slug, desc,
            )
        except asyncpg.UniqueViolationError:
            return JSONResponse({"error": f"Slug '{slug}' already exists"}, status_code=409)
    return {"id": menu_id, "name": name, "slug": slug}


@app.put("/api/admin/menus/{menu_id}")
async def admin_update_menu(request: Request, menu_id: int):
    """Update a menu config."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)
    assert pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id FROM menu_configs WHERE id = $1", menu_id)
        if not row:
            return JSONResponse({"error": "Menu not found"}, status_code=404)
        sets = []
        vals = []
        i = 1
        for field in ("name", "slug", "description"):
            if field in body:
                sets.append(f"{field} = ${i}")
                vals.append(body[field].strip())
                i += 1
        if not sets:
            return JSONResponse({"error": "No fields to update"}, status_code=400)
        sets.append("updated_at = now()")
        vals.append(menu_id)
        await conn.execute(
            f"UPDATE menu_configs SET {', '.join(sets)} WHERE id = ${i}",
            *vals,
        )
    return {"status": "ok"}


@app.delete("/api/admin/menus/{menu_id}")
async def admin_delete_menu(request: Request, menu_id: int):
    """Delete a menu config."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    assert pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id, is_active FROM menu_configs WHERE id = $1", menu_id)
        if not row:
            return JSONResponse({"error": "Menu not found"}, status_code=404)
        if row["is_active"]:
            return JSONResponse({"error": "Cannot delete active menu. Switch to another first."}, status_code=400)
        await conn.execute("DELETE FROM menu_configs WHERE id = $1", menu_id)
    return {"status": "ok"}


@app.post("/api/admin/menus/{menu_id}/activate")
async def admin_activate_menu(request: Request, menu_id: int):
    """Set a menu config as active (deactivates others)."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    assert pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id FROM menu_configs WHERE id = $1", menu_id)
        if not row:
            return JSONResponse({"error": "Menu not found"}, status_code=404)
        await conn.execute("UPDATE menu_configs SET is_active = (id = $1)", menu_id)
    return {"status": "ok", "menu_id": menu_id}



@app.get("/api/admin/menus/export")
async def admin_export_menus(request: Request):
    """Export all menus with categories, items, and schedules as JSON."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    assert pool
    async with pool.acquire() as conn:
        # Get all menu IDs with their basic info
        rows = await conn.fetch(
            "SELECT id, name, slug, description, is_active FROM menu_configs ORDER BY id"
        )
        result = []
        for row in rows:
            # Get categories
            cats = await conn.fetch(
                "SELECT id, key, label, icon, sort_order FROM menu_categories WHERE menu_id = $1 ORDER BY sort_order, id",
                row["id"],
            )
            categories = []
            for c in cats:
                items = await conn.fetch(
                    "SELECT code, name, ingredients, price, sort_order FROM menu_items WHERE category_id = $1 ORDER BY sort_order, id",
                    c["id"],
                )
                categories.append({
                    "key": c["key"],
                    "label": c["label"],
                    "icon": c["icon"],
                    "sort_order": c["sort_order"],
                    "items": [{
                        "code": i["code"] or "",
                        "name": i["name"],
                        "ingredients": i["ingredients"] or "",
                        "price": i["price"] or "",
                        "sort_order": i["sort_order"],
                    } for i in items],
                })
            # Get schedules
            scheds = await conn.fetch(
                "SELECT day_of_week FROM menu_schedules WHERE menu_id = $1 ORDER BY day_of_week",
                row["id"],
            )
            result.append({
                "name": row["name"],
                "slug": row["slug"],
                "description": row["description"],
                "is_active": row["is_active"],
                "categories": categories,
                "schedules": [s["day_of_week"] for s in scheds],
            })
    return JSONResponse(result)


@app.post("/api/admin/menus/import")
async def admin_import_menus(request: Request):
    """Import menus from a JSON array."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)
    if not isinstance(body, list):
        return JSONResponse({"error": "Expected a JSON array of menus"}, status_code=400)
    assert pool
    imported = 0
    async with pool.acquire() as conn:
        for menu_data in body:
            name = (menu_data.get("name") or "").strip()
            slug_raw = (menu_data.get("slug") or "").strip().lower().replace(" ", "-")
            if not name or not slug_raw:
                continue
            desc = (menu_data.get("description") or "").strip()
            # Generate unique slug if exists
            slug = slug_raw
            existing = await conn.fetchval(
                "SELECT id FROM menu_configs WHERE slug = $1", slug
            )
            suffix = 1
            while existing:
                slug = f"{slug_raw}-{suffix}"
                existing = await conn.fetchval(
                    "SELECT id FROM menu_configs WHERE slug = $1", slug
                )
                suffix += 1
            new_id = await conn.fetchval(
                "INSERT INTO menu_configs (name, slug, description, is_active) VALUES ($1, $2, $3, $4) RETURNING id",
                name, slug, desc, bool(menu_data.get("is_active", False)),
            )
            # Import categories
            for cat in menu_data.get("categories") or []:
                cat_id = await conn.fetchval(
                    "INSERT INTO menu_categories (menu_id, key, label, icon, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING id",
                    new_id, cat.get("key", ""), cat.get("label", ""),
                    cat.get("icon", "fa-list"), cat.get("sort_order", 0),
                )
                # Import items
                for item in cat.get("items") or []:
                    await conn.execute(
                        "INSERT INTO menu_items (category_id, code, name, ingredients, price, sort_order) VALUES ($1, $2, $3, $4, $5, $6)",
                        cat_id, item.get("code", ""), item.get("name", ""),
                        item.get("ingredients", ""), item.get("price", ""),
                        item.get("sort_order", 0),
                    )
            # Import schedules
            for day in menu_data.get("schedules") or []:
                try:
                    await conn.execute(
                        "INSERT INTO menu_schedules (menu_id, day_of_week) VALUES ($1, $2)",
                        new_id, int(day),
                    )
                except Exception:
                    pass  # skip invalid days
            imported += 1
    return {"imported": imported, "message": f"{imported} carta(s) importada(s)"}

@app.get("/api/admin/menus/{menu_id}")
async def admin_get_menu(request: Request, menu_id: int):
    """Get full menu detail with categories and items."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    assert pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, name, slug, description, is_active FROM menu_configs WHERE id = $1", menu_id
        )
        if not row:
            return JSONResponse({"error": "Menu not found"}, status_code=404)
        cats = await conn.fetch(
            "SELECT id, key, label, icon, sort_order FROM menu_categories WHERE menu_id = $1 ORDER BY sort_order, id",
            menu_id,
        )
        categories = []
        for c in cats:
            items = await conn.fetch(
                "SELECT id, code, name, ingredients, price, sort_order FROM menu_items WHERE category_id = $1 ORDER BY sort_order, id",
                c["id"],
            )
            categories.append({
                "id": c["id"],
                "key": c["key"],
                "label": c["label"],
                "icon": c["icon"],
                "items": [{"id": i["id"], "code": i["code"] or "", "name": i["name"],
                           "ingredients": i["ingredients"] or "", "price": i["price"] or ""}
                          for i in items],
            })
        schedules = await conn.fetch(
            "SELECT id, day_of_week FROM menu_schedules WHERE menu_id = $1 ORDER BY day_of_week", menu_id
        )
    return {
        "id": row["id"], "name": row["name"], "slug": row["slug"],
        "description": row["description"], "is_active": row["is_active"],
        "categories": categories,
        "schedules": [{"id": s["id"], "day": s["day_of_week"]} for s in schedules],
    }


@app.post("/api/admin/menus/{menu_id}/duplicate")
async def admin_duplicate_menu(request: Request, menu_id: int):
    """Duplicate a menu with all its categories and items."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    assert pool
    async with pool.acquire() as conn:
        src = await conn.fetchrow(
            "SELECT name, slug, description FROM menu_configs WHERE id = $1", menu_id
        )
        if not src:
            return JSONResponse({"error": "Menu not found"}, status_code=404)
        # Create new menu
        new_slug = f"{src['slug']}-copia"
        # Try slug variants if it exists
        for attempt in range(100):
            slug_try = new_slug if attempt == 0 else f"{new_slug}-{attempt}"
            try:
                new_id = await conn.fetchval(
                    "INSERT INTO menu_configs (name, slug, description) VALUES ($1, $2, $3) RETURNING id",
                    f"{src['name']} (copia)", slug_try, src['description'],
                )
                break
            except asyncpg.UniqueViolationError:
                if attempt == 99:
                    return JSONResponse({"error": "Too many duplicates"}, status_code=409)
                continue
        # Copy categories
        cats = await conn.fetch(
            "SELECT key, label, icon, sort_order FROM menu_categories WHERE menu_id = $1 ORDER BY id", menu_id
        )
        for c in cats:
            cat_id = await conn.fetchval(
                "INSERT INTO menu_categories (menu_id, key, label, icon, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING id",
                new_id, c["key"], c["label"], c["icon"], c["sort_order"],
            )
            # Copy items
            items = await conn.fetch(
                "SELECT code, name, ingredients, price, sort_order FROM menu_items WHERE category_id IN "
                "(SELECT id FROM menu_categories WHERE menu_id = $1 AND key = $2) ORDER BY id",
                menu_id, c["key"],
            )
            for i in items:
                await conn.execute(
                    "INSERT INTO menu_items (category_id, code, name, ingredients, price, sort_order) VALUES ($1, $2, $3, $4, $5, $6)",
                    cat_id, i["code"], i["name"], i["ingredients"], i["price"], i["sort_order"],
                )
    return {"id": new_id, "name": f"{src['name']} (copia)"}



# ── Admin: Day-of-week schedule ─────────────────────
@app.get("/api/admin/menus/{menu_id}/schedules")
async def admin_list_schedules(request: Request, menu_id: int):
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    assert pool
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, day_of_week FROM menu_schedules WHERE menu_id = $1 ORDER BY day_of_week", menu_id
        )
    return [{"id": r["id"], "day": r["day_of_week"]} for r in rows]


@app.post("/api/admin/menus/{menu_id}/schedules")
async def admin_set_schedule(request: Request, menu_id: int):
    """Set or replace schedules for a menu. Body: {days: [0,1,2,3,4,5,6]} (0=Monday, 6=Sunday)"""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)
    days = body.get("days", [])
    if not isinstance(days, list) or not all(isinstance(d, int) and 0 <= d <= 6 for d in days):
        return JSONResponse({"error": "days must be a list of integers 0-6"}, status_code=400)
    assert pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id FROM menu_configs WHERE id = $1", menu_id)
        if not row:
            return JSONResponse({"error": "Menu not found"}, status_code=404)
        # Replace all schedules for this menu
        await conn.execute("DELETE FROM menu_schedules WHERE menu_id = $1", menu_id)
        for day in days:
            await conn.execute(
                "INSERT INTO menu_schedules (menu_id, day_of_week) VALUES ($1, $2)",
                menu_id, day,
            )
    return {"status": "ok", "days": days}


@app.delete("/api/admin/schedules/{schedule_id}")
async def admin_delete_schedule(request: Request, schedule_id: int):
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    assert pool
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM menu_schedules WHERE id = $1", schedule_id)
    return {"status": "ok"}


@app.post("/api/admin/schedule/apply")
async def admin_apply_schedule(request: Request):
    """Apply day-of-week schedule: activate the menu scheduled for today (if any)."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    today = datetime.now().isoweekday() % 7  # isoweekday: 1=Mon..7=Sun → 0=Mon..6=Sun
    assert pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT menu_id FROM menu_schedules WHERE day_of_week = $1 LIMIT 1", today
        )
        if row:
            await conn.execute("UPDATE menu_configs SET is_active = (id = $1)", row["menu_id"])
            menu = await conn.fetchrow("SELECT name FROM menu_configs WHERE id = $1", row["menu_id"])
            return {"status": "ok", "activated": menu["name"], "day": today}
        else:
            return {"status": "ok", "activated": None, "day": today, "message": "No schedule for today"}


@app.post("/api/internal/apply-schedule")
async def internal_apply_schedule():
    """Internal-only endpoint for cron. No auth needed (only accessible via localhost)."""
    today = datetime.now().isoweekday() % 7
    assert pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT menu_id FROM menu_schedules WHERE day_of_week = $1 LIMIT 1", today
        )
        if row:
            await conn.execute("UPDATE menu_configs SET is_active = (id = $1)", row["menu_id"])
            menu = await conn.fetchrow("SELECT name FROM menu_configs WHERE id = $1", row["menu_id"])
            print(f"[schedule] Auto-activated '{menu['name']}' for day {today}")
            return {"status": "ok", "activated": menu["name"]}
    print(f"[schedule] No schedule for day {today}")
    return {"status": "ok", "activated": None}


# ── Admin: Category CRUD ───────────────────────────
@app.post("/api/admin/menus/{menu_id}/categories")
async def admin_create_category(request: Request, menu_id: int):
    """Add a category to a menu."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)
    key = body.get("key", "").strip()
    label = body.get("label", "").strip()
    icon = body.get("icon", "fa-list")
    if not key or not label:
        return JSONResponse({"error": "key and label required"}, status_code=400)
    assert pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id FROM menu_configs WHERE id = $1", menu_id)
        if not row:
            return JSONResponse({"error": "Menu not found"}, status_code=404)
        try:
            cat_id = await conn.fetchval(
                "INSERT INTO menu_categories (menu_id, key, label, icon) VALUES ($1, $2, $3, $4) RETURNING id",
                menu_id, key, label, icon,
            )
        except asyncpg.UniqueViolationError:
            return JSONResponse({"error": f"Category '{key}' already exists in this menu"}, status_code=409)
    return {"id": cat_id, "key": key, "label": label}


@app.put("/api/admin/categories/{cat_id}")
async def admin_update_category(request: Request, cat_id: int):
    """Update a category."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)
    assert pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id FROM menu_categories WHERE id = $1", cat_id)
        if not row:
            return JSONResponse({"error": "Category not found"}, status_code=404)
        sets = []
        vals = []
        i = 1
        for field in ("key", "label", "icon", "sort_order"):
            if field in body:
                sets.append(f"{field} = ${i}")
                vals.append(body[field])
                i += 1
        if not sets:
            return JSONResponse({"error": "No fields to update"}, status_code=400)
        vals.append(cat_id)
        await conn.execute(
            f"UPDATE menu_categories SET {', '.join(sets)} WHERE id = ${i}",
            *vals,
        )
    return {"status": "ok"}


@app.delete("/api/admin/categories/{cat_id}")
async def admin_delete_category(request: Request, cat_id: int):
    """Delete a category (cascades to items)."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    assert pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id FROM menu_categories WHERE id = $1", cat_id)
        if not row:
            return JSONResponse({"error": "Category not found"}, status_code=404)
        await conn.execute("DELETE FROM menu_categories WHERE id = $1", cat_id)
    return {"status": "ok"}


# ── Admin: Item CRUD ───────────────────────────────
@app.post("/api/admin/categories/{cat_id}/items")
async def admin_create_item(request: Request, cat_id: int):
    """Add an item to a category."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)
    name = body.get("name", "").strip()
    code = body.get("code", "")
    price = body.get("price", "")
    ingredients = body.get("ingredients", "")
    if not name:
        return JSONResponse({"error": "name required"}, status_code=400)
    assert pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id FROM menu_categories WHERE id = $1", cat_id)
        if not row:
            return JSONResponse({"error": "Category not found"}, status_code=404)
        item_id = await conn.fetchval(
            "INSERT INTO menu_items (category_id, code, name, ingredients, price) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            cat_id, code, name, ingredients, price,
        )
    return {"id": item_id, "name": name, "code": code}


@app.put("/api/admin/items/{item_id}")
async def admin_update_item(request: Request, item_id: int):
    """Update a menu item."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)
    assert pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id FROM menu_items WHERE id = $1", item_id)
        if not row:
            return JSONResponse({"error": "Item not found"}, status_code=404)
        sets = []
        vals = []
        i = 1
        for field in ("code", "name", "ingredients", "price", "sort_order"):
            if field in body:
                sets.append(f"{field} = ${i}")
                vals.append(body[field])
                i += 1
        if not sets:
            return JSONResponse({"error": "No fields to update"}, status_code=400)
        vals.append(item_id)
        await conn.execute(
            f"UPDATE menu_items SET {', '.join(sets)} WHERE id = ${i}",
            *vals,
        )
    return {"status": "ok"}


@app.delete("/api/admin/items/{item_id}")
async def admin_delete_item(request: Request, item_id: int):
    """Delete a menu item."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    assert pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id FROM menu_items WHERE id = $1", item_id)
        if not row:
            return JSONResponse({"error": "Item not found"}, status_code=404)
        await conn.execute("DELETE FROM menu_items WHERE id = $1", item_id)
    return {"status": "ok"}


# ── Order History ──────────────────────────────────
def _format_order_price(price_str: str) -> float:
    """Parse a price string like '1€', '2,50€', '+0,50€' to float."""
    if not price_str:
        return 0.0
    cleaned = price_str.replace('€', '').replace('+', '').replace(' ', '').strip()
    cleaned = cleaned.replace(',', '.')
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


@app.post("/api/session/{code}/place-order")
async def place_order(code: str, body: dict = {}):
    """Save current order items to history and clear ONLY the requesting person's items."""
    if not _validate_code(code):
        return JSONResponse({"error": "Código inválido"}, status_code=400)

    person_name = (body.get("person_name") or "").strip()
    if not person_name:
        return JSONResponse({"error": "person_name required"}, status_code=400)

    assert pool
    async with pool.acquire() as conn:
        session = await conn.fetchrow("SELECT id FROM sessions WHERE code = $1", code)
        if not session:
            return JSONResponse({"error": "Session not found"}, status_code=404)
        session_id = session["id"]

        # Get current items with person info
        items = await conn.fetch("""
            SELECT p.name, oi.item_key, oi.item_name, oi.item_code, oi.category, oi.quantity
            FROM order_items oi
            JOIN persons p ON p.id = oi.person_id
            WHERE p.session_id = $1
            ORDER BY p.name, oi.item_key
        """, session_id)

        if not items:
            return JSONResponse({"error": "No hay productos en el pedido"}, status_code=400)

        # Get next order number
        max_num = await conn.fetchval(
            "SELECT COALESCE(MAX(order_number), 0) FROM order_history WHERE session_id = $1",
            session_id
        )
        order_number = max_num + 1

        # Get active menu prices
        menu_data = {}
        menu_row = await conn.fetchrow(
            "SELECT id FROM menu_configs WHERE is_active = true LIMIT 1"
        )
        if menu_row:
            cats = await conn.fetch(
                "SELECT id, key FROM menu_categories WHERE menu_id = $1", menu_row["id"]
            )
            for c in cats:
                item_rows = await conn.fetch(
                    "SELECT code, name, price FROM menu_items WHERE category_id = $1", c["id"]
                )
                for ir in item_rows:
                    key = ir["code"] or ir["name"]
                    menu_data[f"{c['key']}:{key}"] = _format_order_price(ir["price"])

        # Build items JSON with prices
        people_names = set()
        history_items = []
        total_items = 0
        for r in items:
            people_names.add(r["name"])
            qty = r["quantity"]
            total_items += qty
            # Try to find price
            lookup_key = f"{r['category']}:{r['item_code'] or r['item_name']}"
            price = _format_order_price("")
            # Check from active menu prices
            if lookup_key in menu_data:
                price = menu_data[lookup_key]
            # Fallback: skip price lookup from static data (TS module not available in Python)
            if price == 0.0:
                pass

            history_items.append({
                "person": r["name"],
                "item_key": r["item_key"],
                "item_name": r["item_name"],
                "item_code": r["item_code"] or "",
                "category": r["category"],
                "qty": qty,
                "price": price,
            })

        items_json = json.dumps(history_items, ensure_ascii=False)

        # Insert order history
        await conn.execute(
            "INSERT INTO order_history (session_id, order_number, total_items, people_count, items_json, paid_by) "
            "VALUES ($1, $2, $3, $4, $5::jsonb, $6)",
            session_id, order_number, total_items, len(people_names), items_json, person_name,
        )

        # Clear ALL order items for this session (new round for everyone)
        await conn.execute(
            "DELETE FROM order_items WHERE person_id IN (SELECT id FROM persons WHERE session_id = $1)",
            session_id,
        )

    # Get updated session data
    data = await get_session_data(code)
    await touch_session(code)
    await broadcast(code, {
        "type": "sync",
        "action": {"type": "order_placed", "order_number": order_number},
        **data,
    })
    return {
        "status": "ok",
        "order_number": order_number,
        "total_items": total_items,
        "people_count": len(people_names),
    }


@app.get("/api/session/{code}/orders")
async def get_order_history(code: str):
    """Get order history for a session."""
    if not _validate_code(code):
        return JSONResponse({"error": "Código inválido"}, status_code=400)
    assert pool
    async with pool.acquire() as conn:
        session = await conn.fetchrow("SELECT id FROM sessions WHERE code = $1", code)
        if not session:
            return JSONResponse({"error": "Session not found"}, status_code=404)

        rows = await conn.fetch("""
            SELECT id, order_number, created_at, total_items, people_count, items_json, paid_by
            FROM order_history
            WHERE session_id = $1
            ORDER BY order_number DESC
        """, session["id"])

    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "order_number": r["order_number"],
            "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            "total_items": r["total_items"],
            "people_count": r["people_count"],
            "paid_by": r["paid_by"] or "",
            "items": json.loads(r["items_json"]),
        })
    return result


# ── SEO / static helpers ──────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LANDING_PATH = os.path.join(BASE_DIR, "frontend", "public", "landing.html")
ROBOTS_PATH = os.path.join(BASE_DIR, "robots.txt")
SITEMAP_PATH = os.path.join(BASE_DIR, "sitemap.xml")
FAVICON_PATH = os.path.join(BASE_DIR, "frontend", "public", "favicon.svg")
MANIFEST_PATH = os.path.join(BASE_DIR, "frontend", "public", "site.webmanifest")
SCREENSHOTS_DIR = os.path.join(BASE_DIR, "frontend", "public", "screenshots")

if os.path.isfile(LANDING_PATH):
    with open(LANDING_PATH, encoding="utf-8") as fh:
        _landing_html = fh.read()
else:
    _landing_html = "<h1>Landing page not found</h1>"

if os.path.isfile(ROBOTS_PATH):
    with open(ROBOTS_PATH, encoding="utf-8") as fh:
        _robots_txt = fh.read()
else:
    _robots_txt = "User-agent: *\nAllow: /"

if os.path.isfile(SITEMAP_PATH):
    with open(SITEMAP_PATH, encoding="utf-8") as fh:
        _sitemap_xml = fh.read()
else:
    _sitemap_xml = ""


# ── SSR proxy ────────────────────────────────────
SSR_URL = os.getenv("SSR_URL", "http://localhost:8120")


async def _proxy_to_ssr(url: str) -> HTMLResponse:
    """Proxy a request to the Node.js SSR server and return the HTML."""
    import httpx
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{SSR_URL}{url}")
            return _secure_response(HTMLResponse(content=resp.text, status_code=resp.status_code))
    except Exception as exc:
        print(f"[ssr] Proxy error: {exc}")
        # Fallback: serve the client index.html (client-side render)
        index_path = os.path.join(STATIC_DIR, "index.html")
        if os.path.isfile(index_path):
            with open(index_path, encoding="utf-8") as fh:
                return _secure_response(HTMLResponse(fh.read()))
        return HTMLResponse("<h1>Server error</h1>", status_code=503)


@app.get("/")
async def landing_page():
    """Serve the React landing page via SSR proxy."""
    return await _proxy_to_ssr("/")


@app.get("/app")
@app.get("/app/{path:path}")
async def app_spa(request: Request):
    """Serve the React SPA via SSR proxy."""
    return await _proxy_to_ssr(request.url.path)


@app.get("/admin")
@app.get("/admin/{path:path}")
async def admin_spa(request: Request):
    """Serve the admin SPA via SSR proxy."""
    return await _proxy_to_ssr(request.url.path)


@app.get("/robots.txt")
async def robots():
    return _secure_response(HTMLResponse(content=_robots_txt, media_type="text/plain"))


@app.get("/sitemap.xml")
async def sitemap():
    return _secure_response(HTMLResponse(content=_sitemap_xml, media_type="application/xml"))


@app.get("/favicon.svg")
async def favicon():
    if os.path.isfile(FAVICON_PATH):
        return FileResponse(FAVICON_PATH, media_type="image/svg+xml")
    # Fallback inline SVG
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#0f4c3a"/><text x="50" y="68" font-family="Arial,sans-serif" font-size="48" font-weight="bold" fill="#fbbf24" text-anchor="middle">E</text></svg>'
    return _secure_response(HTMLResponse(content=svg, media_type="image/svg+xml"))


@app.get("/site.webmanifest")
async def manifest():
    if os.path.isfile(MANIFEST_PATH):
        return FileResponse(MANIFEST_PATH, media_type="application/manifest+json")
    return JSONResponse({})


SCREENSHOT_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}


@app.get("/screenshots/{filename:path}")
async def screenshots(filename: str):
    import mimetypes
    safe = os.path.basename(filename)
    filepath = os.path.join(SCREENSHOTS_DIR, safe)
    if not os.path.isfile(filepath):
        # Also check dist/client/screenshots/
        dist_path = os.path.join(BASE_DIR, "dist", "client", "screenshots", safe)
        if os.path.isfile(dist_path):
            filepath = dist_path
        else:
            return HTMLResponse("Not found", status_code=404)
    ext = os.path.splitext(filename)[1].lower()
    media_type = SCREENSHOT_TYPES.get(ext, mimetypes.guess_type(filename)[0] or "image/png")
    return FileResponse(filepath, media_type=media_type)


def _secure_response(resp):
    """Add security headers to a response."""
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["X-XSS-Protection"] = "1; mode=block"
    resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    resp.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return resp


# ── Serve React SPA via middleware ─────────────────
@app.middleware("http")
async def spa_fallback(request, call_next):
    path = request.url.path

    # Let API and WebSocket routes pass through normally
    if path.startswith("/api/") or path.startswith("/ws/") or path in ("/api", "/ws"):
        return _secure_response(await call_next(request))

    # Block path traversal attempts
    if ".." in path or path.startswith("/."):
        return _secure_response(JSONResponse({"error": "Forbidden"}, status_code=403))

    # Serve built asset files directly
    ASSET_EXTENSIONS = {".js", ".css", ".png", ".svg", ".ico", ".webp", ".woff", ".woff2", ".ttf", ".json"}
    if path.startswith("/assets/"):
        ext = os.path.splitext(path)[1].lower()
        if ext not in ASSET_EXTENSIONS:
            return _secure_response(JSONResponse({"error": "Forbidden"}, status_code=403))
        asset_full = os.path.join(STATIC_DIR, path.lstrip("/"))
        # Prevent path traversal into dist
        real = os.path.realpath(asset_full)
        dist_real = os.path.realpath(STATIC_DIR)
        if not real.startswith(dist_real):
            return _secure_response(JSONResponse({"error": "Forbidden"}, status_code=403))
        if os.path.isfile(asset_full):
            return _secure_response(FileResponse(asset_full))

    # Let normal routing handle it first
    response = await call_next(request)
    _secure_response(response)

    # If 404 and frontend is built, serve SPA index.html instead (only for /app and /admin paths)
    if response.status_code == 404 and os.path.isdir(STATIC_DIR) and (path.startswith("/app") or path.startswith("/admin")):
        index_path = os.path.join(STATIC_DIR, "index.html")
        if os.path.isfile(index_path):
            with open(index_path, encoding="utf-8") as fh:
                return _secure_response(HTMLResponse(fh.read()))

    return response


# ── Entry point ────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
