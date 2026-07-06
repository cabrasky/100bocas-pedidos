-- ── 100Bocas Database Schema ────────────────────────
-- Auto-executed by PostgreSQL on first container start
-- (mounted at /docker-entrypoint-initdb.d/)

CREATE TABLE IF NOT EXISTS sessions (
    id            SERIAL PRIMARY KEY,
    code          VARCHAR(6) UNIQUE NOT NULL,
    created_at    TIMESTAMP DEFAULT now(),
    last_active   TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS persons (
    id          SERIAL PRIMARY KEY,
    session_id  INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name        VARCHAR(30) NOT NULL,
    UNIQUE(session_id, name)
);

CREATE TABLE IF NOT EXISTS order_items (
    id          SERIAL PRIMARY KEY,
    person_id   INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    item_key    VARCHAR(100) NOT NULL,
    item_name   VARCHAR(200) NOT NULL,
    item_code   VARCHAR(10),
    category    VARCHAR(50),
    quantity    INTEGER NOT NULL DEFAULT 0,
    UNIQUE(person_id, item_key)
);

CREATE TABLE IF NOT EXISTS order_history (
    id            SERIAL PRIMARY KEY,
    session_id    INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    order_number  INTEGER NOT NULL,
    created_at    TIMESTAMP DEFAULT now(),
    total_items   INTEGER NOT NULL,
    people_count  INTEGER NOT NULL,
    items_json    JSONB NOT NULL,
    paid_by       VARCHAR(30),
    UNIQUE(session_id, order_number)
);

CREATE TABLE IF NOT EXISTS menu_configs (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active   BOOLEAN DEFAULT false,
    created_at  TIMESTAMP DEFAULT now(),
    updated_at  TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_categories (
    id          SERIAL PRIMARY KEY,
    menu_id     INTEGER NOT NULL REFERENCES menu_configs(id) ON DELETE CASCADE,
    key         VARCHAR(50) NOT NULL,
    label       VARCHAR(100) NOT NULL,
    icon        VARCHAR(50) DEFAULT 'fa-list',
    sort_order  INTEGER DEFAULT 0,
    UNIQUE(menu_id, key)
);

CREATE TABLE IF NOT EXISTS menu_items (
    id            SERIAL PRIMARY KEY,
    category_id   INTEGER NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    code          VARCHAR(10),
    name          VARCHAR(200) NOT NULL,
    ingredients   TEXT,
    price         VARCHAR(20),
    sort_order    INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_schedules (
    id           SERIAL PRIMARY KEY,
    menu_id      INTEGER NOT NULL REFERENCES menu_configs(id) ON DELETE CASCADE,
    day_of_week  INTEGER NOT NULL,
    UNIQUE(menu_id, day_of_week)
);

-- ── Banned IPs ────────────────────────────────────
CREATE TABLE IF NOT EXISTS banned_ips (
    id          SERIAL PRIMARY KEY,
    ip          VARCHAR(45) NOT NULL UNIQUE,
    banned_at   DOUBLE PRECISION NOT NULL,
    reason      TEXT NOT NULL,
    auto_ban    BOOLEAN DEFAULT false,
    expires_at  DOUBLE PRECISION
);
CREATE INDEX IF NOT EXISTS idx_banned_ips_ip ON banned_ips(ip);
CREATE INDEX IF NOT EXISTS idx_banned_ips_expires ON banned_ips(expires_at);
