#!/bin/bash

# CCOPINAI - Open App in Browser
# Opens the app in a normal browser window for manual testing

set -e

echo "🌐 Opening CCOPINAI in browser..."

# Check if frontend is running
if ! curl -s http://localhost:8081 > /dev/null 2>&1; then
    echo "❌ Frontend is not running on http://localhost:8081"
    echo "🚀 Start the frontend first with: ./scripts/start-frontend.sh"
    exit 1
fi

echo "✅ Frontend is running on http://localhost:8081"

# Open in default browser
if command -v open > /dev/null 2>&1; then
    # macOS
    open "http://localhost:8081"
    echo "🎯 Opened CCOPINAI in your default browser"
elif command -v xdg-open > /dev/null 2>&1; then
    # Linux
    xdg-open "http://localhost:8081"
    echo "🎯 Opened CCOPINAI in your default browser"
elif command -v start > /dev/null 2>&1; then
    # Windows
    start "http://localhost:8081"
    echo "🎯 Opened CCOPINAI in your default browser"
else
    echo "📋 Please open this URL in your browser:"
    echo "   http://localhost:8081"
fi

echo ""
echo "🎮 You can now interact with the app normally"
echo "📱 Try different screen sizes by resizing the browser window"
echo "🎨 The app uses Tamagui with proper light/dark theme support"
echo "🧭 Navigation includes:"
echo "   - Welcome screen (if not authenticated)"
echo "   - Dashboard with KPI cards and quick actions"
echo "   - Chat tab with transcript upload"
echo "   - Bottom navigation with 7 tabs" 