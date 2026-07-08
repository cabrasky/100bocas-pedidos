-- ── Migration 003: Migrate price from VARCHAR to DECIMAL ──
-- Date: 2026-07-08
-- Description: Convert price column from VARCHAR (e.g. "1€", "2,50€", "+0,50€") to NUMERIC(10,2)

-- Up
ALTER TABLE menu_items ADD COLUMN price_numeric NUMERIC(10,2);

UPDATE menu_items SET price_numeric =
    REPLACE(REPLACE(TRIM(price), '€', ''), ',', '.')::NUMERIC(10,2);

ALTER TABLE menu_items DROP COLUMN price;

ALTER TABLE menu_items RENAME COLUMN price_numeric TO price;

-- Down
-- ALTER TABLE menu_items ADD COLUMN price_old VARCHAR(20);
-- UPDATE menu_items SET price_old = price::TEXT;
-- ALTER TABLE menu_items DROP COLUMN price;
-- ALTER TABLE menu_items RENAME COLUMN price_old TO price;
