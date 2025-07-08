# CLAUDE.md - Development Guidelines

## Frontend Development Instructions

### Running the Application
- **Always use `cd /Users/jason/src/cco-pinai && ./scripts/start-frontend.sh` instead of `npm run web`**
- This is the preferred method for starting the frontend development server
- The script must be run from the project root directory (/Users/jason/src/cco-pinai)

### Project Structure
- This is a React Native/Expo application with web support
- Uses React Navigation for routing
- Implements URL-based navigation with proper linking configuration

### Key Commands
- Start development server: `./scripts/start-frontend.sh`
- Build: `npm run build`
- Type checking: `npm run type-check`
- Linting: `npm run lint`