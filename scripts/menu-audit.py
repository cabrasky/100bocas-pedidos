#!/usr/bin/env python3
"""
Menu Data Audit & Update Tool
==============================
Export menu items, review/update ingredients and allergen tags, then import.

Usage:
  # 1. Export current items to a YAML file (safe, read-only)
  python3 scripts/menu-audit.py export

  # 2. Edit the generated file (scripts/menu-data.yaml)
  #    - Fill in 'ingredients' with real ingredient list
  #    - Set 'tags' as an array: [vegetarian, vegan, gluten-free, spicy, without-eggs, without-lactose, special]
  #    - Adjust 'price' if needed

  # 3. Preview what would change
  python3 scripts/menu-audit.py diff

  # 4. Apply changes to production DB
  python3 scripts/menu-audit.py import

Environment:
  BOCAS_DB or PGDATABASE  — PostgreSQL DSN (default: postgresql://bocas@localhost:5433/100bocas)
"""

import os
import sys
import subprocess
import json
from pathlib import Path

DB_DSN = os.getenv("BOCAS_DB") or os.getenv("PGDATABASE") or "postgresql://bocas@localhost:5433/100bocas"
SCRIPT_DIR = Path(__file__).parent
DATA_FILE = SCRIPT_DIR / "menu-data.yaml"

# Available tags with descriptions
TAG_INFO = {
    "vegetarian": "🌿 Vegetal — Sin carne ni pescado (puede llevar huevo/lácteos)",
    "vegan": "🌱 Vegano — Sin ningún producto animal",
    "gluten-free": "🌾 Sin gluten — Apto para celíacos",
    "spicy": "🌶️ Picante — Contiene especias picantes",
    "without-eggs": "🥚 Sin huevo — No contiene huevo ni derivados",
    "without-lactose": "🥛 Sin lactosa — No contiene lactosa",
    "special": "⭐ Especial — Producto destacado",
}


def _psql(sql: str) -> str:
    """Run SQL against the production DB and return stdout."""
    r = subprocess.run(
        ["psql", DB_DSN, "-t", "-A", "-F|", "-c", sql],
        capture_output=True, text=True, timeout=30,
    )
    if r.returncode != 0:
        print(f"Error: {r.stderr}", file=sys.stderr)
        sys.exit(1)
    return r.stdout.strip()


def cmd_export():
    """Export all items from the active menu to a YAML file for editing."""
    rows = _psql("""
        SELECT mc.label AS category, mi.code, mi.name,
               COALESCE(mi.ingredients, '') AS ingredients,
                mi.price,
                COALESCE(mi.tags, '') AS tags
        FROM menu_items mi
        JOIN menu_categories mc ON mc.id = mi.category_id
        JOIN menu_configs m ON m.id = mc.menu_id
        WHERE m.is_active = true
        ORDER BY mc.sort_order, mi.sort_order, mi.id;
    """)

    if not rows:
        print("No items found in active menu.")
        sys.exit(1)

    lines = rows.split("\n")
    data = []
    current_cat = None
    for line in lines:
        if not line.strip():
            continue
        parts = line.split("|")
        if len(parts) < 6:
            continue
        cat, code, name, ingredients, price, tags = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]

        if cat != current_cat:
            if current_cat is not None:
                data.append("")
            data.append(f"# ── {cat} ──")
            current_cat = cat

        tags_list = [t.strip() for t in tags.split(",") if t.strip()]
        tags_yaml = ", ".join(f"'{t}'" for t in tags_list) if tags_list else "[]"
        price_str = f"  price: {price}"
        ingredients_str = f"  ingredients: \"{ingredients}\"" if ingredients else "  ingredients: \"\""

        data.append(f"- name: \"{name}\"")
        data.append(f"  code: \"{code}\"")
        data.append(price_str)
        data.append(ingredients_str)
        data.append(f"  tags: [{tags_yaml}]")

    # YAML header with instructions
    header = f"""# ── 100Bocas Menu Data ──
# Edit this file to update ingredients and allergen tags, then run:
#   python3 scripts/menu-audit.py import
#
# Available tags (select zero or more per item):
"""
    for key, desc in TAG_INFO.items():
        header += f"#   {desc}\n"
    header += "#\n# Format:\n"
    header += "#   - name: \"Nombre del producto\"\n"
    header += "#     code: \"01\"\n"
    header += "#     price: 1.00\n"
    header += '#     ingredients: "Lista de ingredientes, separados por comas"\n'
    header += "#     tags: ['vegetarian', 'gluten-free']\n"
    header += "#\n# IMPORTANT: Do NOT change the structure (keys, indentation).\n"
    header += "# Only update ingredients, tags, and price values.\n\n"

    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(header + "\n".join(data) + "\n")
    print(f"✅ Exported {len(lines)} items to {DATA_FILE}")
    print(f"   Edit the file, then run: python3 scripts/menu-audit.py import")


def _parse_yaml_line(line: str) -> tuple:
    """Simple YAML line parser (no PyYAML dependency)."""
    line = line.strip()
    if line.startswith("- name:"):
        return "name", line[7:].strip().strip('"')
    if line.startswith("  code:"):
        return "code", line[7:].strip().strip('"')
    if line.startswith("  price:"):
        return "price", line[7:].strip()
    if line.startswith("  ingredients:"):
        return "ingredients", line[14:].strip().strip('"')
    if line.startswith("  tags:"):
        raw = line[6:].strip().strip("[]").replace("'", "").replace('"', "")
        return "tags", [t.strip() for t in raw.split(",") if t.strip()]
    return None, None


def cmd_diff():
    """Show what would change between the YAML file and the DB."""
    if not DATA_FILE.exists():
        print(f"File {DATA_FILE} not found. Run 'export' first.")
        sys.exit(1)

    # Parse YAML file
    items_file = []
    with open(DATA_FILE) as f:
        for line in f:
            key, val = _parse_yaml_line(line)
            if key == "name":
                items_file.append({"name": val})
            elif key in ("code", "price", "ingredients", "tags") and items_file:
                items_file[-1][key] = val

    # Get current DB state
    rows = _psql("""
        SELECT mi.name, COALESCE(mi.ingredients, '') AS ingredients,
               mi.price::TEXT, COALESCE(mi.tags, '') AS tags
        FROM menu_items mi
        JOIN menu_categories mc ON mc.id = mi.category_id
        JOIN menu_configs m ON m.id = mc.menu_id
        WHERE m.is_active = true
        ORDER BY mc.sort_order, mi.sort_order, mi.id;
    """)

    items_db = []
    for line in rows.split("\n"):
        if not line.strip():
            continue
        parts = line.split("|")
        if len(parts) >= 4:
            items_db.append({
                "name": parts[0],
                "ingredients": parts[1] if len(parts) > 1 else "",
                "price": parts[2] if len(parts) > 2 else "0",
                "tags": [t.strip() for t in parts[3].split(",") if t.strip()] if len(parts) > 3 else [],
            })

    changes = 0
    for fi, di in zip(items_file, items_db):
        diffs = []
        if str(fi.get("ingredients", "")) != str(di["ingredients"]):
            diffs.append(f"ingredients: '{di['ingredients']}' → '{fi.get('ingredients', '')}'")
        if str(fi.get("price", "")) != str(di["price"]):
            diffs.append(f"price: {di['price']} → {fi.get('price', '')}")
        fi_tags = ",".join(sorted(fi.get("tags", [])))
        di_tags = ",".join(sorted(di["tags"]))
        if fi_tags != di_tags:
            diffs.append(f"tags: [{di_tags}] → [{fi_tags}]")
        if diffs:
            print(f"\n  {di['name']}:")
            for d in diffs:
                print(f"    {d}")
            changes += 1

    if changes == 0:
        print("✅ No changes detected — file matches database.")
    else:
        print(f"\n{changes} item(s) with changes. Run 'import' to apply.")


def cmd_import():
    """Apply the edited YAML data back to the production DB."""
    if not DATA_FILE.exists():
        print(f"File {DATA_FILE} not found. Run 'export' first.")
        sys.exit(1)

    # Parse YAML file
    items_file = []
    with open(DATA_FILE) as f:
        for line in f:
            key, val = _parse_yaml_line(line)
            if key == "name":
                items_file.append({"name": val})
            elif key in ("code", "price", "ingredients", "tags") and items_file:
                items_file[-1][key] = val

    # Get DB items with IDs
    rows = _psql("""
        SELECT mi.id, mi.name, COALESCE(mi.ingredients, '') AS ingredients,
               mi.price::TEXT, COALESCE(mi.tags, '') AS tags
        FROM menu_items mi
        JOIN menu_categories mc ON mc.id = mi.category_id
        JOIN menu_configs m ON m.id = mc.menu_id
        WHERE m.is_active = true
        ORDER BY mc.sort_order, mi.sort_order, mi.id;
    """)

    items_db = []
    for line in rows.split("\n"):
        if not line.strip():
            continue
        parts = line.split("|")
        if len(parts) >= 5:
            items_db.append({
                "id": int(parts[0]),
                "name": parts[1],
                "ingredients": parts[2] if len(parts) > 2 else "",
                "price": parts[3] if len(parts) > 3 else "0",
                "tags": parts[4] if len(parts) > 4 else "",
            })

    if len(items_file) != len(items_db):
        print(f"⚠️  Item count mismatch: file={len(items_file)} db={len(items_db)}")
        print("   The file may be out of sync. Re-run 'export' first.")
        sys.exit(1)

    updates = []
    for fi, di in zip(items_file, items_db):
        if fi["name"] != di["name"]:
            print(f"⚠️  Name mismatch: file='{fi['name']}' db='{di['name']}'")
            print("   Items are out of order. Re-run 'export'.")
            sys.exit(1)

        new_ingredients = fi.get("ingredients", "")
        new_tags = ",".join(fi.get("tags", []))
        new_price = fi.get("price", di["price"])

        if new_ingredients != di["ingredients"] or new_tags != di["tags"] or new_price != di["price"]:
            updates.append((new_ingredients, new_tags, new_price, di["id"]))

    if not updates:
        print("✅ No changes to apply.")
        return

    # Confirm
    print(f"\n{len(updates)} item(s) to update:")
    for ing, tags, price, iid in updates[:5]:
        print(f"  ID {iid}: ingredients='{ing[:40]}…' tags=[{tags}] price={price}")
    if len(updates) > 5:
        print(f"  ... and {len(updates) - 5} more")

    confirm = input("\nApply changes? (yes/N): ").strip().lower()
    if confirm != "yes":
        print("Cancelled.")
        return

    # Execute updates
    sql_parts = []
    for ingredients, tags, price, item_id in updates:
        safe_ing = ingredients.replace("'", "''")
        sql_parts.append(
            f"UPDATE menu_items SET ingredients = '{safe_ing}', "
            f"tags = '{tags}', price = {price} WHERE id = {item_id};"
        )

    sql = "\n".join(sql_parts)
    subprocess.run(
        ["psql", DB_DSN, "-c", sql],
        timeout=60,
    )
    print(f"✅ {len(updates)} item(s) updated in production.")


def cmd_help():
    print(__doc__)


if __name__ == "__main__":
    cmds = {
        "export": cmd_export,
        "diff": cmd_diff,
        "import": cmd_import,
        "help": cmd_help,
    }
    cmd = sys.argv[1] if len(sys.argv) > 1 else "help"
    if cmd in cmds:
        cmds[cmd]()
    else:
        print(f"Unknown command: {cmd}\n")
        cmd_help()
        sys.exit(1)
