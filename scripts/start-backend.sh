#!/bin/bash

# CCOPINAI - Start Backend Only
# Starts the FastAPI Python backend application

set -e

echo "🐍 Starting CCOPINAI backend..."

# Check if we're in the right directory
if [[ ! -d "backend" ]]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

cd backend

# Check if virtual environment exists
if [[ ! -d "venv" ]]; then
    echo "❌ Backend virtual environment not found."
    echo "   Run: python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Check if .env file exists
if [[ ! -f ".env" ]]; then
    echo "⚠️  Warning: .env file not found in backend directory"
    echo "   Create backend/.env with your configuration"
fi

echo "🚀 Starting FastAPI server..."
echo "🔗 Backend will be available at: http://localhost:8000"
echo "📚 API docs at: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the backend"

# Activate virtual environment and start backend
source venv/bin/activate
python main.py 