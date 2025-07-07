#!/bin/bash

# CCOPINAI - Start Chrome with Remote Debugging
# Starts Chrome with debugging port for Playwright automation (CI/CD OPTIMIZED)

set -e

echo "🌐 Starting Chrome with remote debugging (CI/CD optimized mode)..."

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

# Start Chrome with CI/CD appropriate flags
# Analysis of each flag:
# --remote-debugging-port=$DEBUG_PORT   # Essential: Enables Playwright automation
# --user-data-dir=/tmp/chrome_dev_session  # Essential: Isolated session for testing
# --no-first-run                        # CI/CD: Skip first-run setup dialogs
# --no-default-browser-check            # CI/CD: Skip default browser prompts
# --disable-background-timer-throttling # Testing: Ensures timers run normally for tests
# --disable-backgrounding-occluded-windows  # Testing: Keeps background tabs active
# --disable-renderer-backgrounding      # Testing: Prevents renderer throttling
# --disable-features=TranslateUI        # CI/CD: Disable translation popups
# --disable-ipc-flooding-protection     # Testing: Allows rapid automation commands
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
    --remote-debugging-port=$DEBUG_PORT \
    --user-data-dir=/tmp/chrome_dev_session \
    --no-first-run \
    --no-default-browser-check \
    --disable-background-timer-throttling \
    --disable-backgrounding-occluded-windows \
    --disable-renderer-backgrounding \
    --disable-features=TranslateUI \
    --disable-ipc-flooding-protection \
    "http://localhost:8081" \
    > /tmp/chrome_debug.log 2>&1 &

CHROME_PID=$!
echo "✅ Chrome started with PID: $CHROME_PID (CI/CD OPTIMIZED MODE)"

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
    echo "👀 Chrome window should be visible on screen"
    echo "🎮 JavaScript and all web features enabled"
    echo "🤖 Optimized for CI/CD and automated testing"
    echo "📝 Logs available at: /tmp/chrome_debug.log"
    echo ""
    echo "🔧 Chrome flags used:"
    echo "   ✅ remote-debugging-port: Enables automation"
    echo "   ✅ user-data-dir: Isolated test session"
    echo "   ✅ no-first-run: Skip setup dialogs"
    echo "   ✅ no-default-browser-check: Skip prompts"
    echo "   ✅ disable-background-timer-throttling: Reliable timers"
    echo "   ✅ disable-backgrounding-occluded-windows: Active tabs"
    echo "   ✅ disable-renderer-backgrounding: No throttling"
    echo "   ✅ disable-features=TranslateUI: No popups"
    echo "   ✅ disable-ipc-flooding-protection: Fast automation"
else
    echo "❌ Failed to start Chrome with debugging"
    echo "📝 Check logs at: /tmp/chrome_debug.log"
    exit 1
fi 