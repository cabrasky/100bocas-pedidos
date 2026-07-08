-- ── Migration 001: Add tags column to menu_items ──
-- Date: 2026-07-08
-- Description: Adds a TEXT column for dietary/allergen tags (vegetarian, vegan, gluten-free, etc.)

-- Up
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT '';

-- Down
-- ALTER TABLE menu_items DROP COLUMN IF EXISTS tags;
