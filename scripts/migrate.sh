#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if migration name is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Please provide a migration name${NC}"
    echo -e "${BLUE}Usage: $0 <migration_name>${NC}"
    echo -e "${BLUE}Example: $0 add_user_preferences${NC}"
    exit 1
fi

MIGRATION_NAME="$1"

echo -e "${BLUE}🚀 Creating and applying migration: $MIGRATION_NAME${NC}"

# Step 1: Create migration
echo -e "${YELLOW}📝 Creating migration file...${NC}"
supabase migration new "$MIGRATION_NAME"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to create migration${NC}"
    exit 1
fi

# Find the newest migration file
MIGRATION_FILE=$(ls -t supabase/migrations/*.sql | head -n 1)
echo -e "${GREEN}✅ Created: $MIGRATION_FILE${NC}"

# Step 2: Open migration file for editing
echo -e "${BLUE}📄 Opening migration file for editing...${NC}"
echo -e "${YELLOW}💡 Remember to use idempotent patterns:${NC}"
echo -e "${YELLOW}   - CREATE TABLE IF NOT EXISTS${NC}"
echo -e "${YELLOW}   - ADD COLUMN IF NOT EXISTS${NC}"
echo -e "${YELLOW}   - IF NOT EXISTS checks for policies${NC}"
echo ""

# Open in default editor
if command -v code &> /dev/null; then
    code "$MIGRATION_FILE"
elif command -v nano &> /dev/null; then
    nano "$MIGRATION_FILE"
else
    echo -e "${YELLOW}⚠️  Please edit the migration file manually: $MIGRATION_FILE${NC}"
fi

# Step 3: Ask if ready to apply
echo ""
read -p "$(echo -e "${BLUE}Ready to apply migration? (y/N): ${NC}")" -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🔄 Applying migration...${NC}"
    supabase db push
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Migration applied successfully!${NC}"
        echo -e "${BLUE}🌐 Check your database: https://supabase.com/dashboard/project/mhrfjtbnpxzmrppljztw${NC}"
    else
        echo -e "${RED}❌ Migration failed${NC}"
        echo -e "${YELLOW}💡 Fix the migration file and run: supabase db push${NC}"
    fi
else
    echo -e "${YELLOW}⏸️  Migration created but not applied${NC}"
    echo -e "${BLUE}📝 Edit: $MIGRATION_FILE${NC}"
    echo -e "${BLUE}🔄 Apply when ready: supabase db push${NC}"
fi 