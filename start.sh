#!/usr/bin/env bash
# iPhone Desktop — Dev launcher

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[iphone-desktop]${NC} $1"; }
warn() { echo -e "${YELLOW}[iphone-desktop]${NC} $1"; }
err() { echo -e "${RED}[iphone-desktop]${NC} $1" >&2; }

# --- Pre-flight checks ---

if ! command -v node &>/dev/null; then
  err "Node.js not found. Install Node.js 20+ and try again."
  exit 1
fi

NODE_MAJOR=$(node -e "console.log(process.version.split('.')[0].slice(1))")
if [ "$NODE_MAJOR" -lt 20 ]; then
  err "Node.js $NODE_MAJOR found, but 20+ is required."
  exit 1
fi

# --- Kill stale processes ---

PORT=${IPHONE_DESKTOP_PORT:-3847}
STALE_PIDS=$(lsof -ti:${PORT} 2>/dev/null || true)
if [ -n "$STALE_PIDS" ]; then
  warn "Killing stale processes on port ${PORT}..."
  echo "$STALE_PIDS" | xargs kill -9 2>/dev/null || true
  sleep 1
fi

# --- Tailscale detection ---

TAILSCALE_IP=""
if command -v tailscale &>/dev/null; then
  TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || true)
fi

if [ -n "$TAILSCALE_IP" ]; then
  log "Tailscale IP: $TAILSCALE_IP"
else
  warn "Tailscale not detected — access via localhost only."
fi

# --- Install dependencies ---

cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  log "Installing dependencies..."
  npm install
fi

# --- Ensure data directory ---
mkdir -p data

# --- Start ---

log "Starting server in dev mode (with watch) on port $PORT..."

echo ""
log "=== iPhone Desktop ==="
log "Local:   http://localhost:$PORT"
if [ -n "$TAILSCALE_IP" ]; then
  log "Remote:  http://$TAILSCALE_IP:$PORT"
fi
echo ""

exec npm run dev
