var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Link, Routes, Route, StaticRouter } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
const FEATURES = [
  { icon: "fa-users", title: "Pedidos en grupo", desc: "Cada persona añade sus montaditos en su propio perfil. Todo en una misma sesión." },
  { icon: "fa-bolt", title: "Tiempo real", desc: "Los cambios se ven al instante gracias a WebSockets. Nada de recargar la página." },
  { icon: "fa-qrcode", title: "Código QR", desc: "Comparte la sesión al instante. Escanea y únete sin escribir códigos largos." },
  { icon: "fa-calculator", title: "Resumen consolidado", desc: "Agrupa todos los pedidos por producto para hacer el pedido al restaurante de un vistazo." },
  { icon: "fa-shield-halved", title: "Sin registro", desc: "Solo necesitas un nombre. No pedimos email, teléfono ni contraseñas. Tus datos se borran en 5 días." },
  { icon: "fa-chart-simple", title: "Estadísticas anónimas", desc: "Consulta métricas de uso totalmente anonimizadas. Sin seguimiento personal." }
];
const STEPS = [
  { num: 1, title: "Crea una sesión", desc: 'Escribe tu nombre y pulsa "Crear sesión nueva". Se generará un código único de 6 caracteres.' },
  { num: 2, title: "Comparte el código", desc: "Envía el código o el QR a tus amigos. Pueden unirse desde cualquier dispositivo." },
  { num: 3, title: "Cada uno pide", desc: "Cada persona añade sus montaditos favoritos del menú. Todo se sincroniza al instante." },
  { num: 4, title: "Pedido listo", desc: "Usa el resumen consolidado para ver todo lo que hay que pedir, agrupado y con totales." }
];
function LandingPage() {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs(Helmet, { children: [
      /* @__PURE__ */ jsx("title", { children: "Euromania — Pedidos Colaborativos en Tiempo Real" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "Crea una sesión de pedidos en grupo, comparte el código con tus amigos y haced el pedido juntos en tiempo real. Sin registros, sin complicaciones. Proyecto independiente by cabrasky." }),
      /* @__PURE__ */ jsx("meta", { name: "keywords", content: "euromania, 100 montaditos, 100mon, montaditos, pedidos colaborativos, pedidos en grupo, comida, tiempo real, menú, pedir montaditos online, menú 100 montaditos, cena grupo, comida rápida, montaditos online, pedido restaurante, montaditos a domicilio" }),
      /* @__PURE__ */ jsx("meta", { name: "author", content: "cabrasky — Javier Mateos Mata" }),
      /* @__PURE__ */ jsx("meta", { name: "robots", content: "index, follow" }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: "https://euromania.cabrasky.net/" }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: "https://euromania.cabrasky.net/" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: "Euromania — Pedidos Colaborativos en Tiempo Real" }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: "Crea una sesión, comparte el código QR y haced el pedido juntos en tiempo real. Sin registros. Proyecto independiente." }),
      /* @__PURE__ */ jsx("meta", { property: "og:image", content: "https://euromania.cabrasky.net/favicon.svg" }),
      /* @__PURE__ */ jsx("meta", { property: "og:locale", content: "es_ES" }),
      /* @__PURE__ */ jsx("meta", { property: "og:site_name", content: "Euromania — Pedidos Colaborativos" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: "Euromania — Pedidos Colaborativos" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: "Crea una sesión, comparte el código y haced el pedido juntos en tiempo real. Sin registros." }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: "https://euromania.cabrasky.net/favicon.svg" }),
      /* @__PURE__ */ jsx("script", { type: "application/ld+json", children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Euromania — Pedidos Colaborativos",
        "url": "https://euromania.cabrasky.net/",
        "description": "Aplicación web para crear sesiones de pedidos en grupo en tiempo real.",
        "applicationCategory": "LifestyleApplication",
        "author": { "@type": "Person", "name": "Javier Mateos Mata", "url": "https://github.com/cabrasky" },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" }
      }) })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "landing-hero", children: /* @__PURE__ */ jsxs("div", { className: "landing-hero-inner", children: [
      /* @__PURE__ */ jsx("div", { className: "landing-hero-icon", children: /* @__PURE__ */ jsx("i", { className: "fas fa-utensils" }) }),
      /* @__PURE__ */ jsxs("div", { className: "landing-hero-badge", children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-code-branch" }),
        " Proyecto independiente"
      ] }),
      /* @__PURE__ */ jsxs("h1", { children: [
        /* @__PURE__ */ jsx("i", { children: "Euromania" }),
        /* @__PURE__ */ jsx("br", {}),
        "Pedidos Colaborativos"
      ] }),
      /* @__PURE__ */ jsx("p", { children: "Crea una sesión, comparte el código con tus amigos y haced el pedido juntos en tiempo real. Sin registros, sin complicaciones." }),
      /* @__PURE__ */ jsxs(Link, { to: "/app", className: "landing-cta", children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-right-to-bracket" }),
        " Entrar a la App"
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "landing-section landing-features", children: /* @__PURE__ */ jsxs("div", { className: "landing-container", children: [
      /* @__PURE__ */ jsxs("h2", { children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-star" }),
        " ¿Qué puedes hacer?"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "landing-grid", children: FEATURES.map((f, i) => /* @__PURE__ */ jsxs("div", { className: "landing-card", children: [
        /* @__PURE__ */ jsx("div", { className: "landing-card-icon", children: /* @__PURE__ */ jsx("i", { className: `fas ${f.icon}` }) }),
        /* @__PURE__ */ jsx("h3", { children: f.title }),
        /* @__PURE__ */ jsx("p", { children: f.desc })
      ] }, i)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "landing-section landing-how", children: /* @__PURE__ */ jsxs("div", { className: "landing-container", children: [
      /* @__PURE__ */ jsxs("h2", { children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-circle-play" }),
        " Cómo funciona"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "landing-steps", children: STEPS.map((s, i) => /* @__PURE__ */ jsxs("div", { className: "landing-step", children: [
        /* @__PURE__ */ jsx("div", { className: "landing-step-num", children: s.num }),
        /* @__PURE__ */ jsx("h3", { children: s.title }),
        /* @__PURE__ */ jsx("p", { children: s.desc })
      ] }, i)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "landing-section landing-legal", children: /* @__PURE__ */ jsx("div", { className: "landing-container", children: /* @__PURE__ */ jsxs("div", { className: "landing-legal-box", children: [
      /* @__PURE__ */ jsx("i", { className: "fas fa-scale-balanced" }),
      /* @__PURE__ */ jsx("h3", { children: "Aviso importante" }),
      /* @__PURE__ */ jsxs("p", { children: [
        "Esta aplicación es un ",
        /* @__PURE__ */ jsx("strong", { children: "proyecto independiente y no oficial" }),
        ". No está vinculada, patrocinada ni aprobada por la marca",
        " ",
        /* @__PURE__ */ jsx("strong", { children: "100 Montaditos" }),
        " ni por ",
        /* @__PURE__ */ jsx("strong", { children: "Euromania" }),
        ". Todos los nombres de productos y marcas registradas pertenecen a sus respectivos propietarios. Esta herramienta se ofrece como un servicio de utilidad para facilitar la toma de pedidos en grupo de forma colaborativa."
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx("footer", { className: "landing-footer", children: /* @__PURE__ */ jsxs("div", { className: "landing-footer-inner", children: [
      /* @__PURE__ */ jsx("div", { className: "landing-footer-icon", children: /* @__PURE__ */ jsx("i", { className: "fas fa-utensils" }) }),
      /* @__PURE__ */ jsx("h3", { children: "Euromania — Pedidos Colaborativos" }),
      /* @__PURE__ */ jsxs("p", { children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-code" }),
        " Desarrollado por ",
        /* @__PURE__ */ jsx("a", { href: "https://github.com/cabrasky", target: "_blank", rel: "noopener", children: "cabrasky" }),
        " — Javier Mateos Mata"
      ] }),
      /* @__PURE__ */ jsxs("p", { children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-tools" }),
        " Proyecto personal de código abierto"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "landing-oss-box", children: [
        /* @__PURE__ */ jsx("i", { className: "fab fa-github" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Este proyecto es ",
          /* @__PURE__ */ jsx("strong", { children: "código abierto" }),
          "."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("a", { href: "https://github.com/cabrasky/euromania-pedidos", target: "_blank", rel: "noopener", children: "Ver en GitHub" }),
          " · ",
          /* @__PURE__ */ jsx("a", { href: "https://github.com/cabrasky/euromania-pedidos/issues/new", target: "_blank", rel: "noopener", children: "Abrir issue" }),
          " · ",
          /* @__PURE__ */ jsx("a", { href: "https://github.com/cabrasky/euromania-pedidos/issues", target: "_blank", rel: "noopener", children: "Sugerir mejora" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "landing-footer-divider" }),
      /* @__PURE__ */ jsx("p", { style: { fontSize: 12, color: "#64748b" }, children: "Los datos se almacenan únicamente durante 5 días. No compartimos información con terceros." }),
      /* @__PURE__ */ jsxs("p", { style: { fontSize: 12, color: "#64748b", marginTop: 8 }, children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-shield" }),
        " Este proyecto no está afiliado a 100 Montaditos® ni Euromania®"
      ] }),
      /* @__PURE__ */ jsx("p", { style: { marginTop: 16 }, children: /* @__PURE__ */ jsxs(Link, { to: "/app", style: { fontSize: 13, color: "#6ee7b7" }, children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-arrow-right" }),
        " Ir a la aplicación"
      ] }) })
    ] }) })
  ] });
}
const CATEGORY_LABELS = {
  casa: "De la Casa",
  clasicos: "Clásicos",
  imprescindibles: "Imprescindibles",
  especiales: "Especiales",
  montycookie: "MontyCookie",
  montydinas: "Montydinas",
  montyperros: "Montyperros",
  montyburgers: "Montyburgers",
  montypizzas: "Montypizzas",
  montygourmet: "MontyGourmet",
  aperitivos: "Aperitivos",
  postres: "Postres",
  bebidas: "Bebidas",
  extras: "Extras"
};
const CATEGORY_ICONS = {
  casa: "fa-house",
  clasicos: "fa-medal",
  imprescindibles: "fa-fire",
  especiales: "fa-star",
  montycookie: "fa-cookie-bite",
  montydinas: "fa-circle-h",
  montyperros: "fa-hotdog",
  montyburgers: "fa-burger",
  montypizzas: "fa-pizza-slice",
  montygourmet: "fa-crown",
  aperitivos: "fa-bowl-food",
  postres: "fa-cake-candles",
  bebidas: "fa-wine-bottle",
  extras: "fa-plus-circle"
};
const MENU = {
  casa: { price: "1€", items: [
    { code: "01", name: "Jamón Gran Reserva y aceite de oliva" },
    { code: "02", name: "Tortilla de patatas y tomate" },
    { code: "03", name: "Pulled pork BBQ" },
    { code: "04", name: "Pollo y salsa alioli" },
    { code: "05", name: "Carrillera al vino tinto" },
    { code: "06", name: "Calamarcitos y mayonesa" },
    { code: "07", name: "Pollo kebab y salsa BBQ" },
    { code: "08", name: "Bacon ahumado y queso madurado" },
    { code: "09", name: "Torreznos y salsa brava" },
    { code: "10", name: "Lomo al ajillo y salsa 100M" }
  ] },
  clasicos: { price: "1€", items: [
    { code: "11", name: "Tortilla de patatas y queso madurado" },
    { code: "12", name: "Tortilla de patatas, bacon ahumado y salsa alioli" },
    { code: "13", name: "Tortilla de patatas, tomate y mayonesa" },
    { code: "14", name: "Tortilla de patatas y mojo picón" },
    { code: "15", name: "Tortilla de patatas, patatas paja y salsa 100M" },
    { code: "16", name: "Tortilla de patatas, cebolla crujiente y salsa BBQ" },
    { code: "17", name: "Pollo y queso madurado" },
    { code: "18", name: "Pollo, tomate y mojo picón" },
    { code: "19", name: "Pollo, patatas paja y salsa de mostaza y miel" },
    { code: "20", name: "Pollo, bacon ahumado y mayonesa" },
    { code: "21", name: "Pollo, patatas paja y salsa BBQ" },
    { code: "22", name: "Pollo kebab y tomate" },
    { code: "23", name: "Pollo kebab y salsa cheddar" },
    { code: "24", name: "Pollo kebab, tomate y salsa 100M" },
    { code: "25", name: "Pollo kebab, patatas paja y salsa BBQ" },
    { code: "26", name: "Pollo kebab, bacon ahumado y mayonesa" }
  ] },
  imprescindibles: { price: "1€", items: [
    { code: "27", name: "Pulled pork BBQ y salsa cheddar" },
    { code: "28", name: "Pulled pork BBQ y bacon ahumado" },
    { code: "29", name: "Pulled pork BBQ y salsa brava" },
    { code: "30", name: "Pulled pork BBQ y patatas paja" },
    { code: "31", name: "Pulled pork BBQ y cebolla crujiente" },
    { code: "32", name: "Lomo al ajillo y queso madurado" },
    { code: "33", name: "Lomo al ajillo y queso gorgonzola" },
    { code: "34", name: "Lomo al ajillo y mojo picón" },
    { code: "35", name: "Lomo al ajillo, tomate y patatas paja" },
    { code: "36", name: "Lomo al ajillo, tomate y mayonesa" },
    { code: "37", name: "Lomo al ajillo, bacon ahumado y salsa alioli" },
    { code: "38", name: "Calamarcitos y salsa alioli" },
    { code: "39", name: "Calamarcitos y salsa 100M" },
    { code: "40", name: "Calamarcitos y guacamole" },
    { code: "41", name: "Calamarcitos, salsa brava y mayonesa" },
    { code: "42", name: "Calamarcitos, tomate y mayonesa" },
    { code: "43", name: "Bacon ahumado, tomate y mayonesa" },
    { code: "44", name: "Bacon ahumado, cebolla crujiente y salsa 100M" },
    { code: "45", name: "Bacon ahumado, tomate y queso gorgonzola" },
    { code: "46", name: "Bacon ahumado, patatas paja y mayonesa" },
    { code: "47", name: "Bacon ahumado, tomate y queso madurado" }
  ] },
  especiales: { price: "1€", items: [
    { code: "48", name: "Jamón Gran Reserva y mantequilla" },
    { code: "49", name: "Jamón Gran Reserva y tomate" },
    { code: "50", name: "Jamón Gran Reserva, tomate y patatas paja" },
    { code: "51", name: "Jamón Gran Reserva y tortilla de patatas" },
    { code: "52", name: "Carrillera al vino tinto y salsa alioli" },
    { code: "53", name: "Carrillera al vino tinto y patatas paja" },
    { code: "54", name: "Carrillera al vino tinto y tomate" },
    { code: "55", name: "Carrillera al vino tinto y cebolla crujiente" },
    { code: "56", name: "Carrillera al vino tinto y bacon ahumado" },
    { code: "57", name: "Torreznos y mayonesa" },
    { code: "58", name: "Torreznos y salsa alioli" },
    { code: "59", name: "Torreznos y salsa 100M" },
    { code: "60", name: "Salmón ahumado y queso gorgonzola" },
    { code: "61", name: "Salmón ahumado y tomate" },
    { code: "62", name: "Salmón ahumado y salsa de mostaza y miel" },
    { code: "63", name: "Salmón ahumado y guacamole" },
    { code: "64", name: "Chorizo parrillero y salsa brava" },
    { code: "65", name: "Chorizo parrillero y queso gorgonzola" },
    { code: "66", name: "Chorizo parrillero y salsa BBQ" },
    { code: "67", name: "Chorizo parrillero y guacamole" }
  ] },
  montycookie: { price: "1€", items: [
    { code: "68", name: "Montycookie doble chocolate y sirope de caramelo toffee" },
    { code: "69", name: "Montycookie chocolate y sirope de pistacho" },
    { code: "70", name: "Montycookie chocolate y sirope de chocolate" }
  ] },
  montydinas: { price: "1€", items: [
    { code: "71", name: "Piadina de jamón cocido y queso mozzarella" },
    { code: "72", name: "Piadina de pepperoni y queso mozzarella" },
    { code: "73", name: "Piadina de pollo, tomate, queso mozzarella y orégano" },
    { code: "74", name: "Piadina de jamón Gran Reserva, queso mozzarella y orégano" },
    { code: "75", name: "Piadina de jamón cocido, queso madurado y tomate" }
  ] },
  montyperros: { price: "1€", items: [
    { code: "76", name: "Hotdog, kétchup y mayonesa" },
    { code: "77", name: "Hotdog, cebolla crujiente y mojo picón" },
    { code: "78", name: "Hotdog, guacamole y salsa cheddar" },
    { code: "79", name: "Hotdog, patatas paja y salsa alioli" },
    { code: "80", name: "Hotdog, cebolla crujiente y salsa 100M" }
  ] },
  montyburgers: { price: "1€", items: [
    { code: "81", name: "Burger, queso madurado, tomate y mayonesa" },
    { code: "82", name: "Burger, queso madurado y mojo picón" },
    { code: "83", name: "Burger, guacamole y bacon ahumado" },
    { code: "84", name: "Burger, bacon ahumado y salsa cheddar" },
    { code: "85", name: "Burger, queso madurado y pepperoni" }
  ] },
  montypizzas: { price: "1€", items: [
    { code: "86", name: "BBQ — bacon, mozzarella, cebolla crujiente y salsa BBQ" },
    { code: "87", name: "Pollo — pollo kebab, mozzarella, salsa pizza y orégano" },
    { code: "88", name: "3 Quesos — madurado, mozzarella, gorgonzola y orégano" },
    { code: "89", name: "Pulled Pork — pulled pork, mozzarella, cebolla crujiente y BBQ" },
    { code: "90", name: "Pepperoni — pepperoni, mozzarella, salsa pizza y orégano" }
  ] },
  montygourmet: { price: "1€", items: [
    { code: "91", name: "Tortilla de patatas, tomate y mayonesa" },
    { code: "92", name: "Salmón ahumado y huevo hilado" },
    { code: "93", name: "Salmón ahumado y pintxo donostiarra" },
    { code: "94", name: "Pintxo donostiarra y atún" },
    { code: "95", name: "Pintxo donostiarra y huevo hilado" },
    { code: "96", name: "Jamón cocido, queso madurado y mantequilla" },
    { code: "97", name: "Jamón cocido, queso madurado, tomate y mayonesa" },
    { code: "98", name: "Atún, tomate y mayonesa" },
    { code: "99", name: "Atún, huevo hilado y mayonesa" },
    { code: "100", name: "Jamón Gran Reserva y mantequilla" }
  ] },
  aperitivos: { price: "1€", items: [
    { name: "Aceitunas de la abuela" },
    { name: "Cucurucho de Patatas chips" },
    { name: "Gildas (ud) - de boquerón" },
    { name: "Gildas (ud) - de anchoa" },
    { name: "Patatas 4 salsas" },
    { name: "Palomitas de mouda" }
  ] },
  postres: { price: "1€", items: [
    { name: "Helado - cono" },
    { name: "Helado - sándwich" }
  ] },
  bebidas: { items: [
    { name: "Fanta", price: "2€" },
    { name: "CocaCola 0", price: "2€" },
    { name: "Quijote Cerveza", price: "2,50€" },
    { name: "Sancho de Tinto", price: "2€" }
  ] },
  extras: { items: [
    { name: "Añade extra bacon ahumado", price: "+0,50€" },
    { name: "Añade extra salsa", price: "+0,30€" }
  ] }
};
let _activeMenu = null;
let _activeMenuLookup = null;
function setActiveMenu(menu) {
  _activeMenu = menu;
  if (menu) {
    _activeMenuLookup = {};
    for (const cat of menu.categories) {
      _activeMenuLookup[cat.key] = {};
      for (const item of cat.items) {
        const key = item.code || item.name;
        _activeMenuLookup[cat.key][key] = item;
      }
    }
  } else {
    _activeMenuLookup = null;
  }
}
function getActiveMenu() {
  return _activeMenu;
}
function getKey(item) {
  return item.code || item.name;
}
function parsePrice(ps) {
  if (!ps) return 0;
  return parseFloat(ps.replace(",", ".").replace(/[€+]/g, "").trim()) || 0;
}
function getCatLabel(k) {
  if (_activeMenu) {
    for (const cat of _activeMenu.categories) {
      if (cat.key === k) return cat.label;
    }
  }
  return CATEGORY_LABELS[k] || k;
}
function getCatIcon(k) {
  if (_activeMenu) {
    for (const cat of _activeMenu.categories) {
      if (cat.key === k) return cat.icon;
    }
  }
  return CATEGORY_ICONS[k] || "fa-list";
}
function getPrice(catKey, item) {
  var _a, _b;
  if (_activeMenuLookup) {
    const catItems = _activeMenuLookup[catKey];
    if (catItems) {
      const lookupKey = item.code || item.name;
      const apiItem = catItems[lookupKey];
      if (apiItem == null ? void 0 : apiItem.price) return apiItem.price;
    }
  }
  if (item.price) return item.price;
  const cat = MENU[catKey];
  if (cat == null ? void 0 : cat.price) return cat.price;
  for (const [k, v] of Object.entries(CATEGORY_LABELS)) {
    const label = v.replace(" 1€", "");
    const catKeyClean = catKey.replace(" 1€", "");
    if (v === catKey || k === catKeyClean || label === catKeyClean) {
      if ((_a = MENU[k]) == null ? void 0 : _a.price) return MENU[k].price;
    }
  }
  const categoryData = MENU[catKey];
  if (categoryData == null ? void 0 : categoryData.items) {
    const found = categoryData.items.find(
      (mi) => mi.name === item.name || item.code && mi.code === item.code
    );
    if (found == null ? void 0 : found.price) return found.price;
    for (const cat2 of Object.values(MENU)) {
      const f = (_b = cat2.items) == null ? void 0 : _b.find(
        (mi) => mi.name === item.name || item.code && mi.code === item.code
      );
      if (f == null ? void 0 : f.price) return f.price;
    }
  }
  return "";
}
function findItem(key) {
  if (_activeMenuLookup) {
    for (const [catKey, items] of Object.entries(_activeMenuLookup)) {
      const apiItem = items[key];
      if (apiItem) {
        return {
          category: catKey,
          item: { code: apiItem.code || void 0, name: apiItem.name, ingredients: apiItem.ingredients, price: apiItem.price }
        };
      }
    }
  }
  for (const [ck, cat] of Object.entries(MENU)) {
    if (!cat.items) continue;
    for (const item of cat.items) {
      if (getKey(item) === key) return { category: ck, item };
    }
  }
  return null;
}
const API_BASE = "";
async function api(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" }
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${API_BASE}${path}`, opts);
  return r.json();
}
function fetchActiveMenu() {
  return api("GET", "/api/menu/active");
}
function createSession() {
  return api("POST", "/api/session");
}
function joinSession(code) {
  return api("POST", `/api/session/${code}/join`);
}
function addPerson(code, name) {
  return api("POST", `/api/session/${code}/person`, { name });
}
function removePerson(code, name) {
  return api("DELETE", `/api/session/${code}/person/${encodeURIComponent(name)}`);
}
function upsertItem(code, personName, itemKey, itemName, itemCode, category, qty) {
  return api("PUT", `/api/session/${code}/person/${encodeURIComponent(personName)}/item`, {
    item_key: itemKey,
    item_name: itemName,
    item_code: itemCode,
    category,
    qty
  });
}
function removeItem(code, personName, itemKey) {
  return api("DELETE", `/api/session/${code}/person/${encodeURIComponent(personName)}/item/${encodeURIComponent(itemKey)}`);
}
function clearPerson(code, personName) {
  return api("DELETE", `/api/session/${code}/person/${encodeURIComponent(personName)}/clear`);
}
const COOKIE_NAME = "euromania";
function setSessionCookie(code, name) {
  const val = encodeURIComponent(JSON.stringify({ code, name }));
  document.cookie = `${COOKIE_NAME}=${val};path=/;max-age=${30 * 24 * 3600};SameSite=Lax`;
}
function getSessionCookie() {
  const m = document.cookie.match(new RegExp(`(?:^| )${COOKIE_NAME}=([^;]+)`));
  if (!m) return null;
  try {
    return JSON.parse(decodeURIComponent(m[1]));
  } catch {
    return null;
  }
}
function clearSessionCookie() {
  document.cookie = `${COOKIE_NAME}=;path=/;max-age=0;SameSite=Lax`;
}
class SessionWebSocket {
  constructor(code, onMessage) {
    __publicField(this, "ws");
    __publicField(this, "onMessage");
    this.onMessage = onMessage;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    this.ws = new WebSocket(`${protocol}//${host}/ws/${code}`);
    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.onMessage(msg);
      } catch (e) {
        console.error("WS parse error:", e);
      }
    };
    this.ws.onclose = () => {
      console.log("WS closed");
    };
  }
  close() {
    this.ws.close();
  }
}
function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const base = window.location.origin;
  useEffect(() => {
    setTimeout(() => {
      const el = document.querySelector(".admin-login-input");
      if (el) el.focus();
    }, 200);
  }, []);
  const handleLogin = async () => {
    if (!password.trim()) return;
    setLoginError("");
    setLoginBusy(true);
    try {
      const r = await fetch(`${base}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() })
      });
      const data = await r.json();
      if (data.error) {
        setLoginError(data.error);
        setLoginBusy(false);
      } else {
        onLogin(data.token);
        setLoginBusy(false);
      }
    } catch {
      setLoginError("Error de conexión");
      setLoginBusy(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "admin-body", children: /* @__PURE__ */ jsxs("div", { className: "admin-login", children: [
    /* @__PURE__ */ jsx("div", { className: "admin-login-icon", children: /* @__PURE__ */ jsx("i", { className: "fas fa-lock" }) }),
    /* @__PURE__ */ jsx("h3", { children: "Acceso restringido" }),
    /* @__PURE__ */ jsx("p", { className: "admin-login-desc", children: "Introduce la contraseña de administrador para acceder al panel." }),
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "password",
        className: "admin-login-input",
        placeholder: "Contraseña de administrador",
        value: password,
        onChange: (e) => setPassword(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") handleLogin();
        },
        autoComplete: "off"
      }
    ),
    loginError && /* @__PURE__ */ jsxs("div", { className: "admin-login-error", children: [
      "❌ ",
      loginError
    ] }),
    /* @__PURE__ */ jsx("button", { className: "admin-login-btn", onClick: handleLogin, disabled: loginBusy || !password.trim(), children: loginBusy ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("i", { className: "fas fa-spinner fa-spin" }),
      " Verificando..."
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("i", { className: "fas fa-right-to-bracket" }),
      " Entrar"
    ] }) })
  ] }) });
}
const CAT_LABELS = {
  euromania: "Euromania",
  clasicos: "Clásicos",
  imprescindibles: "Imprescindibles",
  especiales: "Especiales",
  montycookie: "MontyCookie",
  montydinas: "Montydinas",
  montyperros: "Montyperros",
  montyburgers: "Montyburgers",
  montypizzas: "Montypizzas",
  montygourmet: "MontyGourmet",
  aperitivos: "Aperitivos",
  postres: "Postres",
  bebidas: "Bebidas",
  extras: "Extras",
  premium: "Premium",
  especiales_sin_gluten: "Sin Gluten"
};
function AdminStats({ authHeaders, base }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch(`${base}/api/admin/stats`, { headers: authHeaders() });
        if (r.status === 401 || r.status === 403) return;
        setStats(await r.json());
      } catch {
        setError("Error al cargar estadísticas");
      }
      setLoading(false);
    };
    load();
  }, [base, authHeaders]);
  const fmt = (n) => n.toLocaleString("es-ES");
  const barWidth = (val, max) => max > 0 ? val / max * 100 : 0;
  if (loading) return /* @__PURE__ */ jsxs("div", { className: "admin-loading", children: [
    /* @__PURE__ */ jsx("i", { className: "fas fa-spinner fa-spin" }),
    " Cargando..."
  ] });
  if (error) return /* @__PURE__ */ jsxs("div", { className: "admin-error", children: [
    "⚠️ ",
    error
  ] });
  if (!stats) return null;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "admin-note", children: [
      /* @__PURE__ */ jsx("i", { className: "fas fa-shield-halved" }),
      "Datos totalmente anonimizados — no se muestran nombres, IPs ni códigos de sesión"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "admin-metrics", children: [
      /* @__PURE__ */ jsxs("div", { className: "metric-card", children: [
        /* @__PURE__ */ jsx("span", { className: "metric-icon", children: /* @__PURE__ */ jsx("i", { className: "fas fa-users" }) }),
        /* @__PURE__ */ jsx("span", { className: "metric-value", children: fmt(stats.totals.active_sessions) }),
        /* @__PURE__ */ jsx("span", { className: "metric-label", children: "Sesiones activas" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "metric-card", children: [
        /* @__PURE__ */ jsx("span", { className: "metric-icon", children: /* @__PURE__ */ jsx("i", { className: "fas fa-cube" }) }),
        /* @__PURE__ */ jsx("span", { className: "metric-value", children: fmt(stats.totals.total_items) }),
        /* @__PURE__ */ jsx("span", { className: "metric-label", children: "Items totales" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "metric-card", children: [
        /* @__PURE__ */ jsx("span", { className: "metric-icon", children: /* @__PURE__ */ jsx("i", { className: "fas fa-user" }) }),
        /* @__PURE__ */ jsx("span", { className: "metric-value", children: fmt(stats.totals.total_persons) }),
        /* @__PURE__ */ jsx("span", { className: "metric-label", children: "Personas" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "metric-card", children: [
        /* @__PURE__ */ jsx("span", { className: "metric-icon", children: /* @__PURE__ */ jsx("i", { className: "fas fa-wifi" }) }),
        /* @__PURE__ */ jsx("span", { className: "metric-value", children: fmt(stats.ws_connected) }),
        /* @__PURE__ */ jsx("span", { className: "metric-label", children: "Conectados ahora" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "admin-section", children: [
      /* @__PURE__ */ jsxs("h3", { children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-clock" }),
        " Sesiones creadas"
      ] }),
      ["sessions_24h", "sessions_7d", "total_sessions"].map((k) => /* @__PURE__ */ jsxs("div", { className: "admin-row", children: [
        /* @__PURE__ */ jsx("span", { children: k === "sessions_24h" ? "Últimas 24h" : k === "sessions_7d" ? "Últimos 7 días" : "Total histórico" }),
        /* @__PURE__ */ jsx("div", { className: "admin-bar-bg", children: /* @__PURE__ */ jsx("div", { className: "admin-bar", style: { width: `${k === "total_sessions" ? 100 : barWidth(stats.totals[k], stats.totals.total_sessions)}%` } }) }),
        /* @__PURE__ */ jsx("span", { className: "admin-val", children: fmt(stats.totals[k]) })
      ] }, k))
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "admin-section", children: [
      /* @__PURE__ */ jsxs("h3", { children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-cart-shopping" }),
        " Pedidos"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "admin-row", children: [
        /* @__PURE__ */ jsx("span", { children: "Items últimas 24h" }),
        /* @__PURE__ */ jsx("div", { className: "admin-bar-bg", children: /* @__PURE__ */ jsx("div", { className: "admin-bar", style: { width: `${barWidth(stats.totals.items_24h, stats.totals.total_items)}%` } }) }),
        /* @__PURE__ */ jsx("span", { className: "admin-val", children: fmt(stats.totals.items_24h) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "admin-row", children: [
        /* @__PURE__ */ jsx("span", { children: "Media items/persona" }),
        /* @__PURE__ */ jsx("div", { className: "admin-bar-bg", children: /* @__PURE__ */ jsx("div", { className: "admin-bar", style: { width: `${Math.min(stats.totals.avg_items_per_person * 6, 100)}%` } }) }),
        /* @__PURE__ */ jsx("span", { className: "admin-val", children: stats.totals.avg_items_per_person })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "admin-row", children: [
        /* @__PURE__ */ jsx("span", { children: "Media personas/sesión" }),
        /* @__PURE__ */ jsx("div", { className: "admin-bar-bg", children: /* @__PURE__ */ jsx("div", { className: "admin-bar", style: { width: `${Math.min(stats.totals.avg_people_per_session * 20, 100)}%` } }) }),
        /* @__PURE__ */ jsx("span", { className: "admin-val", children: stats.totals.avg_people_per_session })
      ] })
    ] }),
    stats.categories.length > 0 && /* @__PURE__ */ jsxs("div", { className: "admin-section", children: [
      /* @__PURE__ */ jsxs("h3", { children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-chart-pie" }),
        " Categorías más pedidas"
      ] }),
      stats.categories.slice(0, 10).map((c) => {
        const max = stats.categories[0].count;
        return /* @__PURE__ */ jsxs("div", { className: "admin-row", children: [
          /* @__PURE__ */ jsx("span", { children: CAT_LABELS[c.category] || c.category }),
          /* @__PURE__ */ jsx("div", { className: "admin-bar-bg", children: /* @__PURE__ */ jsx("div", { className: "admin-bar cat-bar", style: { width: `${barWidth(c.count, max)}%` } }) }),
          /* @__PURE__ */ jsx("span", { className: "admin-val", children: fmt(c.count) })
        ] }, c.category);
      })
    ] }),
    stats.hourly_activity.length > 0 && /* @__PURE__ */ jsxs("div", { className: "admin-section", children: [
      /* @__PURE__ */ jsxs("h3", { children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-chart-line" }),
        " Actividad por hora"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "admin-hourly-grid", children: Array.from({ length: 24 }, (_, h) => {
        const found = stats.hourly_activity.find((a) => a.hour === h);
        const count = found ? found.count : 0;
        const peak = Math.max(...stats.hourly_activity.map((a) => a.count), 1);
        return /* @__PURE__ */ jsxs("div", { className: "hour-bar-wrap", children: [
          /* @__PURE__ */ jsx("div", { className: "hour-bar", style: { height: `${barWidth(count, peak)}%` }, title: `${h}:00 — ${count} sesiones` }),
          /* @__PURE__ */ jsx("span", { className: "hour-label", children: h })
        ] }, h);
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "admin-section", children: [
      /* @__PURE__ */ jsxs("h3", { children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-plug" }),
        " Conexiones en vivo"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "admin-row", children: [
        /* @__PURE__ */ jsx("span", { children: "WebSockets activos" }),
        /* @__PURE__ */ jsx("span", { className: "admin-val", children: fmt(stats.ws_connected) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "admin-row", children: [
        /* @__PURE__ */ jsx("span", { children: "Salas activas" }),
        /* @__PURE__ */ jsx("span", { className: "admin-val", children: fmt(stats.ws_rooms) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "admin-footer", children: [
      /* @__PURE__ */ jsxs("p", { children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-database" }),
        " Todos los datos son agregados y anónimos"
      ] }),
      /* @__PURE__ */ jsxs("p", { children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-trash-can" }),
        " Datos eliminados automáticamente a los 5 días"
      ] })
    ] })
  ] });
}
function AdminBans({ authHeaders, base }) {
  const [bans, setBans] = useState(null);
  const [banIp, setBanIp] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banMsg, setBanMsg] = useState("");
  const [banMsgType, setBanMsgType] = useState("ok");
  const [showCheck, setShowCheck] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch(`${base}/api/admin/bans`, { headers: authHeaders() });
      if (r.status === 401 || r.status === 403) return;
      setBans(await r.json());
    } catch {
    }
  }, [base, authHeaders]);
  useEffect(() => {
    load();
  }, [load]);
  const handleBan = async () => {
    if (!banIp.trim()) return;
    setBanMsg("");
    try {
      const r = await fetch(`${base}/api/admin/bans`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ ip: banIp.trim(), reason: banReason.trim() || "Baneado desde panel admin" })
      });
      const data = await r.json();
      if (r.status === 401 || r.status === 403) return;
      if (data.error) {
        setBanMsg(data.error);
        setBanMsgType("err");
      } else {
        setBanMsg(`✅ IP ${banIp} bloqueada`);
        setBanMsgType("ok");
        setBanIp("");
        setBanReason("");
        load();
      }
    } catch {
      setBanMsg("❌ Error al conectar");
      setBanMsgType("err");
    }
  };
  const handleUnban = async (ip) => {
    try {
      const r = await fetch(`${base}/api/admin/bans/${ip}`, { method: "DELETE", headers: authHeaders() });
      if (r.status === 401 || r.status === 403) return;
      const data = await r.json();
      if (data.error) {
        setBanMsg(data.error);
        setBanMsgType("err");
      } else {
        setBanMsg(`✅ IP ${ip} desbloqueada`);
        setBanMsgType("ok");
        load();
      }
    } catch {
      setBanMsg("❌ Error al conectar");
      setBanMsgType("err");
    }
  };
  const handleCheckMyIp = async () => {
    try {
      const r = await fetch(`${base}/api/admin/bans/check`, { headers: authHeaders() });
      if (r.status === 401 || r.status === 403) return;
      setCheckResult(await r.json());
      setShowCheck(true);
    } catch {
      setCheckResult({ error: "Error al verificar" });
      setShowCheck(true);
    }
  };
  const fmtTime = (ts) => {
    const d = new Date(ts * 1e3);
    return d.toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };
  const fmtExpires = (secs) => {
    if (secs === null) return "Permanente";
    if (secs <= 0) return "Expirado";
    return `${Math.floor(secs / 3600)}h ${Math.floor(secs % 3600 / 60)}m`;
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "admin-section", children: [
      /* @__PURE__ */ jsxs("h3", { children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-ban" }),
        " Bloquear una IP"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "ban-form", children: [
        /* @__PURE__ */ jsx("input", { type: "text", className: "ban-input", placeholder: "Dirección IP (ej: 192.168.1.100)", value: banIp, onChange: (e) => setBanIp(e.target.value), onKeyDown: (e) => e.key === "Enter" && handleBan() }),
        /* @__PURE__ */ jsx("input", { type: "text", className: "ban-input ban-input-reason", placeholder: "Motivo (opcional)", value: banReason, onChange: (e) => setBanReason(e.target.value), onKeyDown: (e) => e.key === "Enter" && handleBan() }),
        /* @__PURE__ */ jsxs("button", { className: "ban-btn", onClick: handleBan, disabled: !banIp.trim(), children: [
          /* @__PURE__ */ jsx("i", { className: "fas fa-lock" }),
          " Bloquear"
        ] })
      ] }),
      banMsg && /* @__PURE__ */ jsx("div", { className: `ban-msg ${banMsgType === "ok" ? "ban-msg-ok" : "ban-msg-err"}`, children: banMsg })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "admin-section", children: [
      /* @__PURE__ */ jsxs("h3", { children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-robot" }),
        " Auto-ban automático"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "admin-row", children: [
        /* @__PURE__ */ jsx("span", { children: "Estado" }),
        /* @__PURE__ */ jsx("span", { className: "admin-val", style: { color: (bans == null ? void 0 : bans.auto_ban_enabled) ? "#059669" : "#ef4444" }, children: (bans == null ? void 0 : bans.auto_ban_enabled) ? "✅ Activado" : "❌ Desactivado" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "admin-row", children: [
        /* @__PURE__ */ jsx("span", { children: "Violaciones para auto-ban" }),
        /* @__PURE__ */ jsx("span", { className: "admin-val", children: (bans == null ? void 0 : bans.auto_ban_threshold) || 5 })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "admin-row", children: [
        /* @__PURE__ */ jsx("span", { children: "Duración del auto-ban" }),
        /* @__PURE__ */ jsxs("span", { className: "admin-val", children: [
          (bans == null ? void 0 : bans.auto_ban_duration_h) || 24,
          "h"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "ban-desc", children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-info-circle" }),
        " Si una IP excede el límite de peticiones más de ",
        (bans == null ? void 0 : bans.auto_ban_threshold) || 5,
        " veces en 10 minutos, se bloquea automáticamente durante ",
        (bans == null ? void 0 : bans.auto_ban_duration_h) || 24,
        " horas."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "admin-section", children: [
      /* @__PURE__ */ jsxs("h3", { children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-search" }),
        " Verificar mi IP"
      ] }),
      /* @__PURE__ */ jsxs("button", { className: "ban-check-btn", onClick: handleCheckMyIp, children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-shield" }),
        " Comprobar mi dirección IP"
      ] }),
      showCheck && checkResult && /* @__PURE__ */ jsxs("div", { className: `ban-check-result ${checkResult.banned ? "banned" : "not-banned"}`, children: [
        checkResult.error ? /* @__PURE__ */ jsxs("span", { children: [
          "❌ ",
          checkResult.error
        ] }) : checkResult.banned ? /* @__PURE__ */ jsxs("span", { children: [
          "🚫 ",
          /* @__PURE__ */ jsx("strong", { children: "IP bloqueada:" }),
          " ",
          checkResult.reason
        ] }) : /* @__PURE__ */ jsxs("span", { children: [
          "✅ ",
          /* @__PURE__ */ jsx("strong", { children: "IP limpia." }),
          " No estás bloqueado."
        ] }),
        checkResult.your_ip && !checkResult.error && /* @__PURE__ */ jsxs("span", { className: "ban-check-ip", children: [
          "Tu IP: ",
          /* @__PURE__ */ jsx("code", { children: checkResult.your_ip })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "admin-section", children: [
      /* @__PURE__ */ jsxs("h3", { children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-list" }),
        " IPs bloqueadas ",
        bans && bans.total > 0 && /* @__PURE__ */ jsx("span", { className: "ban-count", children: bans.total })
      ] }),
      !bans || bans.bans.length === 0 ? /* @__PURE__ */ jsxs("p", { className: "ban-empty", children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-check-circle", style: { color: "#059669" } }),
        " No hay IPs bloqueadas"
      ] }) : /* @__PURE__ */ jsx("div", { className: "ban-list", children: bans.bans.map((b) => /* @__PURE__ */ jsxs("div", { className: `ban-item ${b.auto_ban ? "auto" : "manual"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "ban-item-left", children: [
          /* @__PURE__ */ jsx("span", { className: "ban-ip", children: /* @__PURE__ */ jsx("code", { children: b.ip }) }),
          /* @__PURE__ */ jsx("span", { className: "ban-reason", children: b.reason }),
          /* @__PURE__ */ jsxs("span", { className: "ban-meta", children: [
            /* @__PURE__ */ jsx("i", { className: "fas fa-clock" }),
            " ",
            fmtTime(b.banned_at),
            b.auto_ban ? " · Auto" : " · Manual",
            b.expires_in !== null ? ` · Expira: ${fmtExpires(b.expires_in)}` : " · Permanente"
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "ban-unban-btn", onClick: () => handleUnban(b.ip), title: "Desbloquear IP", children: /* @__PURE__ */ jsx("i", { className: "fas fa-unlock" }) })
      ] }, b.ip)) })
    ] })
  ] });
}
const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAY_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
function AdminMenus({ authHeaders, base }) {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("ok");
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editingMenu, setEditingMenu] = useState(null);
  const [schMsg, setSchMsg] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${base}/api/admin/menus`, { headers: authHeaders() });
      if (r.status === 401 || r.status === 403) return;
      setMenus(await r.json());
    } catch {
      setMsg("Error al cargar");
      setMsgType("err");
    }
    setLoading(false);
  }, [base, authHeaders]);
  useEffect(() => {
    load();
  }, [load]);
  const showMsg = (m, t) => {
    setMsg(m);
    setMsgType(t);
    setTimeout(() => setMsg(""), 3e3);
  };
  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) return;
    try {
      const r = await fetch(`${base}/api/admin/menus`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim(), description: newDesc.trim() })
      });
      const data = await r.json();
      if (data.error) {
        showMsg(data.error, "err");
      } else {
        showMsg(`✅ "${newName}" creada`, "ok");
        setNewName("");
        setNewSlug("");
        setNewDesc("");
        load();
      }
    } catch {
      showMsg("Error al crear", "err");
    }
  };
  const handleActivate = async (id) => {
    try {
      const r = await fetch(`${base}/api/admin/menus/${id}/activate`, { method: "POST", headers: authHeaders() });
      const data = await r.json();
      if (data.error) {
        showMsg(data.error, "err");
      } else {
        showMsg("✅ Carta activada", "ok");
        load();
        if ((editingMenu == null ? void 0 : editingMenu.id) === id) loadMenu(id);
      }
    } catch {
      showMsg("Error", "err");
    }
  };
  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar la carta "${name}"?`)) return;
    try {
      const r = await fetch(`${base}/api/admin/menus/${id}`, { method: "DELETE", headers: authHeaders() });
      const data = await r.json();
      if (data.error) {
        showMsg(data.error, "err");
      } else {
        showMsg(`✅ "${name}" eliminada`, "ok");
        load();
        if ((editingMenu == null ? void 0 : editingMenu.id) === id) setEditingMenu(null);
      }
    } catch {
      showMsg("Error", "err");
    }
  };
  const handleDuplicate = async (id) => {
    try {
      const r = await fetch(`${base}/api/admin/menus/${id}/duplicate`, { method: "POST", headers: authHeaders() });
      const data = await r.json();
      if (data.error) {
        showMsg(data.error, "err");
      } else {
        showMsg(`✅ Duplicada como "${data.name}"`, "ok");
        load();
      }
    } catch {
      showMsg("Error al duplicar", "err");
    }
  };
  const loadMenu = async (id) => {
    try {
      const r = await fetch(`${base}/api/admin/menus/${id}`, { headers: authHeaders() });
      if (r.status === 401 || r.status === 403) return;
      setEditingMenu(await r.json());
    } catch {
      showMsg("Error al cargar detalle", "err");
    }
  };
  const handleSetSchedule = async (menuId, day, add) => {
    if (!editingMenu) return;
    const current = editingMenu.schedules.map((s) => s.day);
    const days = add ? [...current, day].sort() : current.filter((d) => d !== day);
    try {
      const r = await fetch(`${base}/api/admin/menus/${menuId}/schedules`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ days })
      });
      const data = await r.json();
      if (data.error) {
        setSchMsg(data.error);
      } else {
        setSchMsg("✅ Horario actualizado");
        loadMenu(menuId);
      }
    } catch {
      setSchMsg("Error");
    }
    setTimeout(() => setSchMsg(""), 2500);
  };
  const handleAddCategory = async (menuId) => {
    const key = prompt("Key (slug, ej: clasicos):");
    if (!(key == null ? void 0 : key.trim())) return;
    const label = prompt("Label (nombre visible, ej: Clásicos):");
    if (!(label == null ? void 0 : label.trim())) return;
    try {
      const r = await fetch(`${base}/api/admin/menus/${menuId}/categories`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ key: key.trim(), label: label.trim(), icon: "fa-list" })
      });
      const data = await r.json();
      if (data.error) {
        showMsg(data.error, "err");
      } else {
        showMsg(`✅ Categoría "${label}" creada`, "ok");
        loadMenu(menuId);
      }
    } catch {
      showMsg("Error", "err");
    }
  };
  const handleDeleteCategory = async (catId, menuId) => {
    if (!window.confirm("¿Eliminar esta categoría y todos sus productos?")) return;
    try {
      await fetch(`${base}/api/admin/categories/${catId}`, { method: "DELETE", headers: authHeaders() });
      showMsg("✅ Categoría eliminada", "ok");
      loadMenu(menuId);
    } catch {
      showMsg("Error", "err");
    }
  };
  const handleAddItem = async (catId, menuId) => {
    const name = prompt("Nombre del producto:");
    if (!(name == null ? void 0 : name.trim())) return;
    const code = prompt("Código (opcional, ej: 01):") || "";
    const price = prompt("Precio (opcional, ej: 1€):") || "";
    try {
      const r = await fetch(`${base}/api/admin/categories/${catId}/items`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: name.trim(), code, price })
      });
      const data = await r.json();
      if (data.error) {
        showMsg(data.error, "err");
      } else {
        showMsg(`✅ "${name}" añadido`, "ok");
        loadMenu(menuId);
      }
    } catch {
      showMsg("Error", "err");
    }
  };
  const handleEditItem = async (item, catId, menuId) => {
    const name = prompt("Nombre:", item.name);
    if (!(name == null ? void 0 : name.trim())) return;
    const code = prompt("Código:", item.code) || "";
    const price = prompt("Precio:", item.price) || "";
    try {
      await fetch(`${base}/api/admin/items/${item.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ name: name.trim(), code, price })
      });
      showMsg("✅ Producto actualizado", "ok");
      loadMenu(menuId);
    } catch {
      showMsg("Error", "err");
    }
  };
  const handleDeleteItem = async (itemId, itemName, menuId) => {
    if (!window.confirm(`¿Eliminar "${itemName}"?`)) return;
    try {
      await fetch(`${base}/api/admin/items/${itemId}`, { method: "DELETE", headers: authHeaders() });
      showMsg(`✅ "${itemName}" eliminado`, "ok");
      loadMenu(menuId);
    } catch {
      showMsg("Error", "err");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "admin-menus", children: [
    msg && /* @__PURE__ */ jsx("div", { className: `ban-msg ${msgType === "ok" ? "ban-msg-ok" : "ban-msg-err"}`, style: { marginBottom: 12 }, children: msg }),
    !editingMenu && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "admin-section", children: [
        /* @__PURE__ */ jsxs("h3", { children: [
          /* @__PURE__ */ jsx("i", { className: "fas fa-plus-circle" }),
          " Nueva carta"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "menu-create-form", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              className: "menu-input",
              placeholder: "Nombre (ej: Euromanía 1€)",
              value: newName,
              onChange: (e) => setNewName(e.target.value)
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              className: "menu-input",
              placeholder: "Slug (ej: euromania)",
              value: newSlug,
              onChange: (e) => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              className: "menu-input",
              placeholder: "Descripción (opcional)",
              value: newDesc,
              onChange: (e) => setNewDesc(e.target.value)
            }
          ),
          /* @__PURE__ */ jsxs("button", { className: "menu-create-btn", onClick: handleCreate, disabled: !newName.trim() || !newSlug.trim(), children: [
            /* @__PURE__ */ jsx("i", { className: "fas fa-plus" }),
            " Crear carta"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "admin-section", children: [
        /* @__PURE__ */ jsxs("h3", { children: [
          /* @__PURE__ */ jsx("i", { className: "fas fa-list" }),
          " Cartas configuradas"
        ] }),
        loading ? /* @__PURE__ */ jsxs("div", { className: "admin-loading", children: [
          /* @__PURE__ */ jsx("i", { className: "fas fa-spinner fa-spin" }),
          " Cargando..."
        ] }) : menus.length === 0 ? /* @__PURE__ */ jsxs("p", { className: "ban-empty", children: [
          /* @__PURE__ */ jsx("i", { className: "fas fa-book" }),
          " No hay cartas configuradas"
        ] }) : /* @__PURE__ */ jsx("div", { className: "menu-list", children: menus.map((m) => /* @__PURE__ */ jsxs("div", { className: `menu-card ${m.is_active ? "active-menu" : ""}`, children: [
          /* @__PURE__ */ jsxs("div", { className: "menu-card-left", style: { cursor: "pointer" }, onClick: () => loadMenu(m.id), children: [
            /* @__PURE__ */ jsxs("div", { className: "menu-card-name", children: [
              m.is_active && /* @__PURE__ */ jsx("span", { className: "menu-active-badge", children: /* @__PURE__ */ jsx("i", { className: "fas fa-check-circle" }) }),
              /* @__PURE__ */ jsx("strong", { children: m.name }),
              /* @__PURE__ */ jsx("span", { className: "menu-slug", children: /* @__PURE__ */ jsx("code", { children: m.slug }) })
            ] }),
            m.description && /* @__PURE__ */ jsx("div", { className: "menu-card-desc", children: m.description }),
            /* @__PURE__ */ jsxs("div", { className: "menu-card-meta", style: { display: "flex", gap: 12 }, children: [
              /* @__PURE__ */ jsxs("span", { children: [
                "Creada ",
                m.created_at ? new Date(m.created_at).toLocaleDateString("es-ES") : "—"
              ] }),
              /* @__PURE__ */ jsxs("span", { style: { color: "#3b82f6", fontWeight: 600 }, children: [
                /* @__PURE__ */ jsx("i", { className: "fas fa-eye" }),
                " Ver detalle"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "menu-card-right", children: [
            !m.is_active && /* @__PURE__ */ jsxs("button", { className: "menu-activate-btn", onClick: () => handleActivate(m.id), title: "Activar esta carta", children: [
              /* @__PURE__ */ jsx("i", { className: "fas fa-check" }),
              " Activar"
            ] }),
            m.is_active && /* @__PURE__ */ jsx("span", { className: "menu-active-label", children: "Activa" }),
            /* @__PURE__ */ jsx("button", { className: "menu-duplicate-btn", onClick: () => handleDuplicate(m.id), title: "Duplicar carta", children: /* @__PURE__ */ jsx("i", { className: "fas fa-copy" }) }),
            /* @__PURE__ */ jsx("button", { className: "menu-delete-btn", onClick: () => handleDelete(m.id, m.name), title: "Eliminar carta", children: /* @__PURE__ */ jsx("i", { className: "fas fa-trash-can" }) })
          ] })
        ] }, m.id)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "admin-note", style: { marginTop: 12 }, children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-info-circle" }),
        "Haz clic en ",
        /* @__PURE__ */ jsx("strong", { children: '"Ver detalle"' }),
        " para editar categorías, productos y horarios."
      ] })
    ] }),
    editingMenu && /* @__PURE__ */ jsx(
      DetailView,
      {
        menu: editingMenu,
        authHeaders,
        base,
        onBack: () => setEditingMenu(null),
        onRefresh: () => loadMenu(editingMenu.id),
        onActivate: handleActivate,
        onMsg: showMsg,
        schMsg,
        onSetSchedule: handleSetSchedule,
        onAddCategory: handleAddCategory,
        onDeleteCategory: handleDeleteCategory,
        onAddItem: handleAddItem,
        onEditItem: handleEditItem,
        onDeleteItem: handleDeleteItem
      }
    )
  ] });
}
function DetailView({ menu, authHeaders, base, onBack, onRefresh, onActivate, onMsg, schMsg, onSetSchedule, onAddCategory, onDeleteCategory, onAddItem, onEditItem, onDeleteItem }) {
  const scheduledDays = menu.schedules.map((s) => s.day);
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }, children: [
      /* @__PURE__ */ jsxs("button", { className: "menu-back-btn", onClick: onBack, style: {
        background: "#f1f5f9",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "8px 14px",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "inherit",
        color: "#475569",
        display: "flex",
        alignItems: "center",
        gap: 6
      }, children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-arrow-left" }),
        " Volver"
      ] }),
      /* @__PURE__ */ jsxs("h3", { style: { flex: 1, fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }, children: [
        menu.name,
        menu.is_active && /* @__PURE__ */ jsx("span", { className: "menu-active-label", children: "Activa" }),
        !menu.is_active && /* @__PURE__ */ jsxs("button", { className: "menu-activate-btn", onClick: () => onActivate(menu.id), style: { fontSize: 11, padding: "4px 10px" }, children: [
          /* @__PURE__ */ jsx("i", { className: "fas fa-check" }),
          " Activar"
        ] })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "menu-slug", children: /* @__PURE__ */ jsx("code", { children: menu.slug }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "admin-section", children: [
      /* @__PURE__ */ jsxs("h3", { children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-calendar" }),
        " Programación por día"
      ] }),
      /* @__PURE__ */ jsx("p", { style: { fontSize: 12, color: "#64748b", marginBottom: 10 }, children: "Selecciona los días en que esta carta debe activarse automáticamente." }),
      /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: DAY_NAMES.map((d, i) => {
        const active = scheduledDays.includes(i);
        return /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => onSetSchedule(menu.id, i, !active),
            style: {
              padding: "6px 12px",
              borderRadius: 8,
              border: active ? "2px solid #059669" : "1.5px solid #e2e8f0",
              background: active ? "#f0fdf4" : "#fff",
              color: active ? "#065f46" : "#64748b",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all .15s"
            },
            children: [
              active ? "✅ " : "",
              d
            ]
          },
          i
        );
      }) }),
      schMsg && /* @__PURE__ */ jsx("div", { className: "ban-msg ban-msg-ok", style: { marginTop: 8, fontSize: 11 }, children: schMsg }),
      scheduledDays.length > 0 && /* @__PURE__ */ jsxs("p", { style: { fontSize: 11, color: "#94a3b8", marginTop: 8 }, children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-clock" }),
        " Se activa los: ",
        scheduledDays.sort().map((d) => DAY_FULL[d]).join(", ")
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "admin-section", children: [
      /* @__PURE__ */ jsxs("h3", { children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-eye" }),
        " Vista previa"
      ] }),
      menu.categories.length === 0 ? /* @__PURE__ */ jsxs("p", { className: "ban-empty", children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-folder-open" }),
        " Sin categorías"
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }, children: [
          /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, color: "#94a3b8", padding: "4px 0", marginRight: 4 }, children: [
            "Categorías (",
            menu.categories.length,
            "):"
          ] }),
          menu.categories.map((c) => /* @__PURE__ */ jsxs("span", { style: {
            background: "#f1f5f9",
            padding: "3px 8px",
            borderRadius: 6,
            fontSize: 11,
            color: "#475569",
            display: "inline-flex",
            alignItems: "center",
            gap: 4
          }, children: [
            /* @__PURE__ */ jsx("i", { className: `fas ${c.icon}`, style: { fontSize: 9 } }),
            " ",
            c.label,
            /* @__PURE__ */ jsxs("span", { style: { color: "#94a3b8", fontSize: 10 }, children: [
              "(",
              c.items.length,
              ")"
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => onDeleteCategory(c.id, menu.id),
                style: { background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 10, padding: 0 },
                children: "✕"
              }
            )
          ] }, c.id)),
          /* @__PURE__ */ jsxs("button", { onClick: () => onAddCategory(menu.id), style: {
            background: "none",
            border: "1px dashed #94a3b8",
            borderRadius: 6,
            padding: "3px 8px",
            fontSize: 11,
            color: "#64748b",
            cursor: "pointer",
            fontFamily: "inherit"
          }, children: [
            /* @__PURE__ */ jsx("i", { className: "fas fa-plus" }),
            " Añadir"
          ] })
        ] }),
        menu.categories.map((c) => /* @__PURE__ */ jsxs("div", { style: { marginBottom: 12, border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#fafafa" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }, children: [
            /* @__PURE__ */ jsx("i", { className: `fas ${c.icon}`, style: { color: "#059669", fontSize: 12 } }),
            /* @__PURE__ */ jsx("strong", { style: { fontSize: 13 }, children: c.label }),
            /* @__PURE__ */ jsxs("span", { style: { fontSize: 10, color: "#94a3b8" }, children: [
              "key: ",
              c.key
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: () => onAddItem(c.id, menu.id), style: {
              marginLeft: "auto",
              background: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: 6,
              padding: "3px 10px",
              fontSize: 11,
              fontWeight: 600,
              color: "#059669",
              cursor: "pointer",
              fontFamily: "inherit"
            }, children: [
              /* @__PURE__ */ jsx("i", { className: "fas fa-plus" }),
              " Producto"
            ] })
          ] }),
          c.items.length === 0 ? /* @__PURE__ */ jsx("p", { style: { fontSize: 11, color: "#94a3b8", padding: "8px 0" }, children: "Sin productos" }) : /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: c.items.map((i) => /* @__PURE__ */ jsxs("div", { style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 8px",
            background: "#fff",
            borderRadius: 6,
            border: "1px solid #f1f5f9",
            fontSize: 12
          }, children: [
            i.code && /* @__PURE__ */ jsxs("span", { style: { color: "#94a3b8", fontWeight: 700, fontSize: 10 }, children: [
              "#",
              i.code
            ] }),
            /* @__PURE__ */ jsx("span", { style: { flex: 1, fontWeight: 600 }, children: i.name }),
            i.ingredients && /* @__PURE__ */ jsx("span", { style: { color: "#94a3b8", fontSize: 10 }, children: i.ingredients }),
            /* @__PURE__ */ jsx("span", { style: { fontWeight: 700, color: "#059669" }, children: i.price }),
            /* @__PURE__ */ jsx("button", { onClick: () => onEditItem(i, c.id, menu.id), style: {
              background: "none",
              border: "none",
              color: "#3b82f6",
              cursor: "pointer",
              fontSize: 11
            }, children: /* @__PURE__ */ jsx("i", { className: "fas fa-pen" }) }),
            /* @__PURE__ */ jsx("button", { onClick: () => onDeleteItem(i.id, i.name, menu.id), style: {
              background: "none",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: 11
            }, children: /* @__PURE__ */ jsx("i", { className: "fas fa-trash-can" }) })
          ] }, i.id)) })
        ] }, c.id))
      ] })
    ] })
  ] });
}
const dupStyle = document.createElement("style");
dupStyle.textContent = `
  .menu-duplicate-btn {
    background: none; border: 1px solid #e2e8f0; border-radius: 8px;
    width: 32px; height: 32px; cursor: pointer; font-size: 13px;
    color: #3b82f6; display: flex; align-items: center; justify-content: center;
    transition: all .15s;
  }
  .menu-duplicate-btn:hover { background: #eff6ff; border-color: #93c5fd; }
`;
document.head.appendChild(dupStyle);
function AdminPanel({ onClose }) {
  const [token, setToken] = useState(null);
  const [tab, setTab] = useState("stats");
  const base = window.location.origin;
  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  }), [token]);
  const handleLogout = () => setToken(null);
  return /* @__PURE__ */ jsx("div", { className: "admin-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "admin-modal", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "admin-header", children: [
      /* @__PURE__ */ jsx("i", { className: "fas fa-chart-simple" }),
      /* @__PURE__ */ jsx("h2", { children: "Panel de administración" }),
      /* @__PURE__ */ jsx("button", { className: "admin-close", onClick: onClose, children: /* @__PURE__ */ jsx("i", { className: "fas fa-xmark" }) })
    ] }),
    !token && /* @__PURE__ */ jsx(AdminLogin, { onLogin: setToken }),
    token && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "admin-tabs", children: [
        /* @__PURE__ */ jsxs("button", { className: `admin-tab ${tab === "stats" ? "active" : ""}`, onClick: () => setTab("stats"), children: [
          /* @__PURE__ */ jsx("i", { className: "fas fa-chart-simple" }),
          " Estadísticas"
        ] }),
        /* @__PURE__ */ jsxs("button", { className: `admin-tab ${tab === "bans" ? "active" : ""}`, onClick: () => setTab("bans"), children: [
          /* @__PURE__ */ jsx("i", { className: "fas fa-shield-halved" }),
          " IPs Bloqueadas"
        ] }),
        /* @__PURE__ */ jsxs("button", { className: `admin-tab ${tab === "menus" ? "active" : ""}`, onClick: () => setTab("menus"), children: [
          /* @__PURE__ */ jsx("i", { className: "fas fa-book" }),
          " Cartas"
        ] }),
        /* @__PURE__ */ jsx("button", { className: "admin-tab admin-tab-logout", onClick: handleLogout, title: "Cerrar sesión", children: /* @__PURE__ */ jsx("i", { className: "fas fa-right-from-bracket" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "admin-body", children: [
        tab === "stats" && /* @__PURE__ */ jsx(AdminStats, { authHeaders, base }),
        tab === "bans" && /* @__PURE__ */ jsx(AdminBans, { authHeaders, base }),
        tab === "menus" && /* @__PURE__ */ jsx(AdminMenus, { authHeaders, base })
      ] })
    ] })
  ] }) });
}
function LoginScreen({ onLogin }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  useEffect(() => {
    const joinCode = window.__joinCode;
    if (joinCode) {
      setCode(joinCode);
      window.__joinCode = void 0;
    }
  }, []);
  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Escribe tu nombre");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await onLogin(name.trim());
    } catch {
      setError("Error al crear sesión");
      setBusy(false);
    }
  };
  const handleJoin = async () => {
    if (!name.trim()) {
      setError("Escribe tu nombre");
      return;
    }
    if (!code.trim() || code.trim().length < 4) {
      setError("Código inválido");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await onLogin(name.trim(), code.trim().toUpperCase());
    } catch (e) {
      setError(e.message || "Sesión no encontrada");
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "login-overlay", children: /* @__PURE__ */ jsxs("div", { className: "login-card", children: [
      /* @__PURE__ */ jsxs("h2", { children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-utensils" }),
        " Euromania"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "login-sub", children: "Pedidos colaborativos en tiempo real" }),
      error && /* @__PURE__ */ jsxs("div", { className: "login-error", children: [
        "⚠️ ",
        error
      ] }),
      /* @__PURE__ */ jsx("label", { htmlFor: "loginName", children: "Tu nombre" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "loginName",
          type: "text",
          placeholder: "Ej: Ainoha",
          value: name,
          onChange: (e) => setName(e.target.value),
          onKeyDown: (e) => e.key === "Enter" && handleCreate(),
          autoComplete: "off"
        }
      ),
      /* @__PURE__ */ jsxs("button", { className: "btn-primary", onClick: handleCreate, disabled: busy, children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-plus-circle" }),
        " Crear sesión nueva"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "divider", children: "o únete a una existente" }),
      /* @__PURE__ */ jsxs("div", { className: "join-row", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            placeholder: "CÓDIGO",
            maxLength: 6,
            value: code,
            onChange: (e) => setCode(e.target.value.toUpperCase()),
            onKeyDown: (e) => e.key === "Enter" && handleJoin(),
            autoComplete: "off"
          }
        ),
        /* @__PURE__ */ jsx("button", { onClick: handleJoin, disabled: busy, children: /* @__PURE__ */ jsx("i", { className: "fas fa-right-to-bracket" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "my-name-hint", children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-info-circle" }),
        " Usa el mismo nombre para reconectar a tu pedido"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "login-footer-links", children: [
        /* @__PURE__ */ jsxs("button", { className: "admin-link", onClick: () => setShowAdmin(true), children: [
          /* @__PURE__ */ jsx("i", { className: "fas fa-chart-simple" }),
          " Estadísticas"
        ] }),
        /* @__PURE__ */ jsxs(Link, { to: "/", className: "admin-link", children: [
          /* @__PURE__ */ jsx("i", { className: "fas fa-circle-info" }),
          " Acerca de"
        ] })
      ] })
    ] }) }),
    showAdmin && /* @__PURE__ */ jsx(AdminPanel, { onClose: () => setShowAdmin(false) })
  ] });
}
function Header({ myName, sessionCode, onCopyCode, onShowQR, onLeave, onShowPrivacy, sessionUrl, menuName }) {
  const handleShareWhatsApp = () => {
    const msg = encodeURIComponent(
      `🍔 *Euromania — Pedido Colaborativo*

Código: *${sessionCode}*

Únete aquí: ${sessionUrl}

Añade tus montaditos y coordinamos el pedido 🎉`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };
  return /* @__PURE__ */ jsxs("header", { children: [
    /* @__PURE__ */ jsxs("div", { className: "header-left", children: [
      /* @__PURE__ */ jsxs("h1", { children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-utensils" }),
        "Euromania"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "subtitle", children: [
        "Conectado como ",
        myName,
        menuName ? /* @__PURE__ */ jsxs("span", { className: "menu-badge", children: [
          " · ",
          /* @__PURE__ */ jsx("i", { className: "fas fa-tag" }),
          " ",
          menuName
        ] }) : ""
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "header-right", children: [
      /* @__PURE__ */ jsxs("div", { className: "code-badge", onClick: onCopyCode, title: "Copiar código", children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-link" }),
        " ",
        sessionCode
      ] }),
      /* @__PURE__ */ jsx("button", { className: "qr-btn", onClick: onShowQR, title: "Mostrar código QR", children: /* @__PURE__ */ jsx("i", { className: "fas fa-qrcode" }) }),
      /* @__PURE__ */ jsx("button", { className: "whatsapp-btn", onClick: handleShareWhatsApp, title: "Compartir por WhatsApp", children: /* @__PURE__ */ jsx("i", { className: "fab fa-whatsapp" }) }),
      /* @__PURE__ */ jsx("a", { href: "https://github.com/cabrasky/euromania-pedidos", target: "_blank", rel: "noopener", className: "github-btn", title: "Ver en GitHub (código abierto)", children: /* @__PURE__ */ jsx("i", { className: "fab fa-github" }) }),
      /* @__PURE__ */ jsx("button", { className: "privacy-btn", onClick: onShowPrivacy, title: "Aviso legal y privacidad", children: /* @__PURE__ */ jsx("i", { className: "fas fa-shield-halved" }) }),
      /* @__PURE__ */ jsxs("button", { className: "leave-btn", onClick: onLeave, title: "Salir de la sesión", children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-right-from-bracket" }),
        " Salir"
      ] })
    ] })
  ] });
}
function PersonBar({ persons, myName, currentPersonIdx, onSelectPerson, onDeletePerson, onAddPerson }) {
  return /* @__PURE__ */ jsxs("div", { className: "persons-bar", children: [
    persons.map((p, i) => {
      const count = Object.values(p.items).reduce((s, o) => s + o.qty, 0);
      const active = i === currentPersonIdx ? "active" : "";
      const isMe = p.name === myName;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          className: `person-chip ${active}`,
          onClick: () => onSelectPerson(i),
          children: [
            /* @__PURE__ */ jsx("i", { className: `fas ${isMe ? "fa-crown" : "fa-user"}` }),
            " ",
            p.name,
            isMe ? /* @__PURE__ */ jsx("span", { style: { fontSize: 9, opacity: 0.6 }, children: " (tú)" }) : "",
            /* @__PURE__ */ jsx("span", { className: "p-count", children: count }),
            !isMe && /* @__PURE__ */ jsx(
              "span",
              {
                className: "p-del",
                onClick: (e) => {
                  e.stopPropagation();
                  onDeletePerson(i);
                },
                title: "Eliminar",
                children: "✕"
              }
            )
          ]
        },
        p.name
      );
    }),
    /* @__PURE__ */ jsxs("button", { className: "add-person-btn", onClick: onAddPerson, children: [
      /* @__PURE__ */ jsx("i", { className: "fas fa-plus" }),
      " Añadir persona"
    ] })
  ] });
}
function MenuGrid({ persons, currentPersonIdx, activeCat, searchTerm, onSetCategory, onSearchChange, onToggleItem }) {
  const person = persons[currentPersonIdx] || persons[0] || null;
  const cats = useMemo(() => {
    const active = getActiveMenu();
    if (active) return active.categories.map((c) => c.key);
    return Object.keys(MENU);
  }, []);
  const filteredCats = useMemo(() => {
    return activeCat === "all" ? cats : [activeCat];
  }, [activeCat, cats]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "cats", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          className: `cat-btn ${activeCat === "all" ? "active" : ""}`,
          onClick: () => onSetCategory("all"),
          children: "Todo"
        }
      ),
      cats.map((k) => /* @__PURE__ */ jsxs(
        "button",
        {
          className: `cat-btn ${activeCat === k ? "active" : ""}`,
          onClick: () => onSetCategory(k),
          children: [
            /* @__PURE__ */ jsx("i", { className: `fas ${getCatIcon(k)}` }),
            " ",
            getCatLabel(k)
          ]
        },
        k
      ))
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "search-bar", children: [
      /* @__PURE__ */ jsx("i", { className: "fas fa-search" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          placeholder: "Buscar...",
          value: searchTerm,
          onChange: (e) => onSearchChange(e.target.value)
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "menu-grid", children: [
      filteredCats.map((catKey) => {
        const cat = MENU[catKey];
        if (!(cat == null ? void 0 : cat.items)) return null;
        const q = searchTerm.toLowerCase();
        const filtered = cat.items.filter(
          (i) => !q || (i.code || "").includes(q) || i.name.toLowerCase().includes(q)
        );
        if (filtered.length === 0) return null;
        return /* @__PURE__ */ jsxs("div", { style: { gridColumn: "1 / -1" }, children: [
          activeCat === "all" && /* @__PURE__ */ jsx("div", { className: "section-title", children: getCatLabel(catKey) }),
          /* @__PURE__ */ jsx("div", { style: { display: "contents" }, children: filtered.map((item) => {
            const key = getKey(item);
            const inOrder = person == null ? void 0 : person.items[key];
            const price = getPrice(catKey, item);
            return /* @__PURE__ */ jsxs(
              "div",
              {
                className: "menu-card",
                onClick: () => onToggleItem(catKey, key),
                children: [
                  item.code && /* @__PURE__ */ jsxs("span", { className: "code", children: [
                    "#",
                    item.code
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "name", children: item.name }),
                  item.ingredients && /* @__PURE__ */ jsx("div", { className: "ingredients", children: item.ingredients }),
                  price && /* @__PURE__ */ jsx("div", { className: "price", children: price }),
                  inOrder && /* @__PURE__ */ jsx("div", { className: "added-badge", children: inOrder.qty })
                ]
              },
              key
            );
          }) })
        ] }, catKey);
      }),
      filteredCats.every((c) => {
        var _a;
        const cat = MENU[c];
        const q = searchTerm.toLowerCase();
        return !((_a = cat == null ? void 0 : cat.items) == null ? void 0 : _a.some((i) => !q || (i.code || "").includes(q) || i.name.toLowerCase().includes(q)));
      }) && /* @__PURE__ */ jsx("div", { style: { gridColumn: "1 / -1", textAlign: "center", padding: 40, color: "#94a3b8", fontWeight: 600 }, children: "Sin resultados" })
    ] })
  ] });
}
function OrderPanel({ currentPerson, persons, onChangeQty, onRemoveItem, onClear, onExport, onExportConsolidated }) {
  const [collapsed, setCollapsed] = useState(true);
  const items = useMemo(() => currentPerson ? Object.values(currentPerson.items) : [], [currentPerson]);
  const count = useMemo(() => items.reduce((s, o) => s + o.qty, 0), [items]);
  const personTotal = useMemo(
    () => items.reduce((s, o) => s + parsePrice(getPrice(o.category, o.item)) * o.qty, 0),
    [items]
  );
  const catTotals = useMemo(() => {
    const byCat = {};
    persons.forEach((p) => {
      Object.values(p.items).forEach((o) => {
        const catKey = o.category;
        if (!byCat[catKey]) byCat[catKey] = { ud: 0, price: 0 };
        byCat[catKey].ud += o.qty;
        byCat[catKey].price += parsePrice(getPrice(o.category, o.item)) * o.qty;
      });
    });
    return byCat;
  }, [persons]);
  const groupTotal = useMemo(
    () => Object.values(catTotals).reduce((s, c) => s + c.price, 0),
    [catTotals]
  );
  return /* @__PURE__ */ jsxs("div", { className: `order-panel ${collapsed ? "collapsed" : ""}`, children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        className: "drag-handle",
        onClick: () => setCollapsed(!collapsed),
        "aria-label": collapsed ? "Abrir pedido" : "Cerrar pedido",
        children: /* @__PURE__ */ jsx("span", { className: "drag-handle-bar" })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "order-panel-header", children: [
      /* @__PURE__ */ jsx("div", { className: "op-avatar", children: /* @__PURE__ */ jsx("i", { className: "fas fa-user" }) }),
      /* @__PURE__ */ jsx("h2", { children: (currentPerson == null ? void 0 : currentPerson.name) || "—" }),
      /* @__PURE__ */ jsx("span", { className: "op-count", children: count })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "order-sub", children: items.length === 0 ? "Toca un producto para añadirlo" : `${count} producto${count !== 1 ? "s" : ""}` }),
    /* @__PURE__ */ jsx("div", { className: "order-items", children: items.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "order-empty", children: [
      /* @__PURE__ */ jsx("i", { className: "fas fa-cart-plus" }),
      /* @__PURE__ */ jsx("p", { children: "Sin productos" })
    ] }) : items.map((o) => {
      const key = getKey(o.item);
      return /* @__PURE__ */ jsxs("div", { className: "order-item", children: [
        /* @__PURE__ */ jsx("span", { className: "oi-code", children: o.item.code ? "#" + o.item.code : "" }),
        /* @__PURE__ */ jsx("div", { className: "oi-info", children: /* @__PURE__ */ jsx("div", { className: "oi-name", children: o.item.name }) }),
        /* @__PURE__ */ jsxs("div", { className: "oi-qty", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => onChangeQty(key, -1), children: /* @__PURE__ */ jsx("i", { className: "fas fa-minus" }) }),
          /* @__PURE__ */ jsx("span", { className: "qty-num", children: o.qty }),
          /* @__PURE__ */ jsx("button", { onClick: () => onChangeQty(key, 1), children: /* @__PURE__ */ jsx("i", { className: "fas fa-plus" }) })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "oi-remove", onClick: () => onRemoveItem(key), children: /* @__PURE__ */ jsx("i", { className: "fas fa-xmark" }) })
      ] }, key);
    }) }),
    items.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "order-person-total", children: [
        /* @__PURE__ */ jsx("span", { children: "Total persona" }),
        /* @__PURE__ */ jsxs("span", { children: [
          personTotal.toFixed(2).replace(".", ","),
          "€"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "group-summary", children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }, children: "Resumen grupo" }),
        /* @__PURE__ */ jsx("div", { id: "groupRows", children: persons.map((p, i) => {
          const total = Object.values(p.items).reduce((s, o) => s + parsePrice(getPrice(o.category, o.item)) * o.qty, 0);
          const active = p.name === (currentPerson == null ? void 0 : currentPerson.name);
          return /* @__PURE__ */ jsxs("div", { className: "group-row", style: active ? { background: "#eff6ff", borderRadius: 8, padding: "4px 8px" } : {}, children: [
            /* @__PURE__ */ jsxs("span", { className: "gr-name", children: [
              active ? "▶ " : "",
              p.name
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "gr-total", children: [
              total.toFixed(2).replace(".", ","),
              "€"
            ] })
          ] }, p.name);
        }) }),
        Object.keys(catTotals).length > 0 && /* @__PURE__ */ jsxs("div", { style: { marginTop: 10, paddingTop: 10, borderTop: "1px solid #e2e8f0" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }, children: [
            /* @__PURE__ */ jsx("i", { className: "fas fa-layer-group", style: { marginRight: 4 } }),
            "Por categoría"
          ] }),
          Object.entries(catTotals).map(([catKey, ct]) => {
            const label = CATEGORY_LABELS[catKey] || catKey;
            return /* @__PURE__ */ jsxs("div", { className: "group-row", style: { fontSize: 12 }, children: [
              /* @__PURE__ */ jsx("span", { className: "gr-name", children: label }),
              /* @__PURE__ */ jsxs("span", { className: "gr-total", children: [
                ct.ud,
                " ud · ",
                ct.price.toFixed(2).replace(".", ","),
                "€"
              ] })
            ] }, catKey);
          })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "group-total-row", children: [
          /* @__PURE__ */ jsx("span", { className: "gt-label", children: "Total grupo" }),
          /* @__PURE__ */ jsxs("span", { children: [
            groupTotal.toFixed(2).replace(".", ","),
            "€"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "order-actions", children: [
      /* @__PURE__ */ jsxs("button", { className: "btn-clear", onClick: onClear, children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-trash-can" }),
        " ",
        /* @__PURE__ */ jsx("span", { children: "Vaciar" })
      ] }),
      /* @__PURE__ */ jsxs("button", { className: "btn-export", onClick: onExport, children: [
        /* @__PURE__ */ jsx("i", { className: "fas fa-clipboard-list" }),
        " ",
        /* @__PURE__ */ jsx("span", { children: "Personas" })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: "btn-export",
          onClick: onExportConsolidated,
          style: { background: "#f0fdf4", border: "1px solid #86efac", color: "#166534" },
          children: [
            /* @__PURE__ */ jsx("i", { className: "fas fa-list" }),
            " ",
            /* @__PURE__ */ jsx("span", { children: "Pedido" })
          ]
        }
      )
    ] })
  ] });
}
function QRModal({ open, onClose, sessionUrl }) {
  const qrRef = useRef(null);
  const qrInstance = useRef(null);
  useEffect(() => {
    if (open && qrRef.current && !qrInstance.current) {
      qrRef.current.innerHTML = "";
      qrInstance.current = new QRCode(qrRef.current, {
        text: sessionUrl,
        width: 200,
        height: 200,
        colorDark: "#1e293b",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    }
    if (!open) {
      qrInstance.current = null;
    }
  }, [open, sessionUrl]);
  if (!open) return null;
  return /* @__PURE__ */ jsx("div", { className: "modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "modal-box", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "modal-header", children: [
      /* @__PURE__ */ jsx("i", { className: "fas fa-qrcode" }),
      /* @__PURE__ */ jsx("h2", { children: "Escanea para unirte" }),
      /* @__PURE__ */ jsx("button", { className: "modal-close", onClick: onClose, children: /* @__PURE__ */ jsx("i", { className: "fas fa-xmark" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "modal-body", children: [
      /* @__PURE__ */ jsx("div", { className: "qr-code-wrap", children: /* @__PURE__ */ jsx("div", { ref: qrRef }) }),
      /* @__PURE__ */ jsx("div", { className: "qr-link", children: /* @__PURE__ */ jsx("a", { href: sessionUrl, target: "_blank", rel: "noopener", children: sessionUrl }) })
    ] })
  ] }) });
}
function PrivacyModal({ open, onClose }) {
  if (!open) return null;
  return /* @__PURE__ */ jsx("div", { className: "modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "admin-modal", style: { maxWidth: 600 }, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "admin-header", style: { background: "linear-gradient(135deg, #1e3a5f, #2d6a9f)" }, children: [
      /* @__PURE__ */ jsx("i", { className: "fas fa-shield-halved", style: { color: "#fbbf24" } }),
      /* @__PURE__ */ jsx("h2", { children: "Aviso Legal y Privacidad" }),
      /* @__PURE__ */ jsx("button", { className: "admin-close", onClick: onClose, children: /* @__PURE__ */ jsx("i", { className: "fas fa-xmark" }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "admin-body", children: /* @__PURE__ */ jsxs("div", { className: "modal-privacy-content", children: [
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsxs("h3", { children: [
          /* @__PURE__ */ jsx("i", { className: "fas fa-database" }),
          " Almacenamiento de datos"
        ] }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsxs("li", { children: [
            "Los datos de los pedidos se almacenan únicamente durante un máximo de ",
            /* @__PURE__ */ jsx("strong", { children: "5 días" }),
            " desde su creación."
          ] }),
          /* @__PURE__ */ jsx("li", { children: "Transcurrido ese plazo, los datos se eliminan automáticamente de nuestros servidores." }),
          /* @__PURE__ */ jsx("li", { children: "Las sesiones inactivas durante más de 24 horas también se eliminan automáticamente." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsxs("h3", { children: [
          /* @__PURE__ */ jsx("i", { className: "fas fa-hand-peace" }),
          " Uso de la información"
        ] }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsxs("li", { children: [
            "Los datos recopilados se utilizan ",
            /* @__PURE__ */ jsx("strong", { children: "exclusivamente" }),
            " para gestionar los pedidos colaborativos dentro de cada sesión."
          ] }),
          /* @__PURE__ */ jsx("li", { children: "No se comparten con terceros ni se utilizan para ninguna actividad económica, comercial o publicitaria." }),
          /* @__PURE__ */ jsx("li", { children: "No se realiza ningún tipo de perfilado, análisis comercial o venta de datos." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsxs("h3", { children: [
          /* @__PURE__ */ jsx("i", { className: "fas fa-user-secret" }),
          " Información personal"
        ] }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsx("li", { children: "El único dato personal solicitado es un nombre elegido libremente por el usuario para identificarse en la sesión." }),
          /* @__PURE__ */ jsx("li", { children: "No se requieren correos electrónicos, números de teléfono ni ningún otro dato personal." }),
          /* @__PURE__ */ jsx("li", { children: "No se utilizan cookies de rastreo ni sistemas de analítica externa." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsxs("h3", { children: [
          /* @__PURE__ */ jsx("i", { className: "fas fa-chart-simple" }),
          " Estadísticas de uso"
        ] }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsxs("li", { children: [
            "Se recogen ",
            /* @__PURE__ */ jsx("strong", { children: "estadísticas agregadas y anónimas" }),
            " sobre el uso de la plataforma: número de sesiones, pedidos, categorías populares y franjas horarias de actividad."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "Estos datos son ",
            /* @__PURE__ */ jsx("strong", { children: "totalmente anonimizados" }),
            ": no incluyen nombres de usuario, IPs, códigos de sesión ni ningún dato que permita identificar a personas concretas."
          ] }),
          /* @__PURE__ */ jsx("li", { children: "Las estadísticas se usan únicamente para entender el funcionamiento del servicio y mejorar la experiencia." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsxs("h3", { children: [
          /* @__PURE__ */ jsx("i", { className: "fas fa-gavel" }),
          " Base legal"
        ] }),
        /* @__PURE__ */ jsx("p", { children: "Este servicio se ofrece como una herramienta interna para facilitar la toma de pedidos en grupo. El tratamiento de datos se limita al mínimo necesario para el funcionamiento del servicio, conforme al principio de minimización de datos del RGPD." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsxs("h3", { children: [
          /* @__PURE__ */ jsx("i", { className: "fas fa-shield" }),
          " Seguridad y protección contra abusos"
        ] }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsxs("li", { children: [
            "Se implementan sistemas automáticos de ",
            /* @__PURE__ */ jsx("strong", { children: "detección y bloqueo" }),
            " de direcciones IP que superen límites razonables de peticiones."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "Las IPs que excedan el límite de peticiones de forma reiterada son ",
            /* @__PURE__ */ jsx("strong", { children: "bloqueadas automáticamente" }),
            " durante 24 horas."
          ] }),
          /* @__PURE__ */ jsx("li", { children: "Los administradores pueden bloquear manualmente IPs que se comporten de forma maliciosa." }),
          /* @__PURE__ */ jsx("li", { children: "Cualquier usuario puede verificar si su IP está bloqueada desde el panel de administración." })
        ] })
      ] })
    ] }) })
  ] }) });
}
function ToastContainer({ toasts }) {
  if (toasts.length === 0) return null;
  return /* @__PURE__ */ jsx("div", { className: "toast-container", children: toasts.map((t) => {
    const typeClass = `toast-${t.type}`;
    let icon = "fa-circle-info";
    if (t.type === "add") icon = "fa-circle-plus";
    else if (t.type === "remove") icon = "fa-circle-minus";
    else if (t.type === "update") icon = "fa-pen-to-square";
    return /* @__PURE__ */ jsxs("div", { className: `toast ${typeClass}`, children: [
      /* @__PURE__ */ jsx("i", { className: `fas ${icon}` }),
      " ",
      t.message
    ] }, t.id);
  }) });
}
let toastId = 0;
function OrderPage() {
  var _a;
  const [sessionCode, setSessionCode] = useState("");
  const [myName, setMyName] = useState("");
  const [persons, setPersons] = useState([]);
  const [currentPersonIdx, setCurrentPersonIdx] = useState(0);
  const [activeCat, setActiveCat] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [toasts, setToasts] = useState([]);
  const wsRef = useRef(null);
  useRef([]);
  const addToast = useCallback((message, type, duration = 3500) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);
  const handleAction = useCallback((action) => {
    if (!action) return;
    switch (action.type) {
      case "item_added":
        addToast(`${action.person} añadió ${action.item_name}`, "add");
        break;
      case "item_removed":
        addToast(`${action.person} quitó #${action.item_key}`, "remove");
        break;
      case "item_updated":
        addToast(`${action.person} cambió #${action.item_key} a ${action.qty}ud`, "update");
        break;
      case "person_joined":
        addToast(`${action.name} se conectó`, "info");
        break;
      case "person_left":
        addToast(`${action.name} salió`, "remove");
        break;
      case "person_cleared":
        addToast(`${action.person} vació su pedido`, "update");
        break;
    }
  }, [addToast]);
  const syncPersons = useCallback((msg) => {
    if (msg.people) {
      setPersons(msg.people);
      if (myName && !msg.people.find((p) => p.name === myName)) {
        addPerson(sessionCode, myName);
      }
    }
  }, [myName, sessionCode]);
  const onWsMessage = useCallback((msg) => {
    if (msg.action) handleAction(msg.action);
    syncPersons(msg);
  }, [handleAction, syncPersons]);
  const enterSession = useCallback((code, name) => {
    setSessionCode(code);
    setMyName(name);
    setSessionCookie(code, name);
    setLoading(false);
    const ws = new SessionWebSocket(code, onWsMessage);
    wsRef.current = ws;
  }, [onWsMessage]);
  const loadSession = useCallback(async (code, name) => {
    try {
      const data = await joinSession(code);
      if (data.error) {
        clearSessionCookie();
        setLoading(false);
        return;
      }
      if (data.people) {
        setPersons(data.people);
        const idx = Math.max(0, data.people.findIndex((p) => p.name === name));
        setCurrentPersonIdx(idx < 0 ? 0 : idx);
      }
    } catch {
    }
  }, []);
  const handleLogin = useCallback(async (name, code) => {
    if (code) {
      const data = await joinSession(code);
      if (data.error) throw new Error(data.error);
      await addPerson(code, name);
      enterSession(code, name);
      loadSession(code, name);
    } else {
      const data = await createSession();
      await addPerson(data.code, name);
      enterSession(data.code, name);
      loadSession(data.code, name);
      const url = `https://euromania.cabrasky.net/app?session=${data.code}`;
      navigator.clipboard.writeText(url).then(() => {
        addToast("📋 Link de la sesión copiado al portapapeles", "info", 4e3);
      }).catch(() => {
      });
    }
  }, [enterSession, loadSession]);
  useEffect(() => {
    fetchActiveMenu().then((menu) => {
      setActiveMenu(menu);
    }).catch(() => {
      setActiveMenu(null);
    });
    const saved = getSessionCookie();
    const params = new URLSearchParams(window.location.search);
    const sessionFromUrl = params.get("session");
    if (sessionFromUrl) {
      window.__joinCode = sessionFromUrl.toUpperCase();
      setLoading(false);
    } else if ((saved == null ? void 0 : saved.code) && (saved == null ? void 0 : saved.name)) {
      joinSession(saved.code).then((data) => {
        if (data.error) {
          clearSessionCookie();
          setLoading(false);
          return;
        }
        enterSession(saved.code, saved.name);
        loadSession(saved.code, saved.name);
      }).catch(() => {
        clearSessionCookie();
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
    return () => {
      var _a2;
      (_a2 = wsRef.current) == null ? void 0 : _a2.close();
    };
  }, []);
  const toggleItem = useCallback(async (catKey, itemKey) => {
    if (!sessionCode || !myName) return;
    const person = persons[currentPersonIdx];
    if (!person) return;
    if (person.items[itemKey]) {
      await removeItem(sessionCode, person.name, itemKey);
    } else {
      const found = findItem(itemKey);
      if (!found) return;
      await upsertItem(
        sessionCode,
        person.name,
        itemKey,
        found.item.name,
        found.item.code || "",
        found.category,
        1
      );
    }
  }, [sessionCode, myName, persons, currentPersonIdx]);
  const changeQty = useCallback(async (itemKey, delta) => {
    if (!sessionCode || !myName) return;
    const person = persons[currentPersonIdx];
    if (!person || !person.items[itemKey]) return;
    const newQty = person.items[itemKey].qty + delta;
    if (newQty <= 0) {
      await removeItem(sessionCode, person.name, itemKey);
    } else {
      const oi = person.items[itemKey];
      await upsertItem(
        sessionCode,
        person.name,
        itemKey,
        oi.item.name,
        oi.item.code || "",
        oi.category,
        newQty
      );
    }
  }, [sessionCode, myName, persons, currentPersonIdx]);
  const removeItemAction = useCallback(async (itemKey) => {
    if (!sessionCode || !myName) return;
    const person = persons[currentPersonIdx];
    if (!person) return;
    await removeItem(sessionCode, person.name, itemKey);
  }, [sessionCode, myName, persons, currentPersonIdx]);
  const handleClear = useCallback(async () => {
    if (!sessionCode || !myName) return;
    const person = persons[currentPersonIdx];
    if (!person || Object.keys(person.items).length === 0) return;
    await clearPerson(sessionCode, person.name);
  }, [sessionCode, myName, persons, currentPersonIdx]);
  const handleAddPerson = useCallback(async () => {
    const name = prompt("Nombre de la persona:");
    if (!(name == null ? void 0 : name.trim())) return;
    if (!sessionCode) return;
    await addPerson(sessionCode, name.trim());
  }, [sessionCode]);
  const handleDeletePerson = useCallback(async (idx) => {
    if (persons.length <= 1) {
      addToast("Debe haber al menos una persona", "info");
      return;
    }
    const name = persons[idx].name;
    if (name === myName) {
      addToast("No puedes eliminarte a ti mismo", "info");
      return;
    }
    if (!confirm(`¿Eliminar a ${name}?`)) return;
    if (!sessionCode) return;
    await removePerson(sessionCode, name);
  }, [persons, myName, sessionCode, addToast]);
  const selectPerson = useCallback((idx) => {
    setCurrentPersonIdx(idx);
  }, []);
  const handleLeave = useCallback(() => {
    var _a2;
    (_a2 = wsRef.current) == null ? void 0 : _a2.close();
    wsRef.current = null;
    clearSessionCookie();
    setSessionCode("");
    setMyName("");
    setPersons([]);
    setCurrentPersonIdx(0);
    setActiveCat("all");
    setSearchTerm("");
  }, []);
  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(sessionCode);
    addToast("📋 Código copiado: " + sessionCode, "info");
  }, [sessionCode, addToast]);
  const exportOrder = useCallback(() => {
    if (persons.length === 0) {
      addToast("El pedido está vacío", "info");
      return;
    }
    const hasItems = persons.some((p) => Object.keys(p.items).length > 0);
    if (!hasItems) {
      addToast("El pedido está vacío", "info");
      return;
    }
    let lines = [];
    let groupTotal = 0;
    persons.forEach((p) => {
      const items = Object.values(p.items);
      if (items.length === 0) return;
      lines.push(`── ${p.name} ──`);
      let pTotal = 0;
      items.forEach((o) => {
        const pr = parsePrice(getPrice(o.category, o.item));
        const sub = pr * o.qty;
        pTotal += sub;
        lines.push(`  ${o.item.code ? "#" + o.item.code + " " : ""}${o.item.name}  ${o.qty}ud = ${sub.toFixed(2).replace(".", ",")}€`);
      });
      lines.push(`  Subtotal: ${pTotal.toFixed(2).replace(".", ",")}€
`);
      groupTotal += pTotal;
    });
    lines.unshift(`📋 EUROMANIA — Sesión: ${sessionCode}`);
    lines.unshift("═══════════════════════════════");
    lines.push("═══════════════════════════════");
    lines.push(`TOTAL GRUPO: ${groupTotal.toFixed(2).replace(".", ",")}€`);
    const totalUd = persons.reduce((s, p) => s + Object.values(p.items).reduce((a, o) => a + o.qty, 0), 0);
    lines.push(`${totalUd} ud — ${persons.filter((p) => Object.keys(p.items).length > 0).length} personas`);
    const text = lines.join("\n");
    navigator.clipboard.writeText(text).then(() => addToast("📋 Copiado al portapapeles", "info")).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      addToast("📋 Copiado", "info");
    });
  }, [persons, sessionCode, addToast]);
  const exportConsolidated = useCallback(() => {
    if (persons.length === 0) {
      addToast("El pedido está vacío", "info");
      return;
    }
    const hasItems = persons.some((p) => Object.keys(p.items).length > 0);
    if (!hasItems) {
      addToast("El pedido está vacío", "info");
      return;
    }
    const consolidated = {};
    persons.forEach((p) => {
      Object.entries(p.items).forEach(([key, o]) => {
        if (consolidated[key]) {
          consolidated[key].qty += o.qty;
        } else {
          consolidated[key] = {
            name: o.item.name,
            code: o.item.code || key,
            qty: o.qty,
            category: o.category,
            price: parsePrice(getPrice(o.category, o.item))
          };
        }
      });
    });
    const catOrder = ["casa", "clasicos", "imprescindibles", "especiales", "montycookie", "montydinas", "montyperros", "montyburgers", "montypizzas", "montygourmet", "aperitivos", "postres", "bebidas", "extras"];
    const sorted = Object.entries(consolidated).sort((a, b) => {
      const ca = catOrder.indexOf(a[1].category);
      const cb = catOrder.indexOf(b[1].category);
      if (ca !== cb) return ca - cb;
      return a[1].code.localeCompare(b[1].code, void 0, { numeric: true });
    });
    let lines = [];
    lines.push("═══════════════════════════════");
    lines.push(`📋 PEDIDO — Sesión: ${sessionCode}`);
    lines.push("═══════════════════════════════");
    lines.push("");
    let currentCat = "";
    let totalUd = 0;
    let totalPrice = 0;
    sorted.forEach(([_, o]) => {
      const catLabel = CATEGORY_LABELS[o.category] || o.category;
      if (catLabel !== currentCat) {
        currentCat = catLabel;
        lines.push(`── ${catLabel} ──`);
      }
      const codeStr = o.code ? `#${o.code}` : "";
      lines.push(`  ${codeStr} ${o.name}  ${o.qty}ud = ${(o.price * o.qty).toFixed(2).replace(".", ",")}€`);
      totalUd += o.qty;
      totalPrice += o.price * o.qty;
    });
    lines.push("");
    lines.push("═══════════════════════════════");
    lines.push(`TOTAL: ${totalPrice.toFixed(2).replace(".", ",")}€ — ${totalUd} ud`);
    lines.push("═══════════════════════════════");
    const text = lines.join("\n");
    navigator.clipboard.writeText(text).then(() => addToast("📋 Pedido copiado al portapapeles", "info")).catch(() => addToast("❌ Error al copiar", "remove"));
  }, [persons, sessionCode, addToast]);
  const sessionUrl = `https://euromania.cabrasky.net/app?session=${sessionCode}`;
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#94a3b8" }, children: [
      /* @__PURE__ */ jsx("i", { className: "fas fa-spinner fa-spin", style: { fontSize: 24, marginRight: 8 } }),
      " Conectando..."
    ] });
  }
  if (!sessionCode) {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(LoginScreen, { onLogin: handleLogin }),
      /* @__PURE__ */ jsx(ToastContainer, { toasts })
    ] });
  }
  const currentPerson = persons[currentPersonIdx] || persons[0] || null;
  return /* @__PURE__ */ jsxs("div", { className: "app", children: [
    /* @__PURE__ */ jsx(
      Header,
      {
        myName,
        sessionCode,
        sessionUrl,
        menuName: (_a = getActiveMenu()) == null ? void 0 : _a.name,
        onCopyCode: copyCode,
        onShowQR: () => setQrOpen(true),
        onShowPrivacy: () => setPrivacyOpen(true),
        onLeave: handleLeave
      }
    ),
    /* @__PURE__ */ jsx(
      PersonBar,
      {
        persons,
        myName,
        currentPersonIdx,
        onSelectPerson: selectPerson,
        onDeletePerson: handleDeletePerson,
        onAddPerson: handleAddPerson
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "layout", children: [
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
        MenuGrid,
        {
          persons,
          currentPersonIdx,
          activeCat,
          searchTerm,
          onSetCategory: setActiveCat,
          onSearchChange: setSearchTerm,
          onToggleItem: toggleItem
        }
      ) }),
      /* @__PURE__ */ jsx(
        OrderPanel,
        {
          currentPerson,
          persons,
          onChangeQty: changeQty,
          onRemoveItem: removeItemAction,
          onClear: handleClear,
          onExport: exportOrder,
          onExportConsolidated: exportConsolidated
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      QRModal,
      {
        open: qrOpen,
        onClose: () => setQrOpen(false),
        sessionUrl
      }
    ),
    /* @__PURE__ */ jsx(
      PrivacyModal,
      {
        open: privacyOpen,
        onClose: () => setPrivacyOpen(false)
      }
    ),
    /* @__PURE__ */ jsx(ToastContainer, { toasts }),
    showAdmin && /* @__PURE__ */ jsx(AdminPanel, { onClose: () => setShowAdmin(false) })
  ] });
}
function App() {
  return /* @__PURE__ */ jsxs(Routes, { children: [
    /* @__PURE__ */ jsx(Route, { path: "/", element: /* @__PURE__ */ jsx(LandingPage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/app", element: /* @__PURE__ */ jsx(OrderPage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/app/*", element: /* @__PURE__ */ jsx(OrderPage, {}) })
  ] });
}
function createApp(url, helmetContext) {
  return jsx(HelmetProvider, { context: helmetContext, children: jsx(StaticRouter, { location: url, children: jsx(App, {}) }) });
}
export {
  createApp
};
