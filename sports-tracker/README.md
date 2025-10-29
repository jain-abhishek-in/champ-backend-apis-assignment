# Sports Event Tracker - Backend Assignment

A real-time sports event tracking system built with **Event Sourcing**, **Domain-Driven Design (DDD)**, and **SOLID principles**. Aggregates data from multiple sports APIs (Soccer, Tennis, Hockey) into a unified format.

---

## 🎯 Assignment Requirements

### ✅ Required
1. **Record data from all 3 APIs** - ✓ Implemented with automatic polling every 5 seconds
2. **Organize data in database** - ✓ MongoDB with event sourcing pattern
3. **Expose unified API** - ✓ REST API with standardized game format

### ✅ Bonus (Implemented)
1. **Domain-Driven Design (DDD)** - ✓ Clean architecture with 4 layers
2. **Event Sourcing** - ✓ Complete audit trail in events collection
3. **SOLID Principles** - ✓ Applied throughout the codebase
4. **Adapter Pattern** - ✓ 3 sport adapters converting different formats

---

## 🏗️ Architecture

### Clean Architecture (DDD)
```
src/
├── domain/                    # Domain Layer (Business Logic)
│   ├── entities/              # Game entity with business rules
│   └── value-objects/         # Score, GameStatus (immutable)
│
├── application/               # Application Layer (Use Cases)
│   └── services/              # GameSyncService (orchestration)
│
├── infrastructure/            # Infrastructure Layer (External Concerns)
│   ├── adapters/              # Sport API adapters (Soccer, Tennis, Hockey)
│   └── persistence/           # MongoDB repositories & event store
│
└── presentation/              # Presentation Layer (API)
    ├── controllers/           # HTTP request handlers
    ├── routes/                # API endpoints
    └── dto/                   # Response formats
```

### Event Sourcing Pattern

**Two Collections:**
1. **`events`** (source of truth) - Append-only log of every change
2. **`games`** (read model) - Current state snapshot for fast queries
```
Game State Change Flow:
1. External API updates → 2. Adapter converts to domain model
→ 3. Detect changes → 4. Save event to event store
→ 5. Update game snapshot → 6. API serves current state
```

---

## 🔧 Technology Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MongoDB (with Mongoose ODM)
- **Architecture:** DDD + Event Sourcing
- **Patterns:** Adapter, Repository, Service Layer
- **Principles:** SOLID

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### Setup
```bash
# 1. Clone the repository
git clone <your-repo-url>
cd sports-tracker

# 2. Install dependencies
npm install

# 3. Start infrastructure (MongoDB, Kafka, Sport APIs)
docker-compose up -d

# 4. Create .env file
cp .env.example .env

# 5. Build TypeScript
npm run build

# 6. Start the application
npm run dev
```

The application will:
- Connect to MongoDB
- Start polling all 3 sport APIs every 5 seconds
- Track all game changes with event sourcing
- Expose REST API on http://localhost:4000

---

## 📡 API Endpoints

### Games
```
GET  /api/games              - Get all games
GET  /api/games/live         - Get live games only
GET  /api/games/sport/:sport - Get games by sport (soccer|tennis|hockey)
GET  /api/games/:id          - Get specific game
GET  /api/games/:id/events   - Get complete event history for a game
```

### Statistics
```
GET  /api/stats              - Get overall statistics
```

### Utility
```
GET  /                       - API documentation
GET  /health                 - Health check
```

---

## 📊 API Response Examples

### Get All Games
```json
GET /api/games

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

### Get Game Event History
```json
GET /api/games/M1/events

{
  "success": true,
  "data": {
    "game": { /* current state */ },
    "events": [
      {
        "eventId": "uuid-123",
        "eventType": "GAME_CREATED",
        "gameId": "M1",
        "version": 1,
        "timestamp": "2025-10-29T12:00:00.000Z",
        "payload": { /* event data */ }
      },
      {
        "eventType": "SCORE_UPDATED",
        "version": 2,
        "payload": {
          "previousScore": { "team1": 0, "team2": 0 },
          "newScore": { "team1": 1, "team2": 0 }
        }
      }
      /* ... complete history ... */
    ],
    "totalEvents": 50
  }
}
```

---

## 🎨 Design Patterns Used

### 1. Adapter Pattern
Each sport API has different data structures. Adapters convert them to a unified `Game` entity:
```typescript
interface ISportAdapter {
  fetchGames(): Promise<Game[]>;
  getSportType(): string;
}

// Soccer API: { matchId, homeTeam, awayTeam, score: {home, away} }
// Tennis API: { gameId, player1, player2, setScore: [...] }
// Hockey API: { id, teams: [...], score: {team1, team2} }
//
// All convert to: Game { gameId, sport, team1, team2, score1, score2 }
```

### 2. Repository Pattern
Abstracts data access from business logic:
- `GameRepository` - Current game state (CRUD operations)
- `EventStore` - Event history (append-only operations)

### 3. Event Sourcing
Every change is recorded as an event:
- **Events:** GAME_CREATED, GAME_STARTED, SCORE_UPDATED, STATUS_CHANGED, TIME_UPDATED
- **Benefits:** Complete audit trail, time travel, replay capability, debugging

### 4. Domain-Driven Design
Business logic lives in domain entities, not in services or controllers:
```typescript
class Game {
  // Business rules enforced here
  scoreTeam1() { /* validation + logic */ }
  start() { /* validation + logic */ }
}

// Not in services or controllers!
```

---

## 🎯 SOLID Principles Applied

| Principle | Implementation |
|-----------|----------------|
| **Single Responsibility** | Each class has one job: GameRepository handles persistence, SoccerAdapter handles Soccer API |
| **Open/Closed** | Can add new sports by creating new adapter, no modification needed |
| **Liskov Substitution** | All adapters implement ISportAdapter, are interchangeable |
| **Interface Segregation** | ISportAdapter is focused, clients only depend on what they need |
| **Dependency Inversion** | Services depend on interfaces (ISportAdapter), not concrete implementations |

---

## 📈 Event Sourcing in Action

Example: Game M2 lifecycle with 115 events captured
```
v1:  GAME_CREATED (Team 2A vs Team 2B, SCHEDULED)
v2:  GAME_STARTED (Status: LIVE)
v3:  SCORE_UPDATED (0-0 → 1-0)
v15: SCORE_UPDATED (1-0 → 2-0)
v27: SCORE_UPDATED (2-0 → 2-1)
v45: TIME_UPDATED (45 min → 46 min)
v89: SCORE_UPDATED (3-1 → 3-2)
v90: STATUS_CHANGED (LIVE → FINISHED)
v91: STATUS_CHANGED (FINISHED → SCHEDULED) // API restarted game
v92: SCORE_UPDATED (3-2 → 0-0)
... and so on
```

**Benefits:**
- Can answer: "What was the score at minute 45?"
- Can rebuild current state from events
- Complete audit trail for analytics
- Debug issues by replaying events

---

## 🧪 Testing
```bash
# Test with curl
curl http://localhost:4000/api/games
curl http://localhost:4000/api/games/M1/events
curl http://localhost:4000/api/stats

# Or use Postman collection
Import: Sports-APIs.postman_collection.json
```

---

## 📁 Project Structure
```
sports-tracker/
├── src/
│   ├── domain/                 # Business logic & rules
│   │   ├── entities/
│   │   │   └── Game.ts         # Game entity with business methods
│   │   └── value-objects/
│   │       ├── Score.ts        # Immutable score value object
│   │       └── GameStatus.ts   # Status value object
│   │
│   ├── application/            # Use cases & orchestration
│   │   └── services/
│   │       └── GameSyncService.ts  # Polling & sync logic
│   │
│   ├── infrastructure/         # External concerns
│   │   ├── adapters/
│   │   │   ├── ISportAdapter.ts    # Adapter interface
│   │   │   ├── SoccerAdapter.ts
│   │   │   ├── TennisAdapter.ts
│   │   │   └── HockeyAdapter.ts
│   │   └── persistence/
│   │       ├── schemas/
│   │       │   ├── EventSchema.ts
│   │       │   └── GameSchema.ts
│   │       ├── EventStore.ts       # Event sourcing store
│   │       └── GameRepository.ts   # Game snapshot repository
│   │
│   ├── presentation/           # API layer
│   │   ├── controllers/
│   │   │   └── GameController.ts
│   │   ├── routes/
│   │   │   ├── gameRoutes.ts
│   │   │   └── statsRoutes.ts
│   │   └── dto/
│   │       └── GameResponseDto.ts
│   │
│   ├── database.ts             # MongoDB connection
│   └── server.ts               # Application entry point
│
├── docker-compose.yml          # Infrastructure setup
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔍 Key Features

### 1. Automatic Polling
- Polls all 3 sport APIs every 5 seconds
- Detects score changes, status changes, time updates
- Minimal API calls using change detection

### 2. Event Sourcing
- Every change saved as immutable event
- Complete audit trail
- Can rebuild state at any point in time
- Events never deleted or modified

### 3. Unified Data Model
- Different sports (Soccer, Tennis, Hockey)
- Different structures (matches, games, players vs teams)
- **One consistent Game entity** for all

### 4. Real-time Tracking
- Tracks live games across all sports
- Records every goal, period change, minute update
- Captures state transitions (SCHEDULED → LIVE → FINISHED)

---

## 💡 Design Decisions

### Why Event Sourcing?
- **Requirement:** Record all events (not just current state)
- **Benefit:** Complete history, debugging, analytics, time travel
- **Trade-off:** More storage, but worth it for audit trail

### Why DDD?
- **Requirement:** Complex domain with different sports
- **Benefit:** Business logic in domain layer, easy to understand
- **Trade-off:** More files/structure, but better organization

### Why Adapter Pattern?
- **Requirement:** 3 APIs with different structures
- **Benefit:** Easy to add new sports, unified interface
- **Trade-off:** Extra abstraction layer, but worth it for flexibility

### Why MongoDB?
- **Requirement:** Flexible schema for events
- **Benefit:** Easy to store different event types, fast queries
- **Trade-off:** Less strict than SQL, but perfect for event sourcing

---

## ⏱️ Development Time

~2.5 hours (slightly over 2-hour estimate, but comprehensive implementation)

---

## 🎓 What I Learned

1. **Event Sourcing** - How to build append-only event logs
2. **DDD** - Separating business logic from infrastructure
3. **SOLID** - Practical application of all 5 principles
4. **Adapter Pattern** - Converting different formats to unified model
5. **TypeScript** - Strong typing for better code quality

---

## 🚧 Potential Improvements

- Add authentication/authorization
- Add WebSocket support for real-time updates
- Add event replay functionality
- Add snapshot optimization (don't replay all events)
- Add more comprehensive error handling
- Add unit tests and integration tests
- Add API rate limiting
- Add caching layer (Redis)

=================================================================


# Backend Assignment - Sports Event Tracker

## 🎯 The Task

You have 3 sport APIs running live. Each API exposes match events but with **different data structures**.

**Your mission:** Record all events and show the current state of every game in all sports.

---

## 🏗️ What You Get

We provide everything you need:

- **3 Sport APIs** running on Docker (Soccer, Tennis, Hockey)
- **MongoDB** for storage
- **Kafka** for messaging (optional to use - bonus)

Just run `docker-compose up` and start building!

---

## 🚀 Quick Start

```bash
# 1. Start everything
docker-compose up -d

# 2. Test the APIs
curl http://localhost:3001/api/matches    # Soccer
curl http://localhost:3002/api/games      # Tennis
curl http://localhost:3003/api/games      # Hockey

# 3. Build your solution!
```

**💡 Tip:** Import `Sports-APIs.postman_collection.json` into Postman to test all endpoints easily!

---

## 📡 The APIs

### Soccer API (Port 3001)

```bash
GET /api/matches       # All matches
GET /api/matches/:id   # Single match
```

**Structure:** `matchId`, `homeTeam`, `awayTeam`, `score`, `minute`, `status`, `events[]`  
**Events:** GOAL, YELLOW_CARD, RED_CARD, CORNER, SUBSTITUTION, PENALTY

### Tennis API (Port 3002)

```bash
GET /api/games         # All games
GET /api/games/:id     # Single game
```

**Structure:** `gameId`, `player1`, `player2`, `setScore[]`, `status`, `events[]`  
**Events:** ACE, DOUBLE_FAULT, WINNER, BREAK_POINT, CHALLENGE, UNFORCED_ERROR

### Hockey API (Port 3003)

```bash
GET /api/games         # All games
GET /api/games/:id     # Single game
```

**Structure:** `id`, `teams[]`, `score`, `period`, `status`, `events[]`  
**Events:** GOAL, PENALTY, SHOT, SAVE, HIT, FACEOFF, POWER_PLAY

**Note:** Each API updates at random intervals (1-10 seconds). Games progress, scores change, events happen!

---

## 🎯 What to Build

**Required:**

1. Record data from all 3 APIs
2. Organize the data on the database
3. Expose 1 API that provides current game states - every game entity has the same generic structure no matter the sport type

---

## 📝 Submission

Create a GitHub repo with your solution and send us the link.

Include:

- Your code
- README with setup instructions
- Brief explanation of your approach

**Time:** This should take appox. 2 hours.

---

## 🔧 Infrastructure Details

**MongoDB:**

```
mongodb://admin:password@localhost:27017
```

**Kafka:**

```
localhost:9092
```

---

Good luck! 🚀
