#!/bin/bash

echo "🗄️ Simple Supabase setup (without CLI linking)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed.${NC}"
    echo -e "${BLUE}Install it with: npm install -g supabase${NC}"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/schema.sql" ]; then
    echo -e "${RED}❌ supabase/schema.sql not found. Make sure you're in the project root directory.${NC}"
    exit 1
fi

# Get project details from .env
PROJECT_URL=$(grep "EXPO_PUBLIC_SUPABASE_URL" frontend/.env 2>/dev/null | cut -d'=' -f2)
PROJECT_KEY=$(grep "EXPO_PUBLIC_SUPABASE_ANON_KEY" frontend/.env 2>/dev/null | cut -d'=' -f2)

if [ -z "$PROJECT_URL" ] || [ -z "$PROJECT_KEY" ]; then
    echo -e "${RED}❌ Could not find Supabase URL or key in frontend/.env${NC}"
    echo -e "${BLUE}Please ensure your frontend/.env file contains:${NC}"
    echo -e "${BLUE}EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co${NC}"
    echo -e "${BLUE}EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key${NC}"
    exit 1
fi

# Extract project reference from URL
PROJECT_REF=$(echo "$PROJECT_URL" | cut -d'/' -f3 | cut -d'.' -f1)

echo -e "${GREEN}✅ Found project details:${NC}"
echo -e "${BLUE}   URL: $PROJECT_URL${NC}"
echo -e "${BLUE}   Project Ref: $PROJECT_REF${NC}"

# Initialize supabase if needed
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${BLUE}🔧 Initializing Supabase...${NC}"
    supabase init
fi

# Try to link the project
echo -e "${BLUE}🔗 Linking to Supabase project...${NC}"
supabase link --project-ref "$PROJECT_REF"

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  CLI linking failed. Using direct SQL approach...${NC}"
    
    # Manual SQL execution using psql or curl
    echo -e "${BLUE}📝 Applying schema directly...${NC}"
    
    # Try using supabase db sql with the schema file
    cat supabase/schema.sql | supabase db sql --db-url "$PROJECT_URL" --linked=false
    
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Direct SQL failed. Manual setup required.${NC}"
        echo ""
        echo -e "${BLUE}📋 Manual Setup Instructions:${NC}"
        echo -e "${BLUE}1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/$PROJECT_REF${NC}"
        echo -e "${BLUE}2. Navigate to SQL Editor${NC}"
        echo -e "${BLUE}3. Copy and paste the contents of: supabase/schema.sql${NC}"
        echo -e "${BLUE}4. Run the SQL${NC}"
        echo -e "${BLUE}5. Copy and paste the contents of: supabase/storage.sql${NC}"
        echo -e "${BLUE}6. Run the SQL${NC}"
        echo ""
        echo -e "${BLUE}Then continue with OAuth setup:${NC}"
        echo -e "${BLUE}- Go to Authentication → Providers${NC}"
        echo -e "${BLUE}- Enable Apple and Google${NC}"
        echo -e "${BLUE}- Add redirect URL: audio-transcript-mcp://auth${NC}"
        exit 1
    fi
    
    # Apply storage setup
    echo -e "${BLUE}📁 Setting up storage...${NC}"
    cat supabase/storage.sql | supabase db sql --db-url "$PROJECT_URL" --linked=false
    
else
    echo -e "${GREEN}✅ Project linked successfully${NC}"
    
    # Apply migrations using linked project
    echo -e "${BLUE}📊 Running database migrations...${NC}"
    supabase db push
    
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Migration push failed. Trying direct SQL...${NC}"
        cat supabase/schema.sql | supabase db sql --linked
        cat supabase/storage.sql | supabase db sql --linked
    fi
fi

echo ""
echo -e "${GREEN}🎉 Supabase setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "${BLUE}1. Verify tables in your Supabase dashboard${NC}"
echo -e "${BLUE}2. Configure OAuth providers:${NC}"
echo -e "${BLUE}   - Go to Authentication → Providers${NC}"
echo -e "${BLUE}   - Enable Apple and Google${NC}"
echo -e "${BLUE}   - Add redirect URL: audio-transcript-mcp://auth${NC}"
echo -e "${BLUE}3. Test your setup: npm run dev${NC}"
echo ""
echo -e "${GREEN}✨ Ready to build!${NC}"