"""Seed the database with initial menu configurations.
Creates: 100Bocas (1€), Precio Normal, and A Domicilio menus."""
import asyncio
import asyncpg
import os

DB_DSN = os.getenv("BOCAS_DB", "postgresql://bocas@localhost:5433/100bocas")

# ── Full menu data (same as frontend/src/types.ts) ──
MENU = {
  "casa": {"items": [
    {"code": "01", "name": "Jamón Gran Reserva y aceite de oliva"},
    {"code": "02", "name": "Tortilla de patatas y tomate"},
    {"code": "03", "name": "Pulled pork BBQ"},
    {"code": "04", "name": "Pollo y salsa alioli"},
    {"code": "05", "name": "Carrillera al vino tinto"},
    {"code": "06", "name": "Calamarcitos y mayonesa"},
    {"code": "07", "name": "Pollo kebab y salsa BBQ"},
    {"code": "08", "name": "Bacon ahumado y queso madurado"},
    {"code": "09", "name": "Torreznos y salsa brava"},
    {"code": "10", "name": "Lomo al ajillo y salsa 100M"},
  ]},
  "clasicos": {"items": [
    {"code": "11", "name": "Tortilla de patatas y queso madurado"},
    {"code": "12", "name": "Tortilla de patatas, bacon ahumado y salsa alioli"},
    {"code": "13", "name": "Tortilla de patatas, tomate y mayonesa"},
    {"code": "14", "name": "Tortilla de patatas y mojo picón"},
    {"code": "15", "name": "Tortilla de patatas, patatas paja y salsa 100M"},
    {"code": "16", "name": "Tortilla de patatas, cebolla crujiente y salsa BBQ"},
    {"code": "17", "name": "Pollo y queso madurado"},
    {"code": "18", "name": "Pollo, tomate y mojo picón"},
    {"code": "19", "name": "Pollo, patatas paja y salsa de mostaza y miel"},
    {"code": "20", "name": "Pollo, bacon ahumado y mayonesa"},
    {"code": "21", "name": "Pollo, patatas paja y salsa BBQ"},
    {"code": "22", "name": "Pollo kebab y tomate"},
    {"code": "23", "name": "Pollo kebab y salsa cheddar"},
    {"code": "24", "name": "Pollo kebab, tomate y salsa 100M"},
    {"code": "25", "name": "Pollo kebab, patatas paja y salsa BBQ"},
    {"code": "26", "name": "Pollo kebab, bacon ahumado y mayonesa"},
  ]},
  "imprescindibles": {"items": [
    {"code": "27", "name": "Pulled pork BBQ y salsa cheddar"},
    {"code": "28", "name": "Pulled pork BBQ y bacon ahumado"},
    {"code": "29", "name": "Pulled pork BBQ y salsa brava"},
    {"code": "30", "name": "Pulled pork BBQ y patatas paja"},
    {"code": "31", "name": "Pulled pork BBQ y cebolla crujiente"},
    {"code": "32", "name": "Lomo al ajillo y queso madurado"},
    {"code": "33", "name": "Lomo al ajillo y queso gorgonzola"},
    {"code": "34", "name": "Lomo al ajillo y mojo picón"},
    {"code": "35", "name": "Lomo al ajillo, tomate y patatas paja"},
    {"code": "36", "name": "Lomo al ajillo, tomate y mayonesa"},
    {"code": "37", "name": "Lomo al ajillo, bacon ahumado y salsa alioli"},
    {"code": "38", "name": "Calamarcitos y salsa alioli"},
    {"code": "39", "name": "Calamarcitos y salsa 100M"},
    {"code": "40", "name": "Calamarcitos y guacamole"},
    {"code": "41", "name": "Calamarcitos, salsa brava y mayonesa"},
    {"code": "42", "name": "Calamarcitos, tomate y mayonesa"},
    {"code": "43", "name": "Bacon ahumado, tomate y mayonesa"},
    {"code": "44", "name": "Bacon ahumado, cebolla crujiente y salsa 100M"},
    {"code": "45", "name": "Bacon ahumado, tomate y queso gorgonzola"},
    {"code": "46", "name": "Bacon ahumado, patatas paja y mayonesa"},
    {"code": "47", "name": "Bacon ahumado, tomate y queso madurado"},
  ]},
  "especiales": {"items": [
    {"code": "48", "name": "Jamón Gran Reserva y mantequilla"},
    {"code": "49", "name": "Jamón Gran Reserva y tomate"},
    {"code": "50", "name": "Jamón Gran Reserva, tomate y patatas paja"},
    {"code": "51", "name": "Jamón Gran Reserva y tortilla de patatas"},
    {"code": "52", "name": "Carrillera al vino tinto y salsa alioli"},
    {"code": "53", "name": "Carrillera al vino tinto y patatas paja"},
    {"code": "54", "name": "Carrillera al vino tinto y tomate"},
    {"code": "55", "name": "Carrillera al vino tinto y cebolla crujiente"},
    {"code": "56", "name": "Carrillera al vino tinto y bacon ahumado"},
    {"code": "57", "name": "Torreznos y mayonesa"},
    {"code": "58", "name": "Torreznos y salsa alioli"},
    {"code": "59", "name": "Torreznos y salsa 100M"},
    {"code": "60", "name": "Salmón ahumado y queso gorgonzola"},
    {"code": "61", "name": "Salmón ahumado y tomate"},
    {"code": "62", "name": "Salmón ahumado y salsa de mostaza y miel"},
    {"code": "63", "name": "Salmón ahumado y guacamole"},
    {"code": "64", "name": "Chorizo parrillero y salsa brava"},
    {"code": "65", "name": "Chorizo parrillero y queso gorgonzola"},
    {"code": "66", "name": "Chorizo parrillero y salsa BBQ"},
    {"code": "67", "name": "Chorizo parrillero y guacamole"},
  ]},
  "montycookie": {"items": [
    {"code": "68", "name": "Montycookie doble chocolate y sirope de caramelo toffee"},
    {"code": "69", "name": "Montycookie chocolate y sirope de pistacho"},
    {"code": "70", "name": "Montycookie chocolate y sirope de chocolate"},
  ]},
  "montydinas": {"items": [
    {"code": "71", "name": "Piadina de jamón cocido y queso mozzarella"},
    {"code": "72", "name": "Piadina de pepperoni y queso mozzarella"},
    {"code": "73", "name": "Piadina de pollo, tomate, queso mozzarella y orégano"},
    {"code": "74", "name": "Piadina de jamón Gran Reserva, queso mozzarella y orégano"},
    {"code": "75", "name": "Piadina de jamón cocido, queso madurado y tomate"},
  ]},
  "montyperros": {"items": [
    {"code": "76", "name": "Hotdog, kétchup y mayonesa"},
    {"code": "77", "name": "Hotdog, cebolla crujiente y mojo picón"},
    {"code": "78", "name": "Hotdog, guacamole y salsa cheddar"},
    {"code": "79", "name": "Hotdog, patatas paja y salsa alioli"},
    {"code": "80", "name": "Hotdog, cebolla crujiente y salsa 100M"},
  ]},
  "montyburgers": {"items": [
    {"code": "81", "name": "Burger, queso madurado, tomate y mayonesa"},
    {"code": "82", "name": "Burger, queso madurado y mojo picón"},
    {"code": "83", "name": "Burger, guacamole y bacon ahumado"},
    {"code": "84", "name": "Burger, bacon ahumado y salsa cheddar"},
    {"code": "85", "name": "Burger, queso madurado y pepperoni"},
  ]},
  "montypizzas": {"items": [
    {"code": "86", "name": "BBQ — bacon, mozzarella, cebolla crujiente y salsa BBQ"},
    {"code": "87", "name": "Pollo — pollo kebab, mozzarella, salsa pizza y orégano"},
    {"code": "88", "name": "3 Quesos — madurado, mozzarella, gorgonzola y orégano"},
    {"code": "89", "name": "Pulled Pork — pulled pork, mozzarella, cebolla crujiente y BBQ"},
    {"code": "90", "name": "Pepperoni — pepperoni, mozzarella, salsa pizza y orégano"},
  ]},
  "montygourmet": {"items": [
    {"code": "91", "name": "Tortilla de patatas, tomate y mayonesa"},
    {"code": "92", "name": "Salmón ahumado y huevo hilado"},
    {"code": "93", "name": "Salmón ahumado y pintxo donostiarra"},
    {"code": "94", "name": "Pintxo donostiarra y atún"},
    {"code": "95", "name": "Pintxo donostiarra y huevo hilado"},
    {"code": "96", "name": "Jamón cocido, queso madurado y mantequilla"},
    {"code": "97", "name": "Jamón cocido, queso madurado, tomate y mayonesa"},
    {"code": "98", "name": "Atún, tomate y mayonesa"},
    {"code": "99", "name": "Atún, huevo hilado y mayonesa"},
    {"code": "100", "name": "Jamón Gran Reserva y mantequilla"},
  ]},
  "aperitivos": {"items": [
    {"name": "Aceitunas de la abuela"}, {"name": "Cucurucho de Patatas chips"},
    {"name": "Gildas (ud) - de boquerón"}, {"name": "Gildas (ud) - de anchoa"},
    {"name": "Patatas 4 salsas"}, {"name": "Palomitas de mouda"},
  ]},
  "postres": {"items": [
    {"name": "Helado - cono"}, {"name": "Helado - sándwich"},
  ]},
  "bebidas": {"items": [
    {"name": "Fanta", "price": "2€"}, {"name": "CocaCola 0", "price": "2€"},
    {"name": "Quijote Cerveza", "price": "2,50€"}, {"name": "Sancho de Tinto", "price": "2€"},
  ]},
  "extras": {"items": [
    {"name": "Añade extra bacon ahumado", "price": "+0,50€"},
    {"name": "Añade extra salsa", "price": "+0,30€"},
  ]},
}

CATEGORY_LABELS = {
  "casa": "De la Casa", "clasicos": "Clásicos", "imprescindibles": "Imprescindibles",
  "especiales": "Especiales", "montycookie": "MontyCookie", "montydinas": "Montydinas",
  "montyperros": "Montyperros", "montyburgers": "Montyburgers", "montypizzas": "Montypizzas",
  "montygourmet": "MontyGourmet", "aperitivos": "Aperitivos", "postres": "Postres",
  "bebidas": "Bebidas", "extras": "Extras",
}

CATEGORY_ICONS = {
  "casa": "fa-house", "clasicos": "fa-medal", "imprescindibles": "fa-fire",
  "especiales": "fa-star", "montycookie": "fa-cookie-bite", "montydinas": "fa-circle-h",
  "montyperros": "fa-hotdog", "montyburgers": "fa-burger", "montypizzas": "fa-pizza-slice",
  "montygourmet": "fa-crown", "aperitivos": "fa-bowl-food", "postres": "fa-cake-candles",
  "bebidas": "fa-wine-bottle", "extras": "fa-plus-circle",
}

# Prices for different menus
PRICES = {
    "100bocas": {
        "casa": "1€", "clasicos": "1€", "imprescindibles": "1€", "especiales": "1€",
        "montycookie": "1€", "montydinas": "1€", "montyperros": "1€", "montyburgers": "1€",
        "montypizzas": "1€", "montygourmet": "1€", "aperitivos": "1€", "postres": "1€",
    },
    "normal": {
        "casa": "2,50€", "clasicos": "2,50€", "imprescindibles": "3,00€", "especiales": "3,00€",
        "montycookie": "2,00€", "montydinas": "3,50€", "montyperros": "3,00€", "montyburgers": "3,50€",
        "montypizzas": "3,50€", "montygourmet": "3,50€", "aperitivos": "2,00€", "postres": "2,00€",
    },
    "delivery": {
        "casa": "3,00€", "clasicos": "3,00€", "imprescindibles": "3,50€", "especiales": "3,50€",
        "montycookie": "2,50€", "montydinas": "4,00€", "montyperros": "3,50€", "montyburgers": "4,00€",
        "montypizzas": "4,00€", "montygourmet": "4,00€", "aperitivos": "2,50€", "postres": "2,50€",
    },
}

MENU_CONFIGS = [
    {"name": "100Bocas (1€)", "slug": "100bocas",
     "desc": "Miércoles y domingos — Casi toda la carta a 1€", "active": True},
    {"name": "Precio Normal", "slug": "normal",
     "desc": "Resto de días — Precios regulares", "active": False},
    {"name": "A Domicilio", "slug": "delivery",
     "desc": "Precios para delivery / take away", "active": False},
]


async def seed():
    pool = await asyncpg.create_pool(DB_DSN, min_size=1, max_size=2)
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM menu_items")
        await conn.execute("DELETE FROM menu_categories")
        await conn.execute("DELETE FROM menu_configs")
        
        for mc in MENU_CONFIGS:
            menu_id = await conn.fetchval(
                "INSERT INTO menu_configs (name, slug, description, is_active) VALUES ($1, $2, $3, $4) RETURNING id",
                mc["name"], mc["slug"], mc["desc"], mc["active"]
            )
            menu_prices = PRICES.get(mc["slug"], {})
            
            for sort_idx, (cat_key, cat_data) in enumerate(MENU.items()):
                label = CATEGORY_LABELS.get(cat_key, cat_key)
                icon = CATEGORY_ICONS.get(cat_key, "fa-list")
                cat_price = menu_prices.get(cat_key)
                
                cat_id = await conn.fetchval(
                    "INSERT INTO menu_categories (menu_id, key, label, icon, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING id",
                    menu_id, cat_key, label, icon, sort_idx
                )
                
                for item_idx, item in enumerate(cat_data.get("items", [])):
                    price = item.get("price") or cat_price or ""
                    await conn.execute(
                        "INSERT INTO menu_items (category_id, code, name, ingredients, price, sort_order) VALUES ($1, $2, $3, $4, $5, $6)",
                        cat_id, item.get("code", ""), item["name"], item.get("ingredients", ""), price, item_idx
                    )
        
        # Ensure only one active
        await conn.execute("UPDATE menu_configs SET is_active = (slug = '100bocas')")
    
    await pool.close()
    print("✅ Seeded 3 menu configs with all items")


asyncio.run(seed())
