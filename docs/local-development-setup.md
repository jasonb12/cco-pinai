# Local Development Setup Guide

## Prerequisites

1. **Install Docker Desktop**
   - Download from: https://docs.docker.com/desktop/install/mac-install/
   - Or install via Homebrew: `brew install --cask docker`
   - Start Docker Desktop after installation

## Local Development Workflow

### 1. Start Local Supabase
```bash
# Start all Supabase services locally
supabase start
```

This will start:
- PostgreSQL database (localhost:54322)
- Supabase Studio (localhost:54323)
- API Gateway (localhost:54321)
- Auth server
- Storage server
- Edge Functions runtime

### 2. Pull Remote Schema
```bash
# Sync your local database with remote
supabase db pull
```

### 3. Development Workflow
```bash
# Make changes to your schema
supabase migration new add_new_feature

# Edit the generated migration file
# supabase/migrations/YYYYMMDDHHMMSS_add_new_feature.sql

# Apply migration locally
supabase db push --local

# Test your changes locally
# Run your app against localhost:54321

# When ready, push to remote
supabase db push
```

### 4. Stop Local Services
```bash
# Stop all services
supabase stop
```

## Benefits of Local Development

- **Fast iteration**: No network latency
- **Safe testing**: Test migrations before pushing to production
- **Offline development**: Work without internet
- **Full feature parity**: Same features as production
- **Easy reset**: `supabase db reset --local` to start fresh

## Environment Variables for Local Development

Create a `.env.local` file:
```env
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
```

The local anon key will be displayed when you run `supabase start`. 