# CCOPINAI Scripts

This directory contains shell scripts for managing the CCOPINAI development environment.

## 🚀 Service Management

### `start-all.sh`
Starts both frontend and backend services in the background.
```bash
./scripts/start-all.sh
```

### `stop-all.sh`
Stops all running services and cleans up processes.
```bash
./scripts/stop-all.sh
```

### `start-frontend.sh`
Starts only the frontend (React Native/Expo) service.
```bash
./scripts/start-frontend.sh
```

### `start-backend.sh`
Starts only the backend (FastAPI) service.
```bash
./scripts/start-backend.sh
```

## 🌐 Browser Testing

### `open-browser.sh`
Opens the app in your default browser for manual testing.
```bash
./scripts/open-browser.sh
```

### `start-chrome-debug.sh`
Starts Chrome with remote debugging enabled for Playwright automation.
**Now runs in VISIBLE mode** - you can see and interact with the browser window.
```bash
./scripts/start-chrome-debug.sh
```

### `stop-chrome-debug.sh`
Stops the Chrome debugging session.
```bash
./scripts/stop-chrome-debug.sh
```

## 🧪 Testing

### `run-tests.sh`
Runs the complete test suite with Playwright automation.
```bash
./scripts/run-tests.sh
```

## 📸 Screenshots

All test runs generate screenshots in `tests/screenshots/` showing:
- Welcome screen (desktop, mobile, tablet)
- Navigation flow
- Different viewport sizes
- Tamagui-styled interface

## 🎯 Chrome Configuration Options

The Chrome debugging script now offers simplified configuration:

**Current Mode: SIMPLE VISIBLE**
- Minimal flags for maximum visibility
- Full browser window interaction
- Remote debugging on port 9222
- Loads app automatically at http://localhost:8081

**Previous Modes Available:**
- Headless mode (for CI/CD)
- Full automation mode (with all flags)
- Custom configuration as needed

## 🔧 Development Workflow

1. **Start Services:**
   ```bash
   ./scripts/start-all.sh
   ```

2. **Open for Manual Testing:**
   ```bash
   ./scripts/open-browser.sh
   ```

3. **Run Automated Tests:**
   ```bash
   ./scripts/run-tests.sh
   ```

4. **Stop Everything:**
   ```bash
   ./scripts/stop-all.sh
   ```

## 📱 App Features Visible

The browser will show the new Tamagui-based navigation:
- **Welcome Screen**: Branded landing with "Get Started" button
- **Sign In Screen**: Email/password + social login options
- **Dashboard**: KPI cards and quick actions (main landing after login)
- **Chat Tab**: Transcript upload functionality
- **Bottom Navigation**: 7 tabs with proper theming
- **Responsive Design**: Works on desktop, mobile, and tablet sizes
- **Theme Support**: Light/dark mode with iOS-style colors

## Setup Scripts

### `setup.sh`
**Purpose**: Complete project setup
- Sets up backend Python environment
- Installs frontend dependencies
- Configures environment files

**Usage**: `./scripts/setup.sh`

### `setup_supabase.sh`
**Purpose**: Supabase database setup
- Applies database migrations
- Sets up storage buckets
- Configures authentication

**Usage**: `./scripts/setup_supabase.sh`

### `dev.sh`
**Purpose**: Development workflow script
- Runs setup if needed
- Starts all services
- Opens development URLs

**Usage**: `./scripts/dev.sh`

## Development Workflow

### First Time Setup
```bash
# 1. Complete setup
./scripts/setup.sh

# 2. Configure Supabase (if using)
./scripts/setup_supabase.sh

# 3. Start development
./scripts/start-all.sh
```

### Daily Development
```bash
# Start all services
./scripts/start-all.sh

# Or start individual services
./scripts/start-frontend.sh  # Frontend only
./scripts/start-backend.sh   # Backend only

# Stop everything
./scripts/stop-all.sh
```

## Environment Requirements

### Frontend
- Node.js 18+
- npm or yarn
- Expo CLI
- Environment file: `frontend/.env`

### Backend
- Python 3.11+
- Virtual environment: `backend/venv/`
- Environment file: `backend/.env`

## Troubleshooting

### Port Conflicts
If ports 8000 or 8081 are in use:
```bash
# Kill processes on these ports
lsof -ti:8000 | xargs kill -9
lsof -ti:8081 | xargs kill -9
```

### Clean Restart
```bash
# Stop all services and clean up
./scripts/stop-all.sh

# Clear any remaining processes
pkill -f "expo start"
pkill -f "python main.py"

# Restart
./scripts/start-all.sh
```

### Dependencies Issues
```bash
# Reinstall frontend dependencies
cd frontend && rm -rf node_modules && npm install

# Reinstall backend dependencies
cd backend && source venv/bin/activate && pip install -r requirements.txt
``` 