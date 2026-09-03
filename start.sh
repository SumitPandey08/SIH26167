#!/usr/bin/env bash
set -e

echo "========================================================="
echo "   Starting SatQuery AI — Geospatial Investigation Engine"
echo "   ISRO / Smart India Hackathon 2026 (SIH26167)"
echo "========================================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Check virtual environment
if [ ! -d "$ROOT_DIR/.venv" ]; then
    echo "⚠️  Virtual environment not found at $ROOT_DIR/.venv."
    echo "    Please run: virtualenv .venv && .venv/bin/pip install -r services/ai/requirements.txt"
    exit 1
fi

# 2. Start Python AI & Geospatial Specialist Service (Port 8000)
echo "🚀 [1/3] Launching Python AI Engine on http://127.0.0.1:8000..."
PYTHONPATH="$ROOT_DIR/services/ai" "$ROOT_DIR/.venv/bin/python" "$ROOT_DIR/services/ai/main.py" &
PYTHON_PID=$!

# 3. Start Node.js Primary Backend Gateway (Port 5000)
echo "🚀 [2/3] Launching Node.js Backend Gateway on http://127.0.0.1:5000..."
cd "$ROOT_DIR/backend"
if [ ! -d "dist" ]; then
    npm run build
fi
node dist/server.js &
NODE_PID=$!

# 4. Start Next.js Frontend Application (Port 3000)
echo "🚀 [3/3] Launching Next.js 14 Frontend on http://127.0.0.1:3000..."
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# Trap Ctrl+C to cleanly kill all three processes
cleanup() {
    echo ""
    echo "🛑 Shutting down SatQuery AI services..."
    kill $PYTHON_PID 2>/dev/null || true
    kill $NODE_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✓ All services stopped cleanly."
}
trap cleanup SIGINT SIGTERM EXIT

echo ""
echo "========================================================="
echo "  🛰️  FRONTEND UI (OPEN IN BROWSER): http://localhost:3000"
echo "  ⚡  Node.js Backend Gateway:      http://localhost:5000"
echo "  🧠  Python AI Specialist Engine:  http://localhost:8000"
echo "  📡  WebSocket Telemetry Stream:   ws://localhost:5000/ws/telemetry"
echo "========================================================="
echo "Press Ctrl+C to stop all services."

# Wait for background processes
wait
