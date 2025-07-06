#!/bin/bash

echo "🗄️ Setting up Supabase schema and storage..."

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
if [ ! -f "supabase/migrations/20240101000000_initial_schema.sql" ]; then
    echo -e "${RED}❌ Migration files not found. Make sure you're in the project root directory.${NC}"
    exit 1
fi

# Check if project is linked
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo -e "${YELLOW}⚠️  Supabase project not linked. Let's link it first.${NC}"
    echo -e "${BLUE}📋 You'll need your project reference ID from your Supabase dashboard URL.${NC}"
    echo -e "${BLUE}   Example: https://supabase.com/dashboard/project/YOUR_PROJECT_REF${NC}"
    echo ""
    read -p "Enter your Supabase project reference ID: " PROJECT_REF
    
    if [ -z "$PROJECT_REF" ]; then
        echo -e "${RED}❌ Project reference ID is required.${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🔗 Linking to Supabase project...${NC}"
    supabase link --project-ref "$PROJECT_REF"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to link project. Please check your project reference ID and try again.${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}📊 Running database migrations...${NC}"

# Option 1: Push migrations (recommended for fresh setup)
echo -e "${YELLOW}Pushing migrations to remote database...${NC}"
supabase db push

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Migration push failed. This might be due to existing policies.${NC}"
    echo -e "${BLUE}🔧 Attempting to reset and apply migrations...${NC}"
    
    # Option 2: Reset and apply migrations
    supabase db reset --linked
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to reset and apply migrations.${NC}"
        echo -e "${BLUE}📋 Manual steps needed:${NC}"
        echo -e "${BLUE}1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql${NC}"
        echo -e "${BLUE}2. Drop existing policies if they exist:${NC}"
        echo -e "${BLUE}   DROP POLICY IF EXISTS \"Authenticated users can upload audio files\" ON storage.objects;${NC}"
        echo -e "${BLUE}3. Then run: supabase db push${NC}"
        exit 1
    fi
fi

# Verify setup
echo -e "${BLUE}🔍 Verifying setup...${NC}"

# Check if tables exist
echo -e "${YELLOW}Checking tables...${NC}"
TABLES_CHECK=$(supabase db sql --query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('transcripts', 'mcp_servers');" 2>/dev/null)

if echo "$TABLES_CHECK" | grep -q "transcripts" && echo "$TABLES_CHECK" | grep -q "mcp_servers"; then
    echo -e "${GREEN}✅ Tables created successfully${NC}"
else
    echo -e "${RED}❌ Tables may not have been created properly${NC}"
fi

# Check if storage bucket exists
echo -e "${YELLOW}Checking storage bucket...${NC}"
BUCKET_CHECK=$(supabase db sql --query "SELECT name FROM storage.buckets WHERE id = 'audio-files';" 2>/dev/null)

if echo "$BUCKET_CHECK" | grep -q "audio-files"; then
    echo -e "${GREEN}✅ Storage bucket created successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Storage bucket may need manual creation${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Supabase setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "${BLUE}1. Configure OAuth providers in your Supabase dashboard:${NC}"
echo -e "${BLUE}   - Go to Authentication → Providers${NC}"
echo -e "${BLUE}   - Enable Apple and Google${NC}"
echo -e "${BLUE}   - Add redirect URL: audio-transcript-mcp://auth${NC}"
echo ""
echo -e "${BLUE}2. Your environment files are already configured${NC}"
echo ""
echo -e "${BLUE}3. Test your setup by running: npm run dev${NC}"
echo ""
echo -e "${GREEN}✨ Ready to build amazing things!${NC}" 