#!/bin/bash

# Development startup script

echo "🚀 Starting Miketea Machine Integration Module..."

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
}

trap cleanup EXIT

# Start backend
echo "📱 Starting backend on port 3000..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

sleep 2

# Start frontend
echo "🎨 Starting frontend on port 3001..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Services started!"
echo ""
echo "🔗 URLs:"
echo "  Frontend:  http://localhost:3001"
echo "  Backend:   http://localhost:3000"
echo "  API:       http://localhost:3000/api"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
