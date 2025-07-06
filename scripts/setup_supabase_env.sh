#!/bin/bash

echo "🔐 Setting up Supabase CLI with environment variables..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables from backend/.env
if [ -f "backend/.env" ]; then
    export $(grep -E '^SUPABASE_URL|^SUPABASE_SERVICE_ROLE_KEY' backend/.env | xargs)
fi

echo -e "${BLUE}📋 To fix CLI authentication, follow these steps:${NC}"
echo ""
echo -e "${YELLOW}1. Get your database password:${NC}"
echo -e "   - Go to: https://supabase.com/dashboard/project/mhrfjtbnpxzmrppljztw/settings/database"
echo -e "   - Find the 'Database Password' section"
echo -e "   - Click 'Reset Database Password' if you don't remember it"
echo ""
echo -e "${YELLOW}2. Set up environment variables:${NC}"
echo -e "   Create a .env file in the supabase directory with:"
echo ""
echo "   POSTGRES_PASSWORD=your-database-password-here"
echo ""
echo -e "${YELLOW}3. Alternative: Use db push with --db-url:${NC}"
echo -e "   You can find your connection string at:"
echo -e "   https://supabase.com/dashboard/project/mhrfjtbnpxzmrppljztw/settings/database"
echo ""
echo "   Then run:"
echo "   supabase db push --db-url 'postgresql://postgres:[PASSWORD]@db.mhrfjtbnpxzmrppljztw.supabase.co:5432/postgres'"
echo ""
echo -e "${YELLOW}4. Or use the local development approach:${NC}"
echo "   supabase start  # Start local Supabase"
echo "   supabase db push --local  # Push to local instance"
echo ""
echo -e "${GREEN}✨ For now, using the SQL Editor approach is simpler and more reliable!${NC}"