import axios from 'axios';
import { Game, SportType, GameEvent } from '../../domain/entities/Game';
import { Score } from '../../domain/value-objects/Score';
import { GameStatus, GameStatusEnum } from '../../domain/value-objects/GameStatus';
import { ISportAdapter } from './ISportAdapter';

/**
 * HOCKEY ADAPTER
 * 
 * Hockey API differences:
 * - Uses "id" (not gameId or matchId) ← Need to adapt
 * - Teams in array: ["Team A", "Team B"] ← Need to adapt
 * - Score uses "team1"/"team2" (different from soccer's home/away)
 * - Has "period" instead of minute
 * - Status is "LIVE"/"FINAL"/"SCHEDULED"
 */

interface HockeyGame {
  id: string;
  teams: [string, string];
  score: {
    team1: number;
    team2: number;
  };
  period: number;
  status: string;
  events: Array<{
    type: string;
    team?: string;
    period: number;
    time: string;
  }>;
}

interface HockeyApiResponse {
  games: HockeyGame[];
}

export class HockeyAdapter implements ISportAdapter {
  private readonly apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async fetchGames(): Promise<Game[]> {
    try {
      const response = await axios.get<HockeyApiResponse>(
        `${this.apiUrl}/api/games`
      );

      const games = response.data.games.map(game => 
        this.convertToGame(game)
      );

      return games;

    } catch (error) {
      console.error('❌ Error fetching hockey games:', error);
      return [];
    }
  }

  getSportType(): string {
    return SportType.HOCKEY;
  }

  /**
   * Convert Hockey API format → Game entity
   * 
   * Key challenge: Teams in array, need to extract
   */
  private convertToGame(game: HockeyGame): Game {
    // Step 1: Create Score value object
    const score = Score.create(
      game.score.team1,
      game.score.team2
    );

    // Step 2: Map Hockey status to our status
    const status = this.mapStatus(game.status);

    // Step 3: Convert events
    const events = game.events.map(event => this.convertEvent(event, game.id));

    // Step 4: Create Game entity
    // Teams come as array: ["Team 1A", "Team 1B"]
    const gameEntity = new Game(
      game.id,                          // Hockey uses "id"
      SportType.HOCKEY,
      [
        { name: game.teams[0], side: 'TEAM1' },  // First team
        { name: game.teams[1], side: 'TEAM2' }   // Second team
      ],
      score,
      status,
      `Period ${game.period}`,          // Current period
      events
    );

    return gameEntity;
  }

  /**
   * Map Hockey status to our GameStatus enum
   * 
   * Hockey: "LIVE" → Our: LIVE
   * Hockey: "FINAL" → Our: FINISHED
   * Hockey: "SCHEDULED" → Our: SCHEDULED
   */
  private mapStatus(hockeyStatus: string): GameStatus {
    switch (hockeyStatus) {
      case 'LIVE':
        return GameStatus.live();
      case 'FINAL':
        return GameStatus.finished();
      case 'SCHEDULED':
        return GameStatus.scheduled();
      default:
        console.warn(`Unknown hockey status: ${hockeyStatus}, defaulting to SCHEDULED`);
        return GameStatus.scheduled();
    }
  }

  /**
   * Convert Hockey event to our GameEvent format
   */
  private convertEvent(
    event: HockeyGame['events'][0],
    gameId: string
  ): GameEvent {
    return {
      eventId: `${gameId}-${event.time}`,
      eventType: event.type,        // GOAL, PENALTY, SHOT, etc.
      timestamp: new Date(event.time),
      team: event.team,             // "team1" or "team2"
      period: event.period,
      payload: {
        originalEvent: event
      }
    };
  }
}