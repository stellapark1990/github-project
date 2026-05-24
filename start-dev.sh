#!/bin/bash
# Quick dev startup: backend + frontend

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "==> Starting backend..."
cd "$ROOT/backend"
[ ! -f .env ] && cp .env.example .env && echo "  ⚠ Copied .env.example → .env  (fill in your tokens!)"
python3 -m venv .venv
source .venv/bin/activate
pip install -q -r requirements.txt
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

echo "==> Starting frontend..."
cd "$ROOT/frontend"
npm install --silent
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✓ Backend:  http://localhost:8000"
echo "✓ Frontend: http://localhost:5173"
echo "✓ API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
