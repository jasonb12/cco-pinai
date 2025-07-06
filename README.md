# Audio Transcript MCP with Limitless.ai Integration

A full-stack application that combines audio file transcription with Limitless.ai lifelog synchronization. Built with React Native (Expo), FastAPI, and Supabase.

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
    WebSocket              MCP Servers
    Connection             via MCPM
```

## 📦 Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Expo CLI (`npm install -g expo-cli`)
- Supabase CLI (`npm install -g supabase`)
- MCPM (`npm install -g @modelcontextprotocol/cli`)
- Supabase account
- Limitless.ai account with API access (and Pendant)

## 🛠️ Installation

### Quick Start

```bash
# Clone and setup everything
git clone https://github.com/yourusername/cco-pinai.git
cd cco-pinai
chmod +x scripts/*.sh
./scripts/setup_all.sh
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
- `GET /transcripts/{user_id}` - Get user's transcripts
- `POST /transcript/process` - Process uploaded audio
- `GET /transcripts/{user_id}/stats` - Get transcript statistics

#### MCP Integration
- `GET /mcp/list` - List available MCP servers
- `POST /mcp/install` - Install MCP server

#### Real-time
- `WebSocket /ws` - Real-time updates

## 💻 Development

### Running the Services

```bash
# Start both frontend and backend
npm run dev

# Or run separately:

# Backend only
cd backend
python main.py

# Frontend only
cd frontend
npm start
```

### Running Tests

```bash
# Test Limitless integration
cd backend
python test_with_real_user.py

# Test database sync
python test_database_sync.py

# Demo complete integration
python demo_complete_integration.py
```

### Development Workflow

1. **Backend Development**
   - API runs on `http://localhost:8000`
   - FastAPI automatic reload enabled
   - Swagger docs at `/docs`

2. **Frontend Development**
   - Expo DevTools in browser
   - Hot reload enabled
   - Shake device for dev menu

## 🚀 Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

1. **Backend (Render/Railway)**
   ```bash
   cd backend
   # Follow platform-specific deployment
   ```

2. **Frontend (Expo EAS)**
   ```bash
   cd frontend
   eas build --platform all
   eas submit
   ```

## 🐛 Troubleshooting

### Common Issues

1. **Database Migration Errors**
   ```bash
   # Reset and reapply migrations
   supabase db reset
   supabase db push -p YOUR_PASSWORD
   ```

2. **Limitless API Connection**
   - Verify API key is valid
   - Ensure Pendant is paired
   - Check rate limits

3. **Authentication Issues**
   - Verify OAuth redirect URLs
   - Check Supabase auth settings
   - Ensure environment variables are set

4. **WebSocket Connection**
   - Check CORS settings
   - Verify backend is running
   - Check firewall/proxy settings

### Debug Mode

```python
# Backend debug logging
logging.basicConfig(level=logging.DEBUG)
```

```javascript
// Frontend debug
if (__DEV__) {
  console.log('Debug info:', data);
}
```

## 📂 Project Structure

```
cco-pinai/
├── frontend/               # Expo React Native app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API and storage services
│   │   ├── config/        # Configuration files
│   │   └── types/         # TypeScript definitions
│   └── App.tsx            # Main app component
├── backend/               # FastAPI backend
│   ├── src/
│   │   └── services/      # Business logic
│   │       ├── limitless.py    # Limitless API client
│   │       ├── sync.py         # Sync orchestration
│   │       └── database.py     # Supabase integration
│   └── main.py            # FastAPI app
├── supabase/              # Database files
│   └── migrations/        # SQL migration files
├── scripts/               # Setup and utility scripts
└── docs/                  # Documentation
```

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

## 🤝 Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for contribution guidelines.

## 📞 Support

- Issues: [GitHub Issues](https://github.com/yourusername/cco-pinai/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/cco-pinai/discussions)
- Documentation: [/docs](./docs)