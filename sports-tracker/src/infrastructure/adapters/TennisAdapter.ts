import axios from 'axios';
import { Game, SportType, GameEvent } from '../../domain/entities/Game';
import { Score } from '../../domain/value-objects/Score';
import { GameStatus, GameStatusEnum } from '../../domain/value-objects/GameStatus';
import { ISportAdapter } from './ISportAdapter';

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
      console.error('Error fetching tennis games:', error);
      return [];
    }
  }

  getSportType(): string {
    return SportType.TENNIS;
  }

  private convertToGame(game: TennisGame): Game {
    const setsWon = this.calculateSetsWon(game.setScore);
    const score = Score.create(setsWon.player1, setsWon.player2);

    const status = this.mapStatus(game.status);

    const events = game.events.map(event => this.convertEvent(event, game.gameId));

    const currentTime = this.formatCurrentTime(game.setScore);

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
      }
    });

    return {
      player1: player1SetsWon,
      player2: player2SetsWon
    };
  }

  private isSetComplete(set: { p1: number; p2: number }): boolean {
    const { p1, p2 } = set;
    
    if (p1 >= 6 && p1 - p2 >= 2) return true;
    if (p2 >= 6 && p2 - p1 >= 2) return true;
    
    if (p1 === 7 && p2 === 6) return true;
    if (p2 === 7 && p1 === 6) return true;
    
    if (p1 >= 7 && p1 - p2 >= 2) return true;
    if (p2 >= 7 && p2 - p1 >= 2) return true;
    
    return false;
  }

  private formatCurrentTime(setScore: TennisGame['setScore']): string {
    if (setScore.length === 0) {
      return 'Starting';
    }

    const setsWon = this.calculateSetsWon(setScore);
    const currentSet = setScore[setScore.length - 1];
    const setNumber = setScore.length;

    if (this.isSetComplete(currentSet)) {
      return `Sets: ${setsWon.player1}-${setsWon.player2}`;
    }

    if (setScore.length > 1) {
      return `Sets: ${setsWon.player1}-${setsWon.player2}, Set ${setNumber}: ${currentSet.p1}-${currentSet.p2}`;
    }

    return `Set ${setNumber}: ${currentSet.p1}-${currentSet.p2}`;
  }

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