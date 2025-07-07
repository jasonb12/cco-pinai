# Audio Transcript MCP with Limitless.ai Integration

A full-stack application that combines audio file transcription with Limitless.ai lifelog synchronization. Built with React Native (Expo), FastAPI, and Supabase.

## ⚠️ MONOREPO STRUCTURE

**IMPORTANT: This is a monorepo with separate frontend and backend directories. Do NOT install packages or run build commands from the root directory!**

### Project Structure
- **`frontend/`** - React Native/Expo application with React Navigation v7 and Tamagui theming
- **`backend/`** - FastAPI Python backend with Limitless.ai integration
- **`scripts/`** - Setup and development scripts
- **`supabase/`** - Database schema and migrations

### Development Commands
```bash
# ✅ CORRECT - Run from appropriate directories:
cd frontend && npm start        # Start frontend
cd backend && python main.py   # Start backend

# ✅ CORRECT - Use monorepo scripts from root:
npm run frontend               # Start frontend (runs cd frontend && npm start)
npm run backend               # Start backend (runs cd backend && python main.py)
npm run dev                   # Start both services

# ❌ WRONG - Don't run these from root:
npm start                     # Shows warning and exits
npm install                   # Shows warning and exits
```

### Build Configuration
- **Frontend configs**: `frontend/babel.config.js`, `frontend/metro.config.js`, `frontend/tamagui.config.ts`
- **Backend configs**: `backend/requirements.txt`, `backend/main.py`
- **Root**: Only workspace coordination (`package.json` with workspaces)

**Rule of thumb**: If you're configuring builds, installing packages, or running dev servers, work in `frontend/` or `backend/` directories, not root.

## 🚀 Features

- **Audio File Upload & Transcription**: Upload audio files and get automated transcriptions
- **Limitless.ai Integration**: Sync lifelogs from your Limitless Pendant with cursor-based pagination
- **Real-time Updates**: WebSocket support for live progress tracking
- **Multi-Source Transcripts**: Unified view of uploaded files and Limitless recordings
- **Secure Authentication**: OAuth integration with Apple and Google via Supabase Auth
- **MCP Support**: Model Context Protocol server integration
- **Offline-First**: WatermelonDB for local data persistence

## 📋 Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Frontend       │────▶│  Backend API    │────▶│  Supabase       │
│  (Expo/React)   │     │  (FastAPI)      │     │  (PostgreSQL)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                          │
         │                      ▼                          ▼
         │              ┌─────────────────┐      ┌─────────────────┐
         │              │                 │      │                 │
         │              │  Limitless API  │      │  Storage        │
         │              │                 │      │  (Audio Files)  │
         │              │                 │      │                 │
         │              └─────────────────┘      └─────────────────┘
         │                      │
         ▼                      ▼
    Supabase Realtime      MCP Servers
    (Queue & Updates)      via MCPM
```

## 📦 Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Expo CLI (`npm install -g expo-cli`)
- Supabase CLI (`npm install -g supabase`)
- MCPM (`npm install -g @modelcontextprotocol/cli`)
- Supabase account
- Limitless.ai account with API access (and Pendant)

## 🎨 Theme Framework

The app uses **Tamagui** for theming and UI components:
- Modern React Native UI library with built-in theming
- Custom brand themes (light/dark) with iOS-style color palette
- Automatic system theme detection
- Performance-optimized styling with compile-time optimizations
- Consistent design tokens across all components

### Theme Dependencies
- `@tamagui/core` - Core theming engine
- `@tamagui/config` - Default configuration
- `@tamagui/animations-react-native` - Animation support
- `nativewind` - Tailwind CSS for React Native
- `zustand` - Theme state management

## 🛠️ Installation

### Quick Start

```bash
# Clone and setup everything
git clone https://github.com/yourusername/cco-pinai.git
cd cco-pinai
chmod +x scripts/*.sh
./scripts/setup_all.sh

# Setup theme framework
./scripts/setup_theme.sh
```

### Manual Setup

#### 1. Clone the repository

```bash
git clone https://github.com/yourusername/cco-pinai.git
cd cco-pinai
```

#### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
```

#### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration

# Setup theme framework
cd ..
./scripts/setup_theme.sh
```

#### 4. Supabase Setup

```bash
# Initialize Supabase
supabase init
supabase link --project-ref YOUR_PROJECT_REF

# Apply database migrations
cd backend
export PGPASSWORD="YOUR_DATABASE_PASSWORD"
supabase db push -p YOUR_DATABASE_PASSWORD
```

## ⚙️ Configuration

### Environment Variables

**backend/.env**
```env
# Supabase Configuration
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
PGPASSWORD=YOUR_DATABASE_PASSWORD

# Limitless AI Configuration
LIMITLESS_API_KEY=YOUR_LIMITLESS_API_KEY

# Server Configuration
MCP_SERVER_URL=localhost:8000

# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
```

**frontend/.env**
```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
EXPO_PUBLIC_API_URL=http://localhost:8000

# OAuth Configuration
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
```

### OAuth Configuration

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Apple and Google providers
3. Add redirect URLs:
   - `audio-transcript-mcp://auth` (mobile)
   - `http://localhost:8081/auth` (web development)

## 🗄️ Database Setup

### Automatic Setup (Recommended)

```bash
cd scripts
./setup_supabase.sh
```

### Manual Migration

1. Get your database password from Supabase Dashboard → Settings → Database
2. Run migrations:
   ```bash
   cd /path/to/project
   export PGPASSWORD="YOUR_DATABASE_PASSWORD"
   supabase db push -p YOUR_DATABASE_PASSWORD
   ```

### Migration Files

- `20240101000000_initial_schema.sql` - Base tables (transcripts, mcp_servers)
- `20240101000001_storage_setup.sql` - Storage bucket for audio files
- `20250706000001_add_limitless_integration.sql` - Limitless.ai support
- `20250706000002_fix_nullable_fields.sql` - Schema adjustments

## 📚 API Documentation

See [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) for detailed endpoint documentation.

### Key Endpoints

#### Limitless Integration
- `POST /limitless/sync/range` - Sync lifelogs for a date range
- `POST /limitless/sync/incremental` - Incremental sync from last checkpoint
- `GET /limitless/lifelogs/{id}` - Get specific lifelog
- `GET /limitless/lifelogs/recent` - Get recent lifelogs

#### Transcript Management
- `GET /transcripts/{user_id}`