import { ISportAdapter } from '../../infrastructure/adapters/ISportAdapter';
import { EventStore } from '../../infrastructure/persistence/EventStore';
import { GameRepository } from '../../infrastructure/persistence/GameRepository';
import { Game } from '../../domain/entities/Game';

/**
 * GAME SYNC SERVICE
 * 
 * Purpose: Coordinate polling, change detection, and persistence
 * Pattern: Application Service (orchestrates domain and infrastructure)
 * Principle: Single Responsibility (only handles game synchronization)
 * 
 * This is the "brain" that makes everything work together!
 */

export class GameSyncService {
  private adapters: ISportAdapter[];
  private eventStore: EventStore;
  private gameRepository: GameRepository;
  private pollingInterval: number;
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;

  constructor(
    adapters: ISportAdapter[],
    eventStore: EventStore,
    gameRepository: GameRepository,
    pollingInterval: number = 5000  // Default: 5 seconds
  ) {
    this.adapters = adapters;
    this.eventStore = eventStore;
    this.gameRepository = gameRepository;
    this.pollingInterval = pollingInterval;
  }

  /**
   * Start polling all sport APIs
   * Runs continuously in the background
   */
  async startPolling(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Polling already running');
      return;
    }

    this.isRunning = true;
    console.log(`🔄 Starting polling every ${this.pollingInterval / 1000} seconds...`);

    // Do first sync immediately
    await this.syncAllSports();

    // Then schedule recurring syncs
    this.intervalId = setInterval(async () => {
      await this.syncAllSports();
    }, this.pollingInterval);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    console.log('⏹️  Polling stopped');
  }

  /**
   * Sync all sports (one cycle)
   * This is called every 5 seconds
   */
  async syncAllSports(): Promise<void> {
    console.log('\n🔄 === Sync cycle started ===');
    
    for (const adapter of this.adapters) {
      try {
        await this.syncSport(adapter);
      } catch (error) {
        console.error(`❌ Error syncing ${adapter.getSportType()}:`, error);
        // Continue with other sports even if one fails
      }
    }
    
    console.log('✅ === Sync cycle completed ===\n');
  }

  /**
   * Sync one sport (using its adapter)
   * 
   * Steps:
   * 1. Fetch games from API (via adapter)
   * 2. For each game, compare with database
   * 3. If changed, save event + update snapshot
   */
  private async syncSport(adapter: ISportAdapter): Promise<void> {
    const sportType = adapter.getSportType();
    
    try {
      // Step 1: Fetch current data from API (already converted to our format!)
      const games = await adapter.fetchGames();
      
      console.log(`📊 ${sportType}: Fetched ${games.length} games`);

      // Step 2: Process each game
      for (const game of games) {
        await this.processGame(game, sportType);
      }

    } catch (error) {
      console.error(`❌ Error syncing ${sportType}:`, error);
      throw error;
    }
  }

  /**
   * Process a single game
   * 
   * Compare with existing data and save if changed
   */
  private async processGame(game: Game, sportType: string): Promise<void> {
    const gameId = game.getGameId();

    try {
      // Step 1: Get existing game from database (if exists)
      const existingGame = await this.gameRepository.findById(gameId);

      if (!existingGame) {
        // NEW GAME - First time seeing this game
        await this.handleNewGame(game, sportType);
      } else {
        // EXISTING GAME - Check if anything changed
        await this.handleExistingGame(game, existingGame, sportType);
      }

    } catch (error) {
      console.error(`❌ Error processing game ${gameId}:`, error);
    }
  }

  /**
   * Handle a new game (first time seeing it)
   */
  private async handleNewGame(game: Game, sportType: string): Promise<void> {
    const gameId = game.getGameId();
    
    console.log(`🆕 New game detected: ${gameId} (${sportType})`);

    // Save event: GAME_CREATED
    await this.eventStore.saveEvent({
      eventType: 'GAME_CREATED',
      aggregateId: gameId,
      timestamp: new Date(),
      payload: {
        sport: sportType,
        team1: game.getTeam1Name(),
        team2: game.getTeam2Name(),
        status: game.getStatus().getValue()
      },
      sourceApi: `${sportType.toLowerCase()}-api`
    });

    // If game already started, save initial state event
    if (game.getStatus().isLive()) {
      await this.eventStore.saveEvent({
        eventType: 'GAME_STARTED',
        aggregateId: gameId,
        timestamp: new Date(),
        payload: {
          sport: sportType,
          status: 'LIVE'
        },
        sourceApi: `${sportType.toLowerCase()}-api`
      });
    }

    // If there's a score, save it
    const score = game.getScore();
    if (score.getTeam1Score() > 0 || score.getTeam2Score() > 0) {
      await this.eventStore.saveEvent({
        eventType: 'SCORE_UPDATED',
        aggregateId: gameId,
        timestamp: new Date(),
        payload: {
          sport: sportType,
          previousScore: { team1: 0, team2: 0 },
          newScore: {
            team1: score.getTeam1Score(),
            team2: score.getTeam2Score()
          }
        },
        sourceApi: `${sportType.toLowerCase()}-api`
      });
    }

    // Save snapshot to GameRepository
    await this.gameRepository.save(game);
  }

  /**
   * Handle existing game (check for changes)
   */
  private async handleExistingGame(
    newGame: Game,
    existingGame: any,
    sportType: string
  ): Promise<void> {
    const gameId = newGame.getGameId();
    let hasChanges = false;

    // Check 1: Status changed?
    const newStatus = newGame.getStatus().getValue();
    const oldStatus = existingGame.status;

    if (newStatus !== oldStatus) {
      console.log(`📝 ${gameId}: Status changed ${oldStatus} → ${newStatus}`);
      
      await this.eventStore.saveEvent({
        eventType: 'STATUS_CHANGED',
        aggregateId: gameId,
        timestamp: new Date(),
        payload: {
          sport: sportType,
          previousStatus: oldStatus,
          newStatus: newStatus
        },
        sourceApi: `${sportType.toLowerCase()}-api`
      });

      hasChanges = true;
    }

    // Check 2: Score changed?
    const newScore1 = newGame.getScore().getTeam1Score();
    const newScore2 = newGame.getScore().getTeam2Score();
    const oldScore1 = existingGame.score1;
    const oldScore2 = existingGame.score2;

    if (newScore1 !== oldScore1 || newScore2 !== oldScore2) {
      console.log(`⚽ ${gameId}: Score changed ${oldScore1}-${oldScore2} → ${newScore1}-${newScore2}`);
      
      await this.eventStore.saveEvent({
        eventType: 'SCORE_UPDATED',
        aggregateId: gameId,
        timestamp: new Date(),
        payload: {
          sport: sportType,
          previousScore: { team1: oldScore1, team2: oldScore2 },
          newScore: { team1: newScore1, team2: newScore2 }
        },
        sourceApi: `${sportType.toLowerCase()}-api`
      });

      hasChanges = true;
    }

    // Check 3: Current time changed? (minute, period, set)
    const newTime = newGame.getCurrentTime();
    const oldTime = existingGame.currentTime;

    if (newTime !== oldTime) {
      // Time changes frequently, so we don't log every change
      // But we still save event for complete history
      await this.eventStore.saveEvent({
        eventType: 'TIME_UPDATED',
        aggregateId: gameId,
        timestamp: new Date(),
        payload: {
          sport: sportType,
          previousTime: oldTime,
          newTime: newTime
        },
        sourceApi: `${sportType.toLowerCase()}-api`
      });

      hasChanges = true;
    }

    // If anything changed, update the snapshot
    if (hasChanges) {
      await this.gameRepository.save(newGame);
    }
  }

  /**
   * Get current statistics
   */
  async getStats(): Promise<{
    totalGames: number;
    byStatus: { [status: string]: number };
    totalEvents: number;
  }> {
    const totalGames = await this.gameRepository.count();
    const byStatus = await this.gameRepository.countByStatus();
    
    // Count events (approximate - we'd need to query all games)
    const allGames = await this.gameRepository.findAll();
    let totalEvents = 0;
    for (const game of allGames) {
      const eventCount = await this.eventStore.countEvents(game.gameId);
      totalEvents += eventCount;
    }

    return {
      totalGames,
      byStatus,
      totalEvents
    };
  }

  /**
   * Manual sync (for testing)
   */
  async syncOnce(): Promise<void> {
    console.log('🔄 Manual sync triggered');
    await this.syncAllSports();
  }
}