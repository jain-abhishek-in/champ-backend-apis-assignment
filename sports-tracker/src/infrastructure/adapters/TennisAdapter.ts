import axios from 'axios';
import { Game, SportType, GameEvent } from '../../domain/entities/Game';
import { Score } from '../../domain/value-objects/Score';
import { GameStatus, GameStatusEnum } from '../../domain/value-objects/GameStatus';
import { ISportAdapter } from './ISportAdapter';

/**
 * TENNIS ADAPTER
 * 
 * Tennis scoring:
 * - Match consists of SETS (best of 3 or 5)
 * - Each set consists of GAMES (first to 6, win by 2)
 * - If 6-6, play tie-break to 7
 * - We track SETS WON as the score (most accurate for tennis)
 */

interface TennisGame {
  gameId: string;
  player1: string;
  player2: string;
  setScore: Array<{
    p1: number;
    p2: number;
  }>;
  status: string;
  events: Array<{
    type: string;
    player: number;
    time: string;
  }>;
}

interface TennisApiResponse {
  games: TennisGame[];
}

export class TennisAdapter implements ISportAdapter {
  private readonly apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async fetchGames(): Promise<Game[]> {
    try {
      const response = await axios.get<TennisApiResponse>(
        `${this.apiUrl}/api/games`
      );

      const games = response.data.games.map(game => 
        this.convertToGame(game)
      );

      return games;

    } catch (error) {
      console.error('❌ Error fetching tennis games:', error);
      return [];
    }
  }

  getSportType(): string {
    return SportType.TENNIS;
  }

  /**
   * Convert Tennis API format → Game entity
   */
  private convertToGame(game: TennisGame): Game {
    // Step 1: Calculate sets won (proper tennis scoring)
    const setsWon = this.calculateSetsWon(game.setScore);
    const score = Score.create(setsWon.player1, setsWon.player2);

    // Step 2: Map Tennis status to our status
    const status = this.mapStatus(game.status);

    // Step 3: Convert events
    const events = game.events.map(event => this.convertEvent(event, game.gameId));

    // Step 4: Format current time with set details
    const currentTime = this.formatCurrentTime(game.setScore);

    // Step 5: Create Game entity
    const gameEntity = new Game(
      game.gameId,
      SportType.TENNIS,
      [
        { name: game.player1, side: 'TEAM1' },
        { name: game.player2, side: 'TEAM2' }
      ],
      score,
      status,
      currentTime,
      events
    );

    return gameEntity;
  }

  /**
   * Calculate sets won (proper tennis scoring)
   * 
   * Rules:
   * - A set is won if player has more games AND won by 2
   * - OR if games are 7-6 (tie-break win)
   * - If 6-6, set is still in progress (tie-break happening)
   * 
   * Examples:
   * - 6-4: Player 1 won (6 > 4)
   * - 7-5: Player 1 won (7 > 5, won by 2)
   * - 7-6: Player 1 won (tie-break)
   * - 6-6: In progress (no winner yet)
   * - 5-3: In progress (not finished)
   */
  private calculateSetsWon(setScore: TennisGame['setScore']): {
    player1: number;
    player2: number;
  } {
    let player1SetsWon = 0;
    let player2SetsWon = 0;

    setScore.forEach((set, index) => {
      const isComplete = this.isSetComplete(set);
      
      if (isComplete) {
        if (set.p1 > set.p2) {
          player1SetsWon++;
        } else if (set.p2 > set.p1) {
          player2SetsWon++;
        }
        // If tied and complete (shouldn't happen), don't count
      }
      // If set not complete (in progress), don't count it
    });

    return {
      player1: player1SetsWon,
      player2: player2SetsWon
    };
  }

  /**
   * Check if a set is complete
   * 
   * A set is complete if:
   * - Someone reached 6 and opponent has <= 4 (e.g., 6-4, 6-3, 6-0)
   * - Someone reached 7 and opponent has 5 or 6 (e.g., 7-5, 7-6)
   * 
   * A set is NOT complete if:
   * - Both have < 6 (e.g., 5-3, 4-2) - still playing
   * - Score is 6-6 - tie-break in progress
   * - Score is 6-5 - might go to 7-5 or 6-6
   */
  private isSetComplete(set: { p1: number; p2: number }): boolean {
    const { p1, p2 } = set;
    
    // Standard win: 6-0, 6-1, 6-2, 6-3, 6-4
    if (p1 >= 6 && p1 - p2 >= 2) return true;
    if (p2 >= 6 && p2 - p1 >= 2) return true;
    
    // Tie-break win: 7-6
    if (p1 === 7 && p2 === 6) return true;
    if (p2 === 7 && p1 === 6) return true;
    
    // Extended set: 7-5, 8-6, etc.
    if (p1 >= 7 && p1 - p2 >= 2) return true;
    if (p2 >= 7 && p2 - p1 >= 2) return true;
    
    // Otherwise, set is in progress
    return false;
  }

  /**
   * Format current time to show set information
   * 
   * Examples:
   * - "Set 1 (4-2)" - In set 1, player 1 leads 4-2
   * - "Set 2 (6-6)" - In set 2, tie-break happening
   * - "Sets: 1-1, Current: 3-2" - Sets tied, current set score
   */
  private formatCurrentTime(setScore: TennisGame['setScore']): string {
    if (setScore.length === 0) {
      return 'Starting';
    }

    const setsWon = this.calculateSetsWon(setScore);
    const currentSet = setScore[setScore.length - 1];
    const setNumber = setScore.length;

    // If current set is complete, show overall sets won
    if (this.isSetComplete(currentSet)) {
      return `Sets: ${setsWon.player1}-${setsWon.player2}`;
    }

    // If in progress, show both sets won and current set score
    if (setScore.length > 1) {
      return `Sets: ${setsWon.player1}-${setsWon.player2}, Set ${setNumber}: ${currentSet.p1}-${currentSet.p2}`;
    }

    // First set in progress
    return `Set ${setNumber}: ${currentSet.p1}-${currentSet.p2}`;
  }

  /**
   * Map Tennis status to our GameStatus enum
   */
  private mapStatus(tennisStatus: string): GameStatus {
    switch (tennisStatus) {
      case 'IN_PROGRESS':
        return GameStatus.live();
      case 'COMPLETED':
        return GameStatus.finished();
      case 'SCHEDULED':
        return GameStatus.scheduled();
      default:
        console.warn(`Unknown tennis status: ${tennisStatus}, defaulting to SCHEDULED`);
        return GameStatus.scheduled();
    }
  }

  /**
   * Convert Tennis event to our GameEvent format
   */
  private convertEvent(
    event: TennisGame['events'][0],
    gameId: string
  ): GameEvent {
    return {
      eventId: `${gameId}-${event.time}`,
      eventType: event.type,
      timestamp: new Date(event.time),
      player: event.player,
      payload: {
        originalEvent: event
      }
    };
  }
}