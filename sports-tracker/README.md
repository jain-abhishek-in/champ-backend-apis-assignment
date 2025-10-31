# Sports Event Tracker

Real-time sports tracking system that aggregates data from multiple sport APIs into a unified format using Event Sourcing and Domain-Driven Design.

## Features

- Tracks Soccer, Tennis, and Hockey games in real-time
- Event sourcing for complete audit trail
- Unified API for all sports
- Automatic polling every 5 seconds
- Clean architecture with DDD principles

## Tech Stack

- Node.js + TypeScript
- Express.js
- MongoDB (with Mongoose)
- Docker & Docker Compose

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### Installation
```bash
# Clone repository
git clone <repo-url>
cd sports-tracker

# Start infrastructure
docker-compose up -d

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Build and run
npm run build
npm run dev
```

Server runs on `http://localhost:4000`

## API Endpoints

### Games
- `GET /api/games` - All games
- `GET /api/games/live` - Live games only
- `GET /api/games/sport/:sport` - Filter by sport (soccer/tennis/hockey)
- `GET /api/games/:id` - Single game details
- `GET /api/games/:id/events` - Complete event history

### Other
- `GET /api/stats` - Statistics
- `GET /health` - Health check

## Architecture

### Project Structure
```
src/
├── domain/              # Business logic
│   ├── entities/        # Game entity
│   └── value-objects/   # Score, GameStatus
├── application/         # Use cases
│   └── services/        # GameSyncService
├── infrastructure/      # External concerns
│   ├── adapters/        # Sport API adapters
│   └── persistence/     # MongoDB repositories
└── presentation/        # API layer
    ├── controllers/     
    ├── routes/          
    └── dto/             
```

### Design Patterns

**Adapter Pattern**: Converts different sport API formats to unified Game entity

**Event Sourcing**: All changes stored as immutable events in MongoDB

**Repository Pattern**: Separates data access from business logic

**DDD Layers**: Domain, Application, Infrastructure, Presentation

## How It Works

1. GameSyncService polls sport APIs every 5 seconds
2. Adapters convert API responses to unified format
3. Changes detected by comparing with database
4. Events saved to `events` collection (complete history)
5. Current state updated in `games` collection
6. REST API serves current game states

## Database Collections

### `games` - Current State
Stores current snapshot of each game for fast queries.

### `events` - Event History  
Append-only log of all changes. Used for audit trail and can rebuild game state.

## Example Response
```json
{
  "success": true,
  "data": [
    {
      "gameId": "M1",
      "sport": "SOCCER",
      "team1": "Team 1A",
      "team2": "Team 1B",
      "score1": 2,
      "score2": 1,
      "status": "LIVE",
      "currentTime": "45 min",
      "lastUpdated": "2025-10-29T12:30:00.000Z"
    }
  ],
  "timestamp": "2025-10-29T12:30:05.000Z"
}
```

## Testing
```bash
# Get all games
curl http://localhost:4000/api/games

# Get live games
curl http://localhost:4000/api/games/live

# Get game history
curl http://localhost:4000/api/games/M1/events

# Get stats
curl http://localhost:4000/api/stats
```

## Environment Variables
```env
MONGODB_URI=mongodb://admin:password@localhost:27017/sports?authSource=admin
SOCCER_API_URL=http://localhost:3001
TENNIS_API_URL=http://localhost:3002
HOCKEY_API_URL=http://localhost:3003
POLL_INTERVAL=5000
PORT=4000
```
