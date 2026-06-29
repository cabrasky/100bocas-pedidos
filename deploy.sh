#!/bin/bash
# deploy.sh — Despliegue de 100Bocas (React + FastAPI)
# Usage: ./deploy.sh [build|start|stop|restart|status|url]

DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${BOCAS_PORT:-8112}"
SERVICE="100bocas"

case "${1:-start}" in
  build)
    echo "🏗️  Construyendo frontend React..."
    cd "$DIR/frontend"
    npm install --silent 2>/dev/null
    npx vite build --outDir ../dist 2>&1
    echo "✅ Frontend construido en $DIR/dist/"
    ;;
  start)
    echo "▶️  Arrancando $SERVICE en puerto $PORT..."
    sudo systemctl start "$SERVICE"
    sleep 1
    sudo systemctl status "$SERVICE" --no-pager | head -3
    ;;
  stop)
    echo "⏹️  Deteniendo $SERVICE..."
    sudo systemctl stop "$SERVICE"
    ;;
  restart)
    "$0" stop
    sleep 0.5
    "$0" start
    ;;
  status)
    sudo systemctl status "$SERVICE" --no-pager 2>&1 | grep -E "Active:|Main PID|●"
    ;;
  url)
    echo "   https://100bocas.cabrasky.net"
    echo "   http://localhost:$PORT"
    ;;
  *)
    echo "Uso: $0 [build|start|stop|restart|status|url]"
    ;;
esac
