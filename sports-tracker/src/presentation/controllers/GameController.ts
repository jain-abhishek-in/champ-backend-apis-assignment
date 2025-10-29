import { Request, Response } from 'express';
import { GameRepository } from '../../infrastructure/persistence/GameRepository';
import { EventStore } from '../../infrastructure/persistence/EventStore';
import { GameResponseDto, EventResponseDto, StatsResponseDto, ApiResponse } from '../dto/GameResponseDto';

/**
 * GAME CONTROLLER
 * 
 * Purpose: Handle HTTP requests for game-related endpoints
 * Pattern: Controller Pattern (Presentation Layer)
 * Principle: Single Responsibility (only handles HTTP, no business logic)
 */

export class GameController {
  constructor(
    private gameRepository: GameRepository,
    private eventStore: EventStore
  ) {}

  /**
   * GET /api/games
   * Get all games
   */
  async getAllGames(req: Request, res: Response): Promise<void> {
    try {
      const games = await this.gameRepository.findAll();

      // Convert to DTO format
      const gamesDto: GameResponseDto[] = games.map(game => ({
        gameId: game.gameId,
        sport: game.sport,
        team1: game.team1,
        team2: game.team2,
        score1: game.score1,
        score2: game.score2,
        status: game.status,
        currentTime: game.currentTime,
        lastUpdated: game.lastUpdated.toISOString()
      }));

      const response: ApiResponse<GameResponseDto[]> = {
        success: true,
        data: gamesDto,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getAllGames:', error);
      
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch games',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * GET /api/games/:id
   * Get single game by ID
   */
  async getGameById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const game = await this.gameRepository.findById(id);

      if (!game) {
        const response: ApiResponse<null> = {
          success: false,
          error: `Game with ID '${id}' not found`,
          timestamp: new Date().toISOString()
        };
        
        res.status(404).json(response);
        return;
      }

      // Convert to DTO
      const gameDto: GameResponseDto = {
        gameId: game.gameId,
        sport: game.sport,
        team1: game.team1,
        team2: game.team2,
        score1: game.score1,
        score2: game.score2,
        status: game.status,
        currentTime: game.currentTime,
        lastUpdated: game.lastUpdated.toISOString()
      };

      const response: ApiResponse<GameResponseDto> = {
        success: true,
        data: gameDto,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getGameById:', error);
      
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch game',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * GET /api/games/:id/events
   * Get all events for a specific game (complete history)
   */
  async getGameEvents(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if game exists
      const game = await this.gameRepository.findById(id);
      if (!game) {
        const response: ApiResponse<null> = {
          success: false,
          error: `Game with ID '${id}' not found`,
          timestamp: new Date().toISOString()
        };
        
        res.status(404).json(response);
        return;
      }

      // Get all events for this game
      const events = await this.eventStore.getEventsByGameId(id);

      // Convert to DTO
      const eventsDto: EventResponseDto[] = events.map(event => ({
        eventId: event.eventId,
        eventType: event.eventType,
        gameId: event.aggregateId,
        version: event.version,
        timestamp: event.timestamp.toISOString(),
        payload: event.payload
      }));

      const response: ApiResponse<{
        game: GameResponseDto;
        events: EventResponseDto[];
        totalEvents: number;
      }> = {
        success: true,
        data: {
          game: {
            gameId: game.gameId,
            sport: game.sport,
            team1: game.team1,
            team2: game.team2,
            score1: game.score1,
            score2: game.score2,
            status: game.status,
            currentTime: game.currentTime,
            lastUpdated: game.lastUpdated.toISOString()
          },
          events: eventsDto,
          totalEvents: events.length
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getGameEvents:', error);
      
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch game events',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * GET /api/games/sport/:sport
   * Get all games for a specific sport
   */
  async getGamesBySport(req: Request, res: Response): Promise<void> {
    try {
      const { sport } = req.params;
      const sportUpper = sport.toUpperCase();

      // Validate sport
      const validSports = ['SOCCER', 'TENNIS', 'HOCKEY'];
      if (!validSports.includes(sportUpper)) {
        const response: ApiResponse<null> = {
          success: false,
          error: `Invalid sport. Must be one of: ${validSports.join(', ')}`,
          timestamp: new Date().toISOString()
        };
        
        res.status(400).json(response);
        return;
      }

      const games = await this.gameRepository.findBySport(sportUpper);

      // Convert to DTO
      const gamesDto: GameResponseDto[] = games.map(game => ({
        gameId: game.gameId,
        sport: game.sport,
        team1: game.team1,
        team2: game.team2,
        score1: game.score1,
        score2: game.score2,
        status: game.status,
        currentTime: game.currentTime,
        lastUpdated: game.lastUpdated.toISOString()
      }));

      const response: ApiResponse<GameResponseDto[]> = {
        success: true,
        data: gamesDto,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getGamesBySport:', error);
      
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch games by sport',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * GET /api/games/live
   * Get all currently live games
   */
  async getLiveGames(req: Request, res: Response): Promise<void> {
    try {
      const games = await this.gameRepository.findLiveGames();

      // Convert to DTO
      const gamesDto: GameResponseDto[] = games.map(game => ({
        gameId: game.gameId,
        sport: game.sport,
        team1: game.team1,
        team2: game.team2,
        score1: game.score1,
        score2: game.score2,
        status: game.status,
        currentTime: game.currentTime,
        lastUpdated: game.lastUpdated.toISOString()
      }));

      const response: ApiResponse<GameResponseDto[]> = {
        success: true,
        data: gamesDto,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getLiveGames:', error);
      
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch live games',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * GET /api/stats
   * Get statistics about all games
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const totalGames = await this.gameRepository.count();
      const byStatus = await this.gameRepository.countByStatus();

      // Count by sport
      const allGames = await this.gameRepository.findAll();
      const bySport: { [sport: string]: number } = {};
      allGames.forEach(game => {
        bySport[game.sport] = (bySport[game.sport] || 0) + 1;
      });

      // Count total events
      let totalEvents = 0;
      for (const game of allGames) {
        const eventCount = await this.eventStore.countEvents(game.gameId);
        totalEvents += eventCount;
      }

      const statsDto: StatsResponseDto = {
        totalGames,
        byStatus,
        bySport,
        totalEvents
      };

      const response: ApiResponse<StatsResponseDto> = {
        success: true,
        data: statsDto,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getStats:', error);
      
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch stats',
        timestamp: new Date().toISOString()
      };
      
      res.status(500).json(response);
    }
  }
}