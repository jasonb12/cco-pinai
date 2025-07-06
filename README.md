# Audio Transcript MCP Processing App

A React Native app built with Expo that processes audio transcripts using MCP (Model Context Protocol) servers, featuring offline-first architecture and real-time updates.

## Architecture

The app follows this flow:
```
Expo App → FastAPI Backend → MCPM → MCP Server
    ↓           ↓
Supabase ← WebSocket Connection
```

## Features

- **Authentication**: Sign in with Apple & Google via Supabase Auth
- **Offline-First**: WatermelonDB for local data persistence
- **File Upload**: React Native file picker with Supabase Storage
- **Real-Time Updates**: WebSocket connection for live transcript processing
- **MCP Integration**: Install and manage MCP servers via MCPM

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account
- MCPM installed (`npm install -g @modelcontextprotocol/cli`)

### One-Command Setup

```bash
# Clone and setup everything
git clone <your-repo>
cd audio-transcript-mcp
chmod +x scripts/*.sh
./scripts/setup.sh
```

### Manual Setup

#### Frontend Setup

1. Install dependencies:
```bash
cd frontend && npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

#### Backend Setup

1. Set up Python environment:
```bash
cd backend && python setup.py
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Development

Start both servers with one command:
```bash
npm run dev
```

Or start them individually:
```bash
# Frontend only
npm run frontend

# Backend only  
npm run backend
```

## Supabase Configuration

### Required Tables

Create these tables in your Supabase database:

```sql
-- Audio files storage bucket
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  public boolean DEFAULT false
);

INSERT INTO storage.buckets (id, name, public) VALUES ('audio-files', 'audio-files', true);

-- Transcripts table
CREATE TABLE transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  audio_url text NOT NULL,
  transcript_text text,
  status text NOT NULL DEFAULT 'pending',
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- MCP servers table
CREATE TABLE mcp_servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  status text NOT NULL DEFAULT 'available',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### OAuth Configuration

Configure OAuth providers in your Supabase project:

1. Go to Authentication → Settings → Auth Providers
2. Enable Apple and Google providers
3. Add your app's redirect URLs:
   - `audio-transcript-mcp://auth` (for mobile)
   - `http://localhost:3000/auth` (for web development)

## Environment Variables

### Frontend (.env)
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
MCP_SERVER_URL=localhost:8000
```

## Usage

1. **Sign In**: Use Apple or Google OAuth to authenticate
2. **Upload Audio**: Tap "Upload Audio File" to select and upload audio files
3. **Process Transcripts**: Files are automatically processed via MCP servers
4. **View Results**: Real-time updates show transcript processing status
5. **Manage MCPs**: Install new MCP servers from the available list

## API Endpoints

### FastAPI Backend

- `GET /` - Health check
- `GET /health` - Service health status
- `GET /mcp/list` - List available MCP servers
- `POST /mcp/install` - Install MCP server
- `POST /transcript/process` - Process audio transcript
- `WebSocket /ws` - Real-time updates

## Development

### Running Tests

```bash
# Frontend
npm test

# Backend
cd backend && python -m pytest
```

### Building for Production

```bash
# Frontend
npm run build

# Backend
cd backend && python -m pip install --upgrade pip
pip install -r requirements.txt
```

## License

MIT License - see LICENSE file for details