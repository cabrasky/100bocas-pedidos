-- Description: Add allergens column for subtractive restriction model
-- Up
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS allergens TEXT NOT NULL DEFAULT '';
-- Down
ALTER TABLE menu_items DROP COLUMN IF EXISTS allergens;
