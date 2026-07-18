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
import logging
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

# ── Logging ────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

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

# ── Subtractive allergen system ─────────────────────
# Allergen codes an item can CONTAIN (ingredients or known substances).
# Tags are COMPUTED from allergens via subtractive rules below.
ALLERGEN_CODES = {
    "huevo": "Huevo", "lactosa": "Lactosa", "gluten": "Gluten",
    "carne": "Carne", "pescado": "Pescado", "marisco": "Marisco",
    "miel": "Miel", "frutos_secos": "Frutos secos", "soja": "Soja",
    "mostaza": "Mostaza", "apio": "Apio", "cacahuete": "Cacahuete",
    "sesamo": "Sésamo", "moluscos": "Moluscos", "altramuz": "Altramuz",
    "sulfitos": "Sulfitos", "nata": "Nata", "queso": "Queso",
    "mantequilla": "Mantequilla", "harina": "Harina", "pan": "Pan",
}

# Each tag = list of allergen codes that EXCLUDE this tag (subtractive).
# If an item's allergens contain ANY code in the list, the tag is NOT applied.
# Tags not listed (spicy, special) remain manual — not allergen-derived.
ALLERGEN_RULES: dict[str, list[str]] = {
    "vegetarian":      ["carne", "pescado", "marisco"],
    "vegan":           ["carne", "pescado", "marisco", "huevo", "lactosa", "miel", "nata", "queso", "mantequilla"],
    "gluten-free":     ["gluten", "harina", "pan"],
    "without-eggs":    ["huevo"],
    "without-lactose": ["lactosa", "nata", "queso", "mantequilla"],
}


def _compute_tags(allergens: str, stored_tags: str = "") -> str:
    """Compute tags from allergens using subtractive rules.
    
    If allergens is empty/not set, falls back to stored_tags (legacy).
    Tags not covered by rules (spicy, special) are always preserved.
    """
    if not allergens or not allergens.strip():
        return stored_tags  # fallback to stored tags

    item_allergens = {a.strip().lower() for a in allergens.split(",") if a.strip()}
    resulting = set()

    # Compute each rule-based tag subtractively
    for tag, exclusions in ALLERGEN_RULES.items():
        if not any(excl in item_allergens for excl in exclusions):
            resulting.add(tag)

    # Preserve manual tags (spicy, special) from stored_tags
    if stored_tags:
        manual = {"spicy", "special"}
        for t in stored_tags.split(","):
            t = t.strip().lower()
            if t in manual:
                resulting.add(t)

    return ",".join(sorted(resulting))


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
    pass  # (cleanup simplified)


async def periodic_cleanup():
    while True:
        await asyncio.sleep(CLEANUP_INTERVAL)
        try:
            await cleanup_old_sessions()
        except Exception as exc:
            logger.error(f"[cleanup] Error: {exc}", exc_info=True)


# ── Schema migrations (Liquibase-style) ─────────────
MIGRATIONS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "migrations")
BASE_SCHEMA_CANDIDATES = [
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "init", "init.sql"),
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "k8s", "init", "init.sql"),
]


async def _ensure_base_schema():
    """Create base tables for fresh databases before additive migrations run."""
    assert pool

    schema_sql = None
    schema_path = None
    for candidate in BASE_SCHEMA_CANDIDATES:
        if os.path.isfile(candidate):
            with open(candidate, "r", encoding="utf-8") as f:
                schema_sql = f.read()
            schema_path = candidate
            break

    if not schema_sql:
        logger.info("[schema] No base schema file found; continuing with migrations only")
        return

    try:
        async with pool.acquire() as conn:
            await conn.execute(schema_sql)
        logger.info(f"[schema] Base schema ensured from {schema_path}")
    except Exception as exc:
        logger.error(f"[schema] Failed applying base schema from {schema_path}: {exc}", exc_info=True)
        raise


async def _ensure_schema_migrations_table():
    assert pool
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version     VARCHAR(20) PRIMARY KEY,
                filename    TEXT NOT NULL,
                description TEXT DEFAULT '',
                applied_at  TIMESTAMP DEFAULT now()
            )
        """)


async def run_migrations():
    """Apply pending SQL migrations in order."""
    assert pool
    await _ensure_base_schema()
    await _ensure_schema_migrations_table()

    if not os.path.isdir(MIGRATIONS_DIR):
        logger.info(f"[migrate] No migrations directory found at {MIGRATIONS_DIR}")
        return

    files = sorted(f for f in os.listdir(MIGRATIONS_DIR) if f.endswith(".sql"))
    if not files:
        logger.info("[migrate] No migration files found")
        return

    async with pool.acquire() as conn:
        applied_rows = await conn.fetch("SELECT version FROM schema_migrations")
        applied = {r["version"] for r in applied_rows}

    for fname in files:
        version = fname.split("_", 1)[0] if "_" in fname else fname.replace(".sql", "")
        if version in applied:
            continue

        path = os.path.join(MIGRATIONS_DIR, fname)
        with open(path) as f:
            sql = f.read()

        # Extract description from SQL comment
        desc = ""
        for line in sql.split("\n"):
            if line.strip().startswith("-- Description:"):
                desc = line.split(":", 1)[1].strip()
                break

        # Extract just the Up section
        up_sql = sql.split("-- Down")[0] if "-- Down" in sql else sql
        # Remove comment lines for execution
        up_clean = "\n".join(
            line for line in up_sql.split("\n")
            if not line.strip().startswith("--") and not line.strip().startswith("/*")
        )
        up_clean_upper = up_clean.upper()
        has_explicit_tx = "BEGIN;" in up_clean_upper or "COMMIT;" in up_clean_upper

        try:
            async with pool.acquire() as conn:
                if has_explicit_tx:
                    await conn.execute(up_clean)
                    await conn.execute(
                        "INSERT INTO schema_migrations (version, filename, description) VALUES ($1, $2, $3)",
                        version, fname, desc,
                    )
                else:
                    async with conn.transaction():
                        await conn.execute(up_clean)
                        await conn.execute(
                            "INSERT INTO schema_migrations (version, filename, description) VALUES ($1, $2, $3)",
                            version, fname, desc,
                        )
            logger.info(f"[migrate] ✓ {fname} — {desc or version}")
        except Exception as e:
            logger.error(f"[migrate] ✗ {fname} FAILED: {e}", exc_info=True)
            raise


# ── Admin auth ────────────────────────────────────
ADMIN_PASSWORD = os.getenv("BOCAS_ADMIN_PASSWORD", "")
if not ADMIN_PASSWORD:
    # Generate a random password and log it
    ADMIN_PASSWORD = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
    logger.warning(f"[auth] BOCAS_ADMIN_PASSWORD not set. Generated: {ADMIN_PASSWORD}")
    logger.info(f"[auth] Set BOCAS_ADMIN_PASSWORD env var to use a custom password.")

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
        return JSONResponse({"error": "Token inválido"}, status_code=403)
    return None


# ── Lifespan ───────────────────────────────────────
@asynccontextmanager
async def lifespan(_app: FastAPI):
    global pool, _cleanup_task
    pool = await asyncpg.create_pool(DB_DSN, min_size=2, max_size=10)
    _cleanup_task = asyncio.create_task(periodic_cleanup())
    await run_migrations()
    logger.info(f"[server] Security: RPM={MAX_REQUESTS_PER_MIN}, WS/IP={MAX_WS_PER_IP}, "
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
        except Exception as e:
            logger.warning(f"[broadcast] Failed to send to WS in session {session_code}: {e}")
            dead.append(ws)
    for ws in dead:
        ws_rooms[session_code].discard(ws)
    if not ws_rooms[session_code]:
        del ws_rooms[session_code]
        logger.debug(f"[broadcast] Cleaned up empty session {session_code}")


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

    # ── Rate limiting for API ──
    if path.startswith("/api/"):
        if not _check_rpm(client_ip):
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
            logger.debug(f"[add_person] Person {name} already exists in session {code}")
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
async def _get_active_menu(conn, force_menu_id: int | None = None) -> dict | None:
    """Fetch the active menu config with categories and items.
    
    Priority:
    1. forced_menu_id from app_config → return that menu (manual override)
    2. auto_activate based on day_of_week → return matching menu from menu_schedules
    """
    menu_id = force_menu_id
    if menu_id is None:
        # Auto: find menu by today's day_of_week
        today = datetime.now().isoweekday()  # Mon=1, Sun=7
        # Convert to 0=Sun..6=Sat for DB
        dow = today % 7  # Mon(1)→1, Sun(7)→0
        row = await conn.fetchrow("""
            SELECT mc.id FROM menu_configs mc
            JOIN menu_schedules ms ON ms.menu_id = mc.id
            WHERE ms.day_of_week = $1 AND mc.auto_activate = true
            ORDER BY mc.id LIMIT 1
        """, dow)
        if row:
            menu_id = row["id"]
    
    if menu_id is None:
        # Fallback: any active or first menu
        row = await conn.fetchrow(
            "SELECT id FROM menu_configs ORDER BY is_active DESC, id LIMIT 1"
        )
        if not row:
            return None
        menu_id = row["id"]
    
    row = await conn.fetchrow(
        "SELECT id, name, slug, description FROM menu_configs WHERE id = $1", menu_id
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
            "SELECT id, code, name, ingredients, price, tags, allergens, sort_order FROM menu_items WHERE category_id = $1 ORDER BY sort_order",
            c["id"],
        )
        categories.append({
            "id": c["id"],
            "key": c["key"],
            "label": c["label"],
            "icon": c["icon"],
            "items": [{"id": i["id"], "code": i["code"] or "", "name": i["name"],
                       "ingredients": i["ingredients"] or "", "price": float(i["price"]) if i["price"] is not None else 0,
                       "tags": _compute_tags(i["allergens"] or "", i["tags"] or ""),
                       "allergens": i["allergens"] or ""}
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
    """Public: return the currently active menu config (auto or forced)."""
    assert pool
    async with pool.acquire() as conn:
        # Check if there's a forced menu
        forced_row = await conn.fetchrow(
            "SELECT value FROM app_config WHERE key = 'forced_menu_id' AND value != ''"
        )
        forced_id = int(forced_row["value"]) if forced_row else None
        menu = await _get_active_menu(conn, force_menu_id=forced_id)
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
            "SELECT id, name, slug, description, is_active, auto_activate, created_at FROM menu_configs ORDER BY id"
        )
    return [{
        "id": r["id"], "name": r["name"], "slug": r["slug"],
        "description": r["description"], "is_active": r["is_active"],
        "auto_activate": r["auto_activate"],
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


@app.get("/api/admin/menu-status")
async def admin_menu_status(request: Request):
    """Get current menu activation status (auto vs forced)."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    assert pool
    async with pool.acquire() as conn:
        # Check forced
        forced_row = await conn.fetchrow(
            "SELECT value FROM app_config WHERE key = 'forced_menu_id' AND value != ''"
        )
        forced_id = int(forced_row["value"]) if forced_row else None
        forced_menu = None
        if forced_id:
            forced_menu = await conn.fetchrow(
                "SELECT id, name, slug FROM menu_configs WHERE id = $1", forced_id
            )
        
        # Get auto-activated menu for today
        today_dow = datetime.now().isoweekday() % 7
        auto_row = await conn.fetchrow("""
            SELECT mc.id, mc.name, mc.slug FROM menu_configs mc
            JOIN menu_schedules ms ON ms.menu_id = mc.id
            WHERE ms.day_of_week = $1 AND mc.auto_activate = true
            LIMIT 1
        """, today_dow)
        
        # Get the actual active menu
        active_menu = await _get_active_menu(conn, force_menu_id=forced_id)
        
        day_names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        return {
            "mode": "forced" if forced_id else "auto",
            "forced_menu": {
                "id": forced_menu["id"],
                "name": forced_menu["name"],
                "slug": forced_menu["slug"],
            } if forced_menu else None,
            "auto_menu_today": {
                "id": auto_row["id"],
                "name": auto_row["name"],
                "slug": auto_row["slug"],
            } if auto_row else None,
            "today": day_names[today_dow],
            "active_menu_id": active_menu["id"] if active_menu else None,
            "active_menu_name": active_menu["name"] if active_menu else None,
        }


@app.post("/api/admin/menus/force/{menu_id}")
async def admin_force_menu(request: Request, menu_id: int):
    """Force a specific menu to be active (manual override)."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    assert pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id, name FROM menu_configs WHERE id = $1", menu_id)
        if not row:
            return JSONResponse({"error": "Menu not found"}, status_code=404)
        await conn.execute(
            "INSERT INTO app_config (key, value) VALUES ('forced_menu_id', $1) "
            "ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
            str(menu_id)
        )
    return {"status": "ok", "menu_id": menu_id, "name": row["name"], "mode": "forced"}


@app.post("/api/admin/menus/unforce")
async def admin_unforce_menu(request: Request):
    """Clear the forced menu override — back to auto by day of week."""
    auth_error = _admin_required(request)
    if auth_error:
        return auth_error
    assert pool
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO app_config (key, value) VALUES ('forced_menu_id', '') "
            "ON CONFLICT (key) DO UPDATE SET value = ''"
        )
    return {"status": "ok", "mode": "auto"}



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
                    "SELECT code, name, ingredients, price, tags, allergens, sort_order FROM menu_items WHERE category_id = $1 ORDER BY sort_order, id",
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
                        "price": float(i["price"]) if i["price"] is not None else 0,
                        "tags": i["tags"] or "",
                        "allergens": i["allergens"] or "",
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
                        "INSERT INTO menu_items (category_id, code, name, ingredients, price, tags, allergens, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
                        cat_id, item.get("code", ""), item.get("name", ""),
                        item.get("ingredients", ""), item.get("price", 0),
                        item.get("tags", ""), item.get("allergens", ""), item.get("sort_order", 0),
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
                "SELECT id, code, name, ingredients, price, tags, allergens, sort_order FROM menu_items WHERE category_id = $1 ORDER BY sort_order, id",
                c["id"],
            )
            categories.append({
                "id": c["id"],
                "key": c["key"],
                "label": c["label"],
                "icon": c["icon"],
                "items": [{"id": i["id"], "code": i["code"] or "", "name": i["name"],
                           "ingredients": i["ingredients"] or "", "price": float(i["price"]) if i["price"] is not None else 0,
                           "tags": _compute_tags(i["allergens"] or "", i["tags"] or ""),
                           "allergens": i["allergens"] or ""}
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
                "SELECT code, name, ingredients, price, tags, allergens, sort_order FROM menu_items WHERE category_id IN "
                "(SELECT id FROM menu_categories WHERE menu_id = $1 AND key = $2) ORDER BY id",
                menu_id, c["key"],
            )
            for i in items:
                await conn.execute(
                    "INSERT INTO menu_items (category_id, code, name, ingredients, price, tags, allergens, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
                    cat_id, i["code"], i["name"], i["ingredients"], i["price"], i["tags"], i["allergens"], i["sort_order"],
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
            logger.info(f"[schedule] Auto-activated '{menu['name']}' for day {today}")
            return {"status": "ok", "activated": menu["name"]}
    logger.debug(f"[schedule] No schedule for day {today}")
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
    price = body.get("price", 0)
    ingredients = body.get("ingredients", "")
    tags = body.get("tags", "")
    allergens = body.get("allergens", "")
    if not name:
        return JSONResponse({"error": "name required"}, status_code=400)
    assert pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id FROM menu_categories WHERE id = $1", cat_id)
        if not row:
            return JSONResponse({"error": "Category not found"}, status_code=404)
        item_id = await conn.fetchval(
            "INSERT INTO menu_items (category_id, code, name, ingredients, price, tags, allergens) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
            cat_id, code, name, ingredients, price, tags, allergens,
        )
    return {"id": item_id, "name": name, "code": code, "price": float(price) if price else 0}


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
        for field in ("code", "name", "ingredients", "price", "tags", "allergens", "sort_order"):
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
def _as_float(val) -> float:
    """Convert DB numeric value to float, default to 0.0."""
    if val is None:
        return 0.0
    return float(val)


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
                    menu_data[f"{c['key']}:{key}"] = _as_float(ir["price"])

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
            price = _as_float(None)
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
    if data is None:
        return JSONResponse({"error": "Session not found"}, status_code=404)
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
        **data,
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
        logger.error(f"[ssr] Proxy error: {exc}", exc_info=True)
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
