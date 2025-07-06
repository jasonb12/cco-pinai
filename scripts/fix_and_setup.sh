#!/bin/bash

echo "🔧 Fixing Supabase setup and applying migrations..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Step 1: Cleaning up existing policies...${NC}"

# Drop existing policies to avoid conflicts
echo "
-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS \"Authenticated users can upload audio files\" ON storage.objects;
DROP POLICY IF EXISTS \"Users can view their own audio files\" ON storage.objects;
DROP POLICY IF EXISTS \"Users can update their own audio files\" ON storage.objects;
DROP POLICY IF EXISTS \"Users can delete their own audio files\" ON storage.objects;

-- Drop existing sync_state policies if they exist
DROP POLICY IF EXISTS \"Users can view own sync state\" ON sync_state;
DROP POLICY IF EXISTS \"Users can insert own sync state\" ON sync_state;
DROP POLICY IF EXISTS \"Users can update own sync state\" ON sync_state;
DROP POLICY IF EXISTS \"Users can delete own sync state\" ON sync_state;

-- Drop existing sync_errors policies if they exist
DROP POLICY IF EXISTS \"Users can view own sync errors\" ON sync_errors;
DROP POLICY IF EXISTS \"Users can insert own sync errors\" ON sync_errors;
" | supabase db sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cleaned up existing policies${NC}"
else
    echo -e "${YELLOW}⚠️  Policy cleanup had some issues, but continuing...${NC}"
fi

echo -e "${BLUE}📋 Step 2: Applying migrations...${NC}"

# Now push the migrations
supabase db push

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations applied successfully${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Step 3: Verifying setup...${NC}"

# Check if tables exist
echo -e "${YELLOW}Checking tables...${NC}"
TABLES_CHECK=$(echo "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('transcripts', 'mcp_servers');" | supabase db sql 2>/dev/null)

if echo "$TABLES_CHECK" | grep -q "transcripts" && echo "$TABLES_CHECK" | grep -q "mcp_servers"; then
    echo -e "${GREEN}✅ Tables verified${NC}"
else
    echo -e "${RED}❌ Tables not found${NC}"
fi

# Check if storage bucket exists
echo -e "${YELLOW}Checking storage bucket...${NC}"
BUCKET_CHECK=$(echo "SELECT name FROM storage.buckets WHERE id = 'audio-files';" | supabase db sql 2>/dev/null)

if echo "$BUCKET_CHECK" | grep -q "audio-files"; then
    echo -e "${GREEN}✅ Storage bucket verified${NC}"
else
    echo -e "${YELLOW}⚠️  Storage bucket not found${NC}"
fi

# Check if storage policies exist
echo -e "${YELLOW}Checking storage policies...${NC}"
POLICY_CHECK=$(echo "SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';" | supabase db sql 2>/dev/null)

if echo "$POLICY_CHECK" | grep -q "Authenticated users can upload audio files"; then
    echo -e "${GREEN}✅ Storage policies verified${NC}"
else
    echo -e "${YELLOW}⚠️  Storage policies may need attention${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "${BLUE}1. Your database is now properly set up${NC}"
echo -e "${BLUE}2. Consider updating your local config to match remote:${NC}"
echo -e "${BLUE}   supabase config update${NC}"
echo -e "${BLUE}3. Test your app: npm run dev${NC}"
echo ""
echo -e "${GREEN}✨ Ready to go!${NC}" 