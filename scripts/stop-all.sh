#!/bin/bash

# CCOPINAI - Stop All Services
# Stops both frontend and backend services

echo "🛑 Stopping CCOPINAI services..."

# Function to stop a service by PID file
stop_service() {
    local service_name=$1
    local pid_file=$2
    
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "🛑 Stopping $service_name (PID: $pid)..."
            kill "$pid"
            rm "$pid_file"
            echo "✅ $service_name stopped"
        else
            echo "ℹ️  $service_name was not running"
            rm "$pid_file"
        fi
    else
        echo "ℹ️  No $service_name PID file found"
    fi
}

# Stop services using PID files
stop_service "backend" "scripts/.backend.pid"
stop_service "frontend" "scripts/.frontend.pid"

# Also kill any remaining expo/python processes (fallback)
echo "🧹 Cleaning up any remaining processes..."

# Kill expo processes
pkill -f "expo start" 2>/dev/null && echo "✅ Killed remaining Expo processes" || true

# Kill python main.py processes
pkill -f "python main.py" 2>/dev/null && echo "✅ Killed remaining Python processes" || true

echo "🎉 All services stopped!" 