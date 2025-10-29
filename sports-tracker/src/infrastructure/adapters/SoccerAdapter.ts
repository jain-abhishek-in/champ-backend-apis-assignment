import axios from 'axios';
import { Game, SportType, GameEvent } from '../../domain/entities/Game';
import { Score } from '../../domain/value-objects/Score';
import { GameStatus, GameStatusEnum } from '../../domain/value-objects/GameStatus';
import { ISportAdapter } from './ISportAdapter';

/**
 * SOCCER ADAPTER
 * 
 * Purpose: Convert Soccer API format → Our Game entity format
 * Pattern: Adapter Pattern
 * Principle: Single Responsibility (only handles soccer conversion)
 */

// Type definitions for Soccer API response
interface SoccerMatch {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  score: {
    home: number;
    away: number;
  };
  minute: number;
  status: string;
  events: Array<{
    type: string;
    minute: number;
    team: string;
    time: string;
  }>;
}

interface SoccerApiResponse {
  matches: SoccerMatch[];
}

export class SoccerAdapter implements ISportAdapter {
  private readonly apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  /**
   * Fetch games from Soccer API
   * Implements ISportAdapter interface
   */
  async fetchGames(): Promise<Game[]> {
    try {
      // Step 1: Call the Soccer API
      const response = await axios.get<SoccerApiResponse>(
        `${this.apiUrl}/api/matches`
      );

      // Step 2: Convert each match to our Game entity
      const games = response.data.matches.map(match => 
        this.convertToGame(match)
      );

      return games;

    } catch (error) {
      console.error('❌ Error fetching soccer games:', error);
      return []; // Return empty array on error (fail gracefully)
    }
  }

  /**
   * Get sport type
   * Implements ISportAdapter interface
   */
  getSportType(): string {
    return SportType.SOCCER;
  }

  /**
   * PRIVATE HELPER: Convert Soccer API format → Game entity
   * This is where the "adaptation" happens!
   */
  private convertToGame(match: SoccerMatch): Game {
    // Step 1: Create Score value object
    const score = Score.create(
      match.score.home,    // Soccer uses "home"
      match.score.away     // Soccer uses "away"
    );

    // Step 2: Map Soccer status to our status enum
    const status = this.mapStatus(match.status);

    // Step 3: Convert events
    const events = match.events.map(event => this.convertEvent(event, match.matchId));

    // Step 4: Create Game entity
    const game = new Game(
      match.matchId,                    // gameId
      SportType.SOCCER,                 // sport type
      [
        { name: match.homeTeam, side: 'TEAM1' },  // participant 1
        { name: match.awayTeam, side: 'TEAM2' }   // participant 2
      ],
      score,                            // Score value object
      status,                           // GameStatus value object
      `${match.minute} min`,            // currentTime (human readable)
      events                            // events array
    );

    return game;
  }

  /**
   * PRIVATE HELPER: Map Soccer status to our GameStatus enum
   * 
   * Soccer statuses: "LIVE", "SCHEDULED", "FINISHED"
   * Our statuses: LIVE, SCHEDULED, FINISHED
   * 
   * They match! But different APIs might not, so we map them.
   */
  private mapStatus(soccerStatus: string): GameStatus {
    switch (soccerStatus) {
      case 'LIVE':
        return GameStatus.live();
      case 'SCHEDULED':
        return GameStatus.scheduled();
      case 'FINISHED':
        return GameStatus.finished();
      default:
        console.warn(`Unknown soccer status: ${soccerStatus}, defaulting to SCHEDULED`);
        return GameStatus.scheduled();
    }
  }

  /**
   * PRIVATE HELPER: Convert Soccer event to our GameEvent format
   */
  private convertEvent(
    event: SoccerMatch['events'][0],
    gameId: string
  ): GameEvent {
    return {
      eventId: `${gameId}-${event.time}`,  // Create unique event ID
      eventType: event.type,                // GOAL, YELLOW_CARD, etc.
      timestamp: new Date(event.time),
      team: event.team,                     // "home" or "away"
      minute: event.minute,
      payload: {
        originalEvent: event                // Store original for reference
      }
    };
  }
}