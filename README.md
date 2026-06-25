# 🍔 Euromania — Pedidos Colaborativos

Aplicación web colaborativa para hacer pedidos en grupo desde el menú Euromania (estilo 100 Montaditos). Crea una sesión, comparte el código QR y cada persona añade sus montaditos en tiempo real.

> **⚠️ Proyecto independiente** — No está vinculado, patrocinado ni aprobado por 100 Montaditos® ni Euromania®.

---

## ✨ Funcionalidades

- **Pedidos en grupo** — Cada persona añade sus productos en su propio perfil
- **Tiempo real** — Sincronización instantánea vía WebSockets
- **Código QR** — Comparte la sesión al instante
- **Sin registro** — Solo necesitas un nombre. Sin emails ni contraseñas
- **Resumen consolidado** — Agrupa todos los pedidos por producto para hacer el pedido al restaurante de un vistazo
- **Estadísticas anónimas** — Panel de administración con métricas de uso
- **Protección anti-spam** — Rate limiting, IP blocking, sanitización
- **Privacidad** — Datos almacenados máximo 5 días, no compartidos

## 🛠️ Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19 + TypeScript + Vite |
| **Backend** | Python + FastAPI + asyncpg |
| **Base de datos** | PostgreSQL 16 |
| **Tiempo real** | WebSockets |
| **Proxy** | nginx + Let's Encrypt SSL |
| **Despliegue** | systemd + deploy.sh |

## 📋 Menú

Carta oficial **Marzo 2026** con 10 categorías:
- De la Casa, Clásicos, Imprescindibles, Especiales
- MontyCookie, Montydinas, Montyperros, Montyburgers, Montypizzas, MontyGourmet
- Bebidas (con precios específicos)
- Extras (+0,30€ / +0,50€)

## 🚀 Instalación y uso

### Requisitos

- Python 3.10+
- Node.js 18+
- PostgreSQL 16+
- Acceso a Internet (Google Fonts, Font Awesome)

### Configuración

```bash
# 1. Clonar el repositorio
git clone https://github.com/cabrasky/euromania-pedidos.git
cd euromania-pedidos

# 2. Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configurar base de datos
sudo -u postgres createdb euromania
# Las tablas se crean automáticamente al arrancar

# 3. Frontend
cd frontend
npm install
cd ..

# 4. Variables de entorno (opcional)
export EUROMANIA_DB="postgresql://euromania@localhost:5432/euromania"
export EUROMANIA_PORT="8112"
export EUROMANIA_ADMIN_PASSWORD="tu-contraseña-segura"

# 5. Construir y arrancar
./deploy.sh build
python server.py
```

### systemd service

```ini
[Unit]
Description=Menú Euromania — Collaborative order server
After=network.target postgresql.service

[Service]
Type=simple
User=hermes
WorkingDirectory=/path/to/euromania-pedidos
ExecStart=/path/to/euromania-pedidos/venv/bin/python server.py
Environment=EUROMANIA_DB=postgresql://euromania@localhost:5432/euromania
Environment=EUROMANIA_ADMIN_PASSWORD=tu-contraseña

[Install]
WantedBy=multi-user.target
```

## 🔒 Seguridad

- Rate limiting: 120 req/min/IP
- Límites WebSocket por IP, sesión y globales
- Sanitización de entrada (HTML, control chars)
- Bloqueo automático de IPs tras 5 violaciones en 10 min
- Bloqueo manual de IPs desde el panel admin
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- Protección contra path traversal

## 🔗 Enlaces

- **Web**: [https://euromania.cabrasky.net](https://euromania.cabrasky.net)
- **Landing**: [https://euromania.cabrasky.net/](https://euromania.cabrasky.net/)
- **App**: [https://euromania.cabrasky.net/app](https://euromania.cabrasky.net/app)

## 📄 Licencia

Proyecto personal de código abierto.

## 👤 Autor

**cabrasky — Javier Mateos Mata**
- GitHub: [@cabrasky](https://github.com/cabrasky)
