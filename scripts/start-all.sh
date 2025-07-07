#!/bin/bash

# CCOPINAI - Start All Services
# Starts both frontend and backend services in parallel

set -e

echo "🚀 Starting CCOPINAI services..."

# Check if we're in the right directory
if [[ ! -d "frontend" || ! -d "backend" ]]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Start backend in background
echo "🐍 Starting backend..."
cd backend
if [[ ! -d "venv" ]]; then
    echo "❌ Backend virtual environment not found. Run setup.sh first."
    exit 1
fi

# Start backend in background
source venv/bin/activate && python main.py &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Return to root and start frontend
cd ..
echo "⚛️  Starting frontend..."
cd frontend

# Check if node_modules exists
if [[ ! -d "node_modules" ]]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend
npx expo start --web &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

# Save PIDs for stop script
echo "$BACKEND_PID" > ../scripts/.backend.pid
echo "$FRONTEND_PID" > ../scripts/.frontend.pid

echo ""
echo "🎉 All services started!"
echo "📱 Frontend: http://localhost:8081"
echo "🔗 Backend: http://localhost:8000"
echo ""
echo "To stop all services, run: ./scripts/stop-all.sh"
echo "Press Ctrl+C to stop this script (services will continue running)"

# Wait for user interrupt
wait 