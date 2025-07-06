#!/bin/bash

echo "🚀 Setting up Audio Transcript MCP App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup frontend
echo "📱 Setting up frontend..."
cd frontend
if [ ! -f ".env" ]; then
    echo "📄 Creating frontend .env file..."
    cp .env.example .env
    echo "⚠️  Please update frontend/.env with your Supabase credentials"
fi

echo "📦 Installing frontend dependencies..."
npm install

echo "🔧 Installing additional React Native dependencies..."
npm install @nozbe/watermelondb@1.0.0-alpha.1
npm install @react-native-async-storage/async-storage

cd ..

# Setup backend
echo "🐍 Setting up backend..."
cd backend
if [ ! -f ".env" ]; then
    echo "📄 Creating backend .env file..."
    cp .env.example .env
    echo "⚠️  Please update backend/.env with your configuration"
fi

echo "🔧 Setting up Python virtual environment..."
python3 setup.py

cd ..

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your Supabase database schema:"
echo "   ./scripts/setup_supabase.sh"
echo "2. Configure OAuth providers in your Supabase dashboard"
echo "3. Install MCPM if not already installed: npm install -g @modelcontextprotocol/cli"
echo "4. Run 'npm run dev' to start the development servers"
echo ""
echo "🎉 Happy coding!"