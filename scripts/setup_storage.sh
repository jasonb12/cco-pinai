#!/bin/bash

echo "🗄️ Setting up Supabase storage..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required environment variables exist
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ backend/.env file not found${NC}"
    exit 1
fi

# Load environment variables
export $(grep -E '^SUPABASE_URL|^SUPABASE_SERVICE_ROLE_KEY' backend/.env | xargs)

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in backend/.env${NC}"
    exit 1
fi

# Function to execute SQL via Supabase REST API
execute_sql() {
    local sql="$1"
    local response=$(curl -s -X POST \
        "${SUPABASE_URL}/rest/v1/rpc" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation" \
        -d "{\"query\": \"${sql}\"}")
    echo "$response"
}

# Check if storage.sql exists
if [ ! -f "supabase/storage.sql" ]; then
    echo -e "${RED}❌ supabase/storage.sql not found${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Checking existing storage setup...${NC}"

# Check if bucket exists using REST API
BUCKET_CHECK=$(curl -s \
    "${SUPABASE_URL}/storage/v1/bucket/audio-files" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}")

if echo "$BUCKET_CHECK" | grep -q '"id":"audio-files"'; then
    echo -e "${YELLOW}⚠️  Storage bucket 'audio-files' already exists${NC}"
    echo -e "${BLUE}Would you like to recreate it? This will delete existing files. [y/N]${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Skipping storage setup${NC}"
        exit 0
    fi
    
    # Delete existing bucket
    echo -e "${YELLOW}Deleting existing bucket...${NC}"
    curl -s -X DELETE \
        "${SUPABASE_URL}/storage/v1/bucket/audio-files" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
fi

# Create bucket using REST API
echo -e "${BLUE}📦 Creating storage bucket...${NC}"
BUCKET_RESPONSE=$(curl -s -X POST \
    "${SUPABASE_URL}/storage/v1/bucket" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{
        "id": "audio-files",
        "name": "audio-files",
        "public": true,
        "file_size_limit": 52428800,
        "allowed_mime_types": ["audio/mpeg", "audio/mp4", "audio/wav", "audio/m4a", "audio/x-m4a"]
    }')

if echo "$BUCKET_RESPONSE" | grep -q '"name":"audio-files"'; then
    echo -e "${GREEN}✅ Storage bucket created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create storage bucket${NC}"
    echo -e "${YELLOW}Response: $BUCKET_RESPONSE${NC}"
fi

echo -e "${BLUE}📋 Note: Storage policies need to be set up via Supabase Dashboard${NC}"
echo -e "${BLUE}   1. Go to: ${SUPABASE_URL}${NC}"
echo -e "${BLUE}   2. Navigate to Storage → Policies${NC}"
echo -e "${BLUE}   3. Add the policies from supabase/storage.sql${NC}"

echo ""
echo -e "${GREEN}✨ Storage setup complete!${NC}"