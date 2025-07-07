#!/bin/bash

echo "🚀 CCOPINAI System Status Check"
echo "================================"

# Check backend
echo "🔍 Checking Backend (http://localhost:8000)..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend: RUNNING"
    echo "   Health: $(curl -s http://localhost:8000/health)"
else
    echo "❌ Backend: NOT RUNNING"
fi

echo ""

# Check frontend
echo "🔍 Checking Frontend (http://localhost:8081)..."
if curl -s -I http://localhost:8081 | head -1 | grep -q "200 OK"; then
    echo "✅ Frontend: RUNNING"
    echo "   Status: $(curl -s -I http://localhost:8081 | head -1)"
else
    echo "❌ Frontend: NOT RUNNING"
fi

echo ""
echo "🎯 ACCESS YOUR APP:"
echo "   🌐 Open: http://localhost:8081"
echo ""
echo "🎨 FEATURES TO TEST:"
echo "   • Sign up/Sign in"
echo "   • Dark/Light mode toggle"
echo "   • Audio file upload"
echo "   • Real-time processing"
echo "   • Transcript search"
echo ""
echo "🎊 Ready to explore CCOPINAI!" 