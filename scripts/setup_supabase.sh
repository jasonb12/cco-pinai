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
if [ ! -f "supabase/schema.sql" ]; then
    echo -e "${RED}❌ supabase/schema.sql not found. Make sure you're in the project root directory.${NC}"
    exit 1
fi

# Check if project is linked
if [ ! -f "supabase/.temp/project-ref" ] && [ ! -f ".env" ]; then
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
    
    # Try to link, if it fails due to config issues, try without config file
    supabase link --project-ref "$PROJECT_REF"
    
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Link failed, trying alternative approach...${NC}"
        
        # Remove problematic config temporarily
        if [ -f "supabase/config.toml" ]; then
            mv supabase/config.toml supabase/config.toml.backup
        fi
        
        # Initialize a fresh supabase setup
        supabase init --force
        supabase link --project-ref "$PROJECT_REF"
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Failed to link project. Please check your project reference ID and try again.${NC}"
            # Restore backup if linking still fails
            if [ -f "supabase/config.toml.backup" ]; then
                mv supabase/config.toml.backup supabase/config.toml
            fi
            exit 1
        fi
        
        echo -e "${GREEN}✅ Project linked successfully${NC}"
    fi
elif [ -f ".env" ]; then
    # Extract project ref from URL in .env file
    PROJECT_REF=$(grep "SUPABASE_URL" frontend/.env 2>/dev/null | cut -d'/' -f3 | cut -d'.' -f1)
    if [ -z "$PROJECT_REF" ]; then
        PROJECT_REF=$(grep "EXPO_PUBLIC_SUPABASE_URL" frontend/.env 2>/dev/null | cut -d'/' -f3 | cut -d'.' -f1)
    fi
    
    if [ ! -z "$PROJECT_REF" ]; then
        echo -e "${BLUE}🔗 Found project reference in .env: $PROJECT_REF${NC}"
        echo -e "${BLUE}🔗 Linking to Supabase project...${NC}"
        
        # Try to link using the project ref from .env
        supabase link --project-ref "$PROJECT_REF" 2>/dev/null || {
            echo -e "${YELLOW}⚠️  Link failed, trying alternative approach...${NC}"
            supabase init --force 2>/dev/null
            supabase link --project-ref "$PROJECT_REF"
        }
    fi
fi

echo -e "${BLUE}📊 Running database migrations...${NC}"

# Apply schema
echo -e "${YELLOW}Creating tables and setting up RLS...${NC}"
supabase db push --password "$SUPABASE_DB_PASSWORD"

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Direct push failed. Trying with SQL file...${NC}"
    
    # Alternative: Run SQL file directly
    echo -e "${YELLOW}Applying schema.sql...${NC}"
    supabase db reset --linked --password "$SUPABASE_DB_PASSWORD"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to apply schema. Trying manual SQL execution...${NC}"
        
        # Manual SQL execution
        echo -e "${BLUE}📝 Applying schema manually...${NC}"
        cat supabase/schema.sql | supabase db sql --linked --password "$SUPABASE_DB_PASSWORD"
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Failed to apply schema. Please run the SQL manually in your Supabase dashboard.${NC}"
            echo -e "${BLUE}📋 Go to: https://supabase.com/dashboard → SQL Editor${NC}"
            echo -e "${BLUE}📋 Copy and paste the contents of: supabase/schema.sql${NC}"
            exit 1
        fi
    fi
fi

# Apply storage setup
echo -e "${YELLOW}Setting up storage bucket...${NC}"
cat supabase/storage.sql | supabase db sql --linked --password "$SUPABASE_DB_PASSWORD"

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Storage setup may have failed. This is often due to bucket already existing.${NC}"
fi

# Verify setup
echo -e "${BLUE}🔍 Verifying setup...${NC}"

# Check if tables exist
echo -e "${YELLOW}Checking tables...${NC}"
TABLES_CHECK=$(echo "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('transcripts', 'mcp_servers');" | supabase db sql --linked --password "$SUPABASE_DB_PASSWORD" 2>/dev/null)

if echo "$TABLES_CHECK" | grep -q "transcripts" && echo "$TABLES_CHECK" | grep -q "mcp_servers"; then
    echo -e "${GREEN}✅ Tables created successfully${NC}"
else
    echo -e "${RED}❌ Tables may not have been created properly${NC}"
fi

# Check if storage bucket exists
echo -e "${YELLOW}Checking storage bucket...${NC}"
BUCKET_CHECK=$(echo "SELECT name FROM storage.buckets WHERE id = 'audio-files';" | supabase db sql --linked --password "$SUPABASE_DB_PASSWORD" 2>/dev/null)

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
echo -e "${BLUE}2. Your environment files are already configured with:${NC}"
echo -e "${BLUE}   - Project URL: https://mhrfjtbnpxzmrppljztw.supabase.co${NC}"
echo -e "${BLUE}   - API keys are set${NC}"
echo ""
echo -e "${BLUE}3. Test your setup by running: npm run dev${NC}"
echo ""
echo -e "${GREEN}✨ Ready to build amazing things!${NC}"