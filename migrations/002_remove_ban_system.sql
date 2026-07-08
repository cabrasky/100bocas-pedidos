-- ── Migration 002: Remove ban system tables ──
-- Date: 2026-07-08
-- Description: Drops banned_ips, cidr_bans, whitelisted_ips tables (auto-ban system removed)

-- Up
DROP TABLE IF EXISTS whitelisted_ips CASCADE;
DROP TABLE IF EXISTS cidr_bans CASCADE;
DROP TABLE IF EXISTS banned_ips CASCADE;

-- Down
-- CREATE TABLE IF NOT EXISTS banned_ips (
--     id          SERIAL PRIMARY KEY,
--     ip          VARCHAR(45) NOT NULL UNIQUE,
--     banned_at   DOUBLE PRECISION NOT NULL,
--     reason      TEXT NOT NULL,
--     auto_ban    BOOLEAN DEFAULT false,
--     expires_at  DOUBLE PRECISION,
--     ban_type    VARCHAR(20) DEFAULT 'ban',
--     offense_count INTEGER DEFAULT 1
-- );
-- CREATE INDEX IF NOT EXISTS idx_banned_ips_ip ON banned_ips(ip);
-- CREATE INDEX IF NOT EXISTS idx_banned_ips_expires ON banned_ips(expires_at);
-- CREATE INDEX IF NOT EXISTS idx_banned_ips_type ON banned_ips(ban_type);
--
-- CREATE TABLE IF NOT EXISTS cidr_bans (
--     id          SERIAL PRIMARY KEY,
--     cidr        VARCHAR(45) NOT NULL UNIQUE,
--     banned_at   DOUBLE PRECISION NOT NULL,
--     reason      TEXT NOT NULL,
--     auto_ban    BOOLEAN DEFAULT false
-- );
--
-- CREATE TABLE IF NOT EXISTS whitelisted_ips (
--     id          SERIAL PRIMARY KEY,
--     ip_cidr     VARCHAR(45) NOT NULL UNIQUE,
--     note        TEXT DEFAULT '',
--     created_at  DOUBLE PRECISION NOT NULL
-- );
