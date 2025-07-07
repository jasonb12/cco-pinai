#!/bin/bash

# CCOPINAI - Run Playwright Tests
# Runs automated tests for the CCOPINAI dashboard

set -e

echo "🧪 Starting CCOPINAI automated tests..."

# Check if we're in the right directory
if [[ ! -d "tests" ]]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Start frontend if not running
if ! curl -s http://localhost:8081 > /dev/null 2>&1; then
    echo "🚀 Starting frontend for testing..."
    ./scripts/start-frontend.sh &
    FRONTEND_PID=$!
    
    # Wait for frontend to start
    echo "⏳ Waiting for frontend to initialize..."
    for i in {1..30}; do
        if curl -s http://localhost:8081 > /dev/null 2>&1; then
            echo "✅ Frontend is ready"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            echo "❌ Frontend failed to start within 30 seconds"
            exit 1
        fi
    done
    STARTED_FRONTEND=true
else
    echo "✅ Frontend is already running"
    STARTED_FRONTEND=false
fi

# Run the tests
echo "🧪 Running Playwright tests..."
cd tests

# Install browsers if needed
if [[ ! -d "node_modules" ]]; then
    echo "📦 Installing test dependencies..."
    npm install
fi

# Run tests with console output
echo "🎯 Taking dashboard screenshots..."
npx playwright test screenshot-only.spec.ts --config=playwright-simple.config.ts

TEST_EXIT_CODE=$?

# Show results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "🎉 All tests passed successfully!"
    echo "📸 Screenshots saved in tests/screenshots/"
    ls -la screenshots/ | grep -E "\\.png$" | awk '{print "   📷 " $9}'
else
    echo ""
    echo "❌ Some tests failed (exit code: $TEST_EXIT_CODE)"
fi

# Cleanup if we started the frontend
if [ "$STARTED_FRONTEND" = true ]; then
    echo ""
    echo "🛑 Stopping frontend..."
    kill $FRONTEND_PID 2>/dev/null || true
    cd ..
    ./scripts/stop-all.sh > /dev/null 2>&1 || true
fi

cd ..
echo "✅ Test run complete!"
exit $TEST_EXIT_CODE 