#!/bin/bash

# CCOPINAI - Stop Chrome Debug Session
# Stops Chrome debugging and cleans up

echo "🛑 Stopping Chrome debug session..."

# Function to stop Chrome by PID
stop_chrome_by_pid() {
    local pid_file="scripts/.chrome_debug.pid"
    
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "🛑 Stopping Chrome debug session (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            sleep 2
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                echo "🔨 Force killing Chrome process..."
                kill -9 "$pid" 2>/dev/null || true
            fi
            rm "$pid_file"
            echo "✅ Chrome debug session stopped"
        else
            echo "ℹ️  Chrome debug session was not running"
            rm "$pid_file"
        fi
    else
        echo "ℹ️  No Chrome debug PID file found"
    fi
}

# Stop Chrome using PID file
stop_chrome_by_pid

# Also kill any remaining Chrome processes (fallback)
echo "🧹 Cleaning up any remaining Chrome processes..."
pkill -f "Google Chrome" 2>/dev/null || true
pkill -f "chrome_dev_session" 2>/dev/null || true

# Clean up debug session data
echo "🧹 Cleaning up debug session data..."
rm -rf /tmp/chrome_dev_session 2>/dev/null || true
rm -f /tmp/chrome_debug.log 2>/dev/null || true

# Verify port is free
if lsof -Pi :9222 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 9222 is still in use. Force killing..."
    lsof -ti :9222 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

echo "✅ Chrome debug session cleanup complete!" 