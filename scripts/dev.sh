#!/bin/bash

echo "🚀 Starting Audio Transcript MCP development servers..."

# Function to run commands in parallel
run_parallel() {
    echo "📱 Starting Expo development server..."
    cd frontend && npm start &
    FRONTEND_PID=$!
    
    echo "🐍 Starting FastAPI backend server..."
    cd ../backend && source venv/bin/activate && python main.py &
    BACKEND_PID=$!
    
    echo "✅ Development servers started!"
    echo "📱 Frontend: http://localhost:19006"
    echo "🐍 Backend: http://localhost:8000"
    echo ""
    echo "Press Ctrl+C to stop all servers"
    
    # Wait for user to stop
    wait $FRONTEND_PID $BACKEND_PID
}

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "❌ Backend virtual environment not found. Run ./scripts/setup.sh first."
    exit 1
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "❌ Frontend dependencies not found. Run ./scripts/setup.sh first."
    exit 1
fi

# Trap Ctrl+C and cleanup
trap 'echo "🛑 Stopping servers..."; kill $FRONTEND_PID $BACKEND_PID 2>/dev/null; exit' INT

run_parallel