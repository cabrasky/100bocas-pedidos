-- Description: Add auto_activate and forced menu support
-- Up

ALTER TABLE menu_configs ADD COLUMN IF NOT EXISTS auto_activate BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS app_config (
    key         VARCHAR(50) PRIMARY KEY,
    value       TEXT NOT NULL
);

INSERT INTO app_config (key, value) VALUES ('forced_menu_id', '')
ON CONFLICT (key) DO NOTHING;

-- Down
-- ALTER TABLE menu_configs DROP COLUMN IF EXISTS auto_activate;
-- DROP TABLE IF EXISTS app_config;
