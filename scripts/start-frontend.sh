#!/bin/bash

# CCOPINAI - Start Frontend Only
# Starts the React Native/Expo frontend application
# Usage: ./scripts/start-frontend.sh [--port <port>] [--clear-cache] [--kill-existing]

set -e

echo "⚛️  Starting CCOPINAI frontend..."

# Parse command line arguments
PORT=8081
CLEAR_CACHE=false
KILL_EXISTING=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --port)
            PORT="$2"
            shift 2
            ;;
        --clear-cache)
            CLEAR_CACHE=true
            shift
            ;;
        --kill-existing)
            KILL_EXISTING=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --port <port>     Specify port (default: 8081)"
            echo "  --clear-cache     Force restart with cache clear"
            echo "  --kill-existing   Kill existing process on port and start fresh"
            echo "  --help           Show this help message"
            echo ""
            echo "💡 LLM Usage Tips:"
            echo "  • Default: Just run './scripts/start-frontend.sh' - it's smart!"
            echo "  • If port busy: Use --kill-existing to force restart"
            echo "  • If app broken: Use --clear-cache to clear Metro cache"
            echo "  • Custom port: Use --port 3000 for different port"
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            echo "Usage: $0 [--port <port>] [--clear-cache] [--kill-existing]"
            echo "Use --help for more information"
            exit 1
            ;;
    esac
done

# Print parameter summary
echo "📋 Configuration:"
echo "   Port: $PORT"
echo "   Clear Cache: $CLEAR_CACHE"
echo "   Kill Existing: $KILL_EXISTING"
echo ""

# Check if we're in the right directory
if [[ ! -d "frontend" ]]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if port is busy and handle accordingly
if lsof -i :$PORT > /dev/null 2>&1; then
    EXISTING_PID=$(lsof -ti :$PORT)
    echo "🔍 Port $PORT is already in use by PID: $EXISTING_PID"
    
    # Check if it's an Expo process
    if ps -p $EXISTING_PID -o comm= | grep -q "node\|expo" 2>/dev/null; then
        echo "📱 Detected existing Expo server on port $PORT"
        
        if [[ "$KILL_EXISTING" == "true" ]] || [[ "$CLEAR_CACHE" == "true" ]]; then
            echo "🛑 Killing existing process (PID: $EXISTING_PID)..."
            kill -9 $EXISTING_PID 2>/dev/null || true
            sleep 2
            echo "✅ Existing process stopped"
        else
            echo "✅ Expo server already running - ignoring start command"
            echo "📱 Frontend available at: http://localhost:$PORT"
            echo "🔄 The existing server will auto-refresh on file changes"
            echo ""
            echo "💡 To force restart: $0 --kill-existing"
            echo "💡 To clear cache: $0 --clear-cache"
            echo "💡 To view logs: tail -f frontend/expo.log"
            exit 0
        fi
    else
        echo "❌ Port $PORT is busy with non-Expo process"
        echo ""
        echo "🔍 Process details:"
        lsof -i :$PORT
        echo ""
        echo "💡 Solutions:"
        echo "   1. Kill process: kill -9 $EXISTING_PID"
        echo "   2. Use different port: $0 --port <newport>"
        echo "   3. Force kill and restart: $0 --kill-existing"
        exit 1
    fi
fi

cd frontend

# Check if node_modules exists
if [[ ! -d "node_modules" ]]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Check if .env file exists
if [[ ! -f ".env" ]]; then
    echo "⚠️  Warning: .env file not found in frontend directory"
    echo "   Create frontend/.env with your Supabase configuration"
fi

# Clear cache if requested
if [[ "$CLEAR_CACHE" == "true" ]]; then
    echo "🧹 Clearing Metro bundler cache..."
    npx expo start --clear
fi

echo "🚀 Starting NEW Expo development server on port $PORT..."
echo "📱 Frontend will be available at: http://localhost:$PORT"

# Load environment variables if .env exists
if [[ -f ".env" ]]; then
    echo "env: load .env"
    set -a
    source .env
    set +a
    echo "env: export EXPO_PUBLIC_SUPABASE_URL EXPO_PUBLIC_SUPABASE_ANON_KEY EXPO_PUBLIC_API_URL GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GOOGLE_PROJECT_ID"
fi

# Start frontend in background
if [[ "$CLEAR_CACHE" == "true" ]]; then
    npx expo start --web --port $PORT --clear --non-interactive >> expo.log 2>&1 &
else
    npx expo start --web --port $PORT --non-interactive >> expo.log 2>&1 &
fi

PID=$!
echo "🚀 NEW Expo development server started with PID: $PID"
echo "📱 Frontend will be available at: http://localhost:$PORT"
echo ""
echo "🛑 To stop: kill -9 $PID"
echo "📝 View logs: tail -f expo.log"
echo "🔄 Server will auto-refresh on file changes"
echo ""
echo "💡 LLM Usage Summary:"
echo "   ✅ NEW server started successfully"
echo "   🌐 URL: http://localhost:$PORT"
echo "   📊 Monitor: tail -f frontend/expo.log"