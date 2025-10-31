import { ISportAdapter } from '../../infrastructure/adapters/ISportAdapter';
import { EventStore } from '../../infrastructure/persistence/EventStore';
import { GameRepository } from '../../infrastructure/persistence/GameRepository';
import { Game } from '../../domain/entities/Game';

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
    pollingInterval: number = 5000
  ) {
    this.adapters = adapters;
    this.eventStore = eventStore;
    this.gameRepository = gameRepository;
    this.pollingInterval = pollingInterval;
  }

  async startPolling(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Polling already running');
      return;
    }

    this.isRunning = true;
    console.log(`🔄 Starting polling every ${this.pollingInterval / 1000} seconds...`);

    await this.syncAllSports();

    this.intervalId = setInterval(async () => {
      await this.syncAllSports();
    }, this.pollingInterval);
  }

  stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    console.log('⏹️  Polling stopped');
  }

  async syncAllSports(): Promise<void> {
    console.log('\n🔄 === Sync cycle started ===');
    
    for (const adapter of this.adapters) {
      try {
        await this.syncSport(adapter);
      } catch (error) {
        console.error(`❌ Error syncing ${adapter.getSportType()}:`, error);
      }
    }
    
    console.log('✅ === Sync cycle completed ===\n');
  }

  private async syncSport(adapter: ISportAdapter): Promise<void> {
    const sportType = adapter.getSportType();
    
    try {
      const games = await adapter.fetchGames();
      
      console.log(`📊 ${sportType}: Fetched ${games.length} games`);

      for (const game of games) {
        await this.processGame(game, sportType);
      }

    } catch (error) {
      console.error(`❌ Error syncing ${sportType}:`, error);
      throw error;
    }
  }

  private async processGame(game: Game, sportType: string): Promise<void> {
    const gameId = game.getGameId();

    try {
      const existingGame = await this.gameRepository.findById(gameId);

      if (!existingGame) {
        await this.handleNewGame(game, sportType);
      } else {
        await this.handleExistingGame(game, existingGame, sportType);
      }

    } catch (error) {
      console.error(`❌ Error processing game ${gameId}:`, error);
    }
  }

  private async handleNewGame(game: Game, sportType: string): Promise<void> {
    const gameId = game.getGameId();
    
    console.log(`🆕 New game detected: ${gameId} (${sportType})`);

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

    await this.gameRepository.save(game);
  }

  private async handleExistingGame(
    newGame: Game,
    existingGame: any,
    sportType: string
  ): Promise<void> {
    const gameId = newGame.getGameId();
    let hasChanges = false;

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

    const newTime = newGame.getCurrentTime();
    const oldTime = existingGame.currentTime;

    if (newTime !== oldTime) {
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

    if (hasChanges) {
      await this.gameRepository.save(newGame);
    }
  }

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

  async syncOnce(): Promise<void> {
    console.log('🔄 Manual sync triggered');
    await this.syncAllSports();
  }
}