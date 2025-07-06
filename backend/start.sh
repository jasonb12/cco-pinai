#!/bin/bash

echo "🐍 Starting FastAPI backend server..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Running setup..."
    python setup.py
fi

# Activate virtual environment and start server
source venv/bin/activate
echo "✅ Virtual environment activated"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Using environment variables or defaults."
fi

echo "🚀 Starting server on http://localhost:8000"
python main.py