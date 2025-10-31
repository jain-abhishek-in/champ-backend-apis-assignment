import { Request, Response } from 'express';
import { GameRepository } from '../../infrastructure/persistence/GameRepository';
import { EventStore } from '../../infrastructure/persistence/EventStore';
import { GameResponseDto, EventResponseDto, StatsResponseDto, ApiResponse } from '../dto/GameResponseDto';

export class GameController {
  constructor(
    private gameRepository: GameRepository,
    private eventStore: EventStore
  ) {}

  async getAllGames(req: Request, res: Response): Promise<void> {
    try {
      const games = await this.gameRepository.findAll();

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

  async getGameEvents(req: Request, res: Response): Promise<void> {
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

      const events = await this.eventStore.getEventsByGameId(id);

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

  async getGamesBySport(req: Request, res: Response): Promise<void> {
    try {
      const { sport } = req.params;
      const sportUpper = sport.toUpperCase();

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

  async getLiveGames(req: Request, res: Response): Promise<void> {
    try {
      const games = await this.gameRepository.findLiveGames();

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

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const totalGames = await this.gameRepository.count();
      const byStatus = await this.gameRepository.countByStatus();

      const allGames = await this.gameRepository.findAll();
      const bySport: { [sport: string]: number } = {};
      allGames.forEach(game => {
        bySport[game.sport] = (bySport[game.sport] || 0) + 1;
      });

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