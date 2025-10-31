import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './database';

// Adapters
import { SoccerAdapter } from './infrastructure/adapters/SoccerAdapter';
import { TennisAdapter } from './infrastructure/adapters/TennisAdapter';
import { HockeyAdapter } from './infrastructure/adapters/HockeyAdapter';

// Repositories
import { EventStore } from './infrastructure/persistence/EventStore';
import { GameRepository } from './infrastructure/persistence/GameRepository';

// Application Service
import { GameSyncService } from './application/services/GameSyncService';

// Routes
import { createGameRoutes } from './presentation/routes/gameRoutes';
import { createStatsRoutes } from './presentation/routes/statsRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

async function initializeApp() {
  await connectDatabase();

  const soccerAdapter = new SoccerAdapter(
    process.env.SOCCER_API_URL || 'http://localhost:3001'
  );
  const tennisAdapter = new TennisAdapter(
    process.env.TENNIS_API_URL || 'http://localhost:3002'
  );
  const hockeyAdapter = new HockeyAdapter(
    process.env.HOCKEY_API_URL || 'http://localhost:3003'
  );

  const adapters = [soccerAdapter, tennisAdapter, hockeyAdapter];

  const eventStore = new EventStore();
  const gameRepository = new GameRepository();

  const pollInterval = parseInt(process.env.POLL_INTERVAL || '5000');
  const syncService = new GameSyncService(
    adapters,
    eventStore,
    gameRepository,
    pollInterval
  );

  await syncService.startPolling();

  console.log('✅ Application initialized successfully!');
  console.log(`🔄 Polling every ${pollInterval / 1000} seconds`);

  return { syncService, gameRepository, eventStore };
}

async function start() {
  try {
    const { syncService, gameRepository, eventStore } = await initializeApp();

    app.use('/api/games', createGameRoutes(gameRepository, eventStore));
    app.use('/api/stats', createStatsRoutes(gameRepository, eventStore));

    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        message: 'Sports Tracker API is running!',
        timestamp: new Date().toISOString()
      });
    });

    app.get('/', (req, res) => {
      res.json({
        name: 'Sports Tracker API',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          allGames: '/api/games',
          liveGames: '/api/games/live',
          gameBySport: '/api/games/sport/:sport (soccer|tennis|hockey)',
          gameById: '/api/games/:id',
          gameEvents: '/api/games/:id/events',
          stats: '/api/stats'
        },
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path,
        timestamp: new Date().toISOString()
      });
    });

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Sports Tracker API`);
      console.log(`${'='.repeat(60)}`);
      console.log(`\nServer: http://localhost:${PORT}`);
      console.log(`\nAPI Endpoints:`);
      console.log(`GET  /                          - API documentation`);
      console.log(`GET  /health                    - Health check`);
      console.log(`GET  /api/games                 - All games`);
      console.log(`GET  /api/games/live            - Live games only`);
      console.log(`GET  /api/games/sport/:sport    - Games by sport`);
      console.log(`GET  /api/games/:id             - Single game`);
      console.log(`GET  /api/games/:id/events      - Game history`);
      console.log(`GET  /api/stats                 - Statistics`);
      console.log(`\nData Sources:`);
      console.log(`Soccer: ${process.env.SOCCER_API_URL}`);
      console.log(`Tennis: ${process.env.TENNIS_API_URL}`);
      console.log(`Hockey: ${process.env.HOCKEY_API_URL}`);
      console.log(`\nDatabase:`);
      console.log(`Events collection (event sourcing)`);
      console.log(`Games collection (current state)`);
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Press Ctrl+C to stop\n`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down gracefully...');
      syncService.stopPolling();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();