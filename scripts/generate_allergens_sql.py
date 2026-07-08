"""
Generate SQL to set allergens and correct tags for all 342 menu items.
Uses subtractive model: allergens = what the item CONTAINS, tags computed from rules.
"""
import json
import subprocess
import sys

# Fetch all items from branch DB
result = subprocess.run([
    "psql",
    "postgresql://bocas:bocas_secret_k8s@10.43.34.106:5432/100bocas",
    "-t", "-A", "-F|",
    "-c", "SELECT mi.id, mi.code, mi.name, mi.ingredients, mi.tags, mc.key as cat_key FROM menu_items mi JOIN menu_categories mc ON mi.category_id = mc.id ORDER BY mi.id"
], capture_output=True, text=True)

lines = [l.strip() for l in result.stdout.strip().split("\n") if l.strip()]
items = []
for line in lines:
    parts = line.split("|")
    items.append({
        "id": int(parts[0]),
        "code": parts[1] if parts[1] else None,
        "name": parts[2],
        "ingredients": parts[3] if len(parts) > 3 else "",
        "tags": parts[4] if len(parts) > 4 else "",
        "cat_key": parts[5] if len(parts) > 5 else "",
    })

# ── Helper: determine allergens from item name ──

# Categories that are sandwiches (on bread = pan de molde)
SANDWICH_CATS = {"casa", "clasicos", "especiales", "imprescindibles", "montyburgers", "montydinas", "montygourmet", "montyperros", "montypizzas"}
# Categories that are NOT sandwiches
NON_SANDWICH_CODES = {None, ""}  # items without a numeric code are not sandwiches

def has_allergen(name: str, cat_key: str, code, ingredients: str) -> set:
    """Return set of allergen codes this item CONTAINS."""
    allergens = set()
    name_lower = name.lower()
    
    # ── Bread / Gluten ──
    # All items in sandwich cats with a numeric code are on pan de molde
    if cat_key in SANDWICH_CATS and code and code.isdigit():
        allergens.add("gluten")
        allergens.add("harina")
        allergens.add("pan")
    # Helado sandwich has bread (galletas)
    if "sándwich" in name_lower or "sandwich" in name_lower:
        if "helado" in name_lower:
            allergens.add("gluten")
            allergens.add("harina")
            allergens.add("pan")
    # Helado cono has gluten (cucurucho)
    if "cono" in name_lower and "helado" in name_lower:
        allergens.add("gluten")
        allergens.add("harina")
        pass  # cono may have gluten but it's not the same as bread
    # Piadinas have gluten (wheat flour)
    if "piadina" in name_lower:
        allergens.add("gluten")
        allergens.add("harina")
    # Hotdogs have bread (pan de perrito)
    if "hotdog" in name_lower:
        allergens.add("gluten")
        allergens.add("harina")
        allergens.add("pan")
    # Pizzas have gluten
    if "pizza" in name_lower or any(p in name_lower for p in ["montypizzas", "bbq —", "pollo —", "3 quesos", "pulled pork —", "pepperoni —"]):
        allergens.add("gluten")
        allergens.add("harina")
    # Burger buns have gluten
    if "burger" in name_lower and "monty" not in name_lower:
        allergens.add("gluten")
        allergens.add("harina")
        allergens.add("pan")
    # Montyburger category - burger buns
    if cat_key == "montyburgers":
        allergens.add("gluten")
        allergens.add("harina")
        allergens.add("pan")
    
    # ── Egg (huevo) ──
    if any(w in name_lower for w in ["huevo", "tortilla", "mayonesa", "alioli", "salsa 100m"]):
        allergens.add("huevo")
    
    # ── Lactose (lactosa) ──
    if any(w in name_lower for w in ["queso", "mozzarella", "cheddar", "gorgonzola", "mantequilla", "madurado"]):
        allergens.add("lactosa")
        allergens.add("queso")
    if "mantequilla" in name_lower:
        allergens.add("mantequilla")
        allergens.add("lactosa")
    
    # ── Meat (carne) ──
    meat_words = ["jamon", "jamón", "pulled pork", "pollo", "lomo", "chorizo", "bacon", "carne", "torreznos", "carrillera"]
    if any(w in name_lower for w in meat_words):
        allergens.add("carne")
    
    # ── Fish (pescado) ──
    fish_words = ["salmón", "salmon", "atún", "atun", "boquerón", "boqueron", "anchoa"]
    if any(w in name_lower for w in fish_words):
        allergens.add("pescado")
    
    # ── Seafood (marisco) ──
    if "calamarcitos" in name_lower or "calamar" in name_lower:
        allergens.add("marisco")
    
    # ── Honey (miel) ──
    if "miel" in name_lower:
        allergens.add("miel")
    
    # ── Specific overrides based on ingredients ──
    if ingredients:
        ing_lower = ingredients.lower()
        if "huevo" in ing_lower:
            allergens.add("huevo")
        if any(w in ing_lower for w in ["lactosa", "leche", "nata", "queso", "mantequilla"]):
            allergens.add("lactosa")
        if "gluten" in ing_lower:
            allergens.add("gluten")
    
    return allergens


def compute_tags(allergens: set, stored_tags: str) -> set:
    """Compute tags subtractively from allergens."""
    rules = {
        "vegetarian":      {"carne", "pescado", "marisco"},
        "vegan":           {"carne", "pescado", "marisco", "huevo", "lactosa", "miel", "nata", "queso", "mantequilla"},
        "gluten-free":     {"gluten", "harina", "pan"},
        "without-eggs":    {"huevo"},
        "without-lactose": {"lactosa", "nata", "queso", "mantequilla"},
    }
    
    tags = set()
    for tag, exclusions in rules.items():
        if not any(e in allergens for e in exclusions):
            tags.add(tag)
    
    # Preserve manual tags from stored
    if stored_tags:
        for t in stored_tags.split(","):
            t = t.strip().lower()
            if t in ("spicy", "special"):
                tags.add(t)
    
    return tags


# ── Generate SQL ──
sql_parts = []
sql_parts.append("-- Migration script: set allergens and correct tags for all menu items")
sql_parts.append("-- Generated from analysis of 342 production items")
sql_parts.append(f"-- Date: 2026-07-08")
sql_parts.append("")
sql_parts.append("BEGIN;")
sql_parts.append("")

stats = {"correct": 0, "tags_changed": 0, "allergens_set": 0}

for item in items:
    stored_tags = item["tags"]
    allergens = has_allergen(item["name"], item["cat_key"], item["code"], item["ingredients"])
    computed = compute_tags(allergens, stored_tags)
    
    # Build comma-separated strings
    allergens_str = ",".join(sorted(allergens))
    computed_tags_str = ",".join(sorted(computed))
    
    old_tags = set(t.strip().lower() for t in stored_tags.split(",") if t.strip())
    
    changes = []
    changes.append(f"-- {item['name']} (cat: {item['cat_key']})")
    
    if allergens_str:
        changes.append(f"   allergens: {allergens_str}")
        stats["allergens_set"] += 1
    
    if computed_tags_str != stored_tags:
        changes.append(f"   tags: {stored_tags} → {computed_tags_str}")
        stats["tags_changed"] += 1
    
    if not allergens_str:
        # Can't determine allergens from name — keep existing tags as fallback
        stats["correct"] += 1
        continue
    
    if not allergens_str and computed_tags_str == stored_tags:
        stats["correct"] += 1
        continue  # Skip items that don't need any change
    
    sql_parts.append(f"-- {item['name']}")
    update_parts = []
    if allergens_str:
        update_parts.append(f"allergens = '{allergens_str}'")
    if computed_tags_str != stored_tags:
        update_parts.append(f"tags = '{computed_tags_str}'")
    
    if update_parts:
        sql_parts.append(f"UPDATE menu_items SET {', '.join(update_parts)} WHERE id = {item['id']};")
    sql_parts.append("")

sql_parts.append("COMMIT;")
sql_parts.append("")
sql_parts.append(f"-- Stats: {stats['allergens_set']} allergens set, {stats['tags_changed']} tags corrected, {stats['correct']} already correct")

sql = "\n".join(sql_parts)

# Write to file
with open("/var/lib/hermes/menu_allergens_update.sql", "w") as f:
    f.write(sql)

print(f"Generated {len(sql)} bytes")
print(f"Items with allergens: {stats['allergens_set']}")
print(f"Tags corrected: {stats['tags_changed']}")
print(f"Already correct: {stats['correct']}")
print(f"Total items: {len(items)}")
