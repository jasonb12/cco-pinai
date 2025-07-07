#!/bin/bash

# CCOPINAI - Start Chrome with Remote Debugging
# Starts Chrome with debugging port for Playwright automation (SIMPLE VISIBLE MODE)

set -e

echo "🌐 Starting Chrome with remote debugging (simple visible mode)..."

# Kill any existing Chrome processes
echo "🛑 Stopping any existing Chrome processes..."
pkill -f "Google Chrome" 2>/dev/null || true
sleep 2

# Remove any existing debug session data
echo "🧹 Cleaning up previous debug session..."
rm -rf /tmp/chrome_dev_session 2>/dev/null || true

# Chrome debugging port
DEBUG_PORT=9222

# Check if port is already in use
if lsof -Pi :$DEBUG_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ Port $DEBUG_PORT is already in use. Killing process..."
    lsof -ti :$DEBUG_PORT | xargs kill -9 2>/dev/null || true
    sleep 2
fi

echo "🚀 Starting Chrome with debugging on port $DEBUG_PORT..."

# Start Chrome with MINIMAL flags (MAXIMUM VISIBILITY)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
    --remote-debugging-port=$DEBUG_PORT \
    --user-data-dir=/tmp/chrome_dev_session \
    "http://localhost:8081" \
    > /tmp/chrome_debug.log 2>&1 &

CHROME_PID=$!
echo "✅ Chrome started with PID: $CHROME_PID (SIMPLE VISIBLE MODE)"

# Save PID for cleanup
echo $CHROME_PID > scripts/.chrome_debug.pid

# Wait for Chrome to start
echo "⏳ Waiting for Chrome to initialize..."
sleep 5

# Verify Chrome is running with debugging
if curl -s http://127.0.0.1:$DEBUG_PORT/json/version > /dev/null 2>&1; then
    echo "✅ Chrome debugging port is accessible at http://127.0.0.1:$DEBUG_PORT"
    echo "🔍 Chrome version info:"
    curl -s http://127.0.0.1:$DEBUG_PORT/json/version | jq -r '.Browser // "Unknown"' 2>/dev/null || curl -s http://127.0.0.1:$DEBUG_PORT/json/version
    echo ""
    echo "🎯 Chrome is ready for Playwright automation!"
    echo "👀 Chrome window should now be fully visible on screen"
    echo "🎮 You can interact with the app normally in the browser"
    echo "📝 Logs available at: /tmp/chrome_debug.log"
else
    echo "❌ Failed to start Chrome with debugging"
    echo "📝 Check logs at: /tmp/chrome_debug.log"
    exit 1
fi 