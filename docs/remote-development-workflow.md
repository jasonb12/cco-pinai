# Remote-Only Development Workflow

## Current Setup
Your remote Supabase database is fully configured and ready to use.

## Migration Workflow (Remote-Only)

### 1. Create New Migration
```bash
# Create a new migration file
supabase migration new add_new_feature
```

### 2. Edit Migration File
```bash
# Edit the generated file in supabase/migrations/
# Make sure to use idempotent patterns like we did:
# - CREATE TABLE IF NOT EXISTS
# - ADD COLUMN IF NOT EXISTS
# - IF NOT EXISTS checks for policies
```

### 3. Test Migration
```bash
# Push to remote (this is your "test")
supabase db push

# If something goes wrong, you can:
# - Fix the migration file
# - Push again (thanks to idempotent patterns)
```

### 4. Check Database State
```bash
# You can check your database in Supabase Studio
# https://supabase.com/dashboard/project/mhrfjtbnpxzmrppljztw
```

## Best Practices for Remote Development

1. **Always use idempotent migrations** (like we fixed)
2. **Test migrations in small chunks**
3. **Use transactions when possible**
4. **Keep backups of important data**
5. **Document your changes**

## Example Idempotent Migration Pattern

```sql
-- Good: Idempotent column addition
ALTER TABLE my_table 
ADD COLUMN IF NOT EXISTS new_column TEXT;

-- Good: Idempotent policy creation
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'my_table' 
        AND policyname = 'My Policy'
    ) THEN
        CREATE POLICY "My Policy" ON my_table
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;
``` 