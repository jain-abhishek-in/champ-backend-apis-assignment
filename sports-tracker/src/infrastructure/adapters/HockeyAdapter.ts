import axios from 'axios';
import { Game, SportType, GameEvent } from '../../domain/entities/Game';
import { Score } from '../../domain/value-objects/Score';
import { GameStatus, GameStatusEnum } from '../../domain/value-objects/GameStatus';
import { ISportAdapter } from './ISportAdapter';

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

  private convertToGame(game: HockeyGame): Game {
    const score = Score.create(
      game.score.team1,
      game.score.team2
    );

    const status = this.mapStatus(game.status);

    const events = game.events.map(event => this.convertEvent(event, game.id));

    const gameEntity = new Game(
      game.id,
      SportType.HOCKEY,
      [
        { name: game.teams[0], side: 'TEAM1' },
        { name: game.teams[1], side: 'TEAM2' }
      ],
      score,
      status,
      `Period ${game.period}`,
      events
    );

    return gameEntity;
  }

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

  private convertEvent(
    event: HockeyGame['events'][0],
    gameId: string
  ): GameEvent {
    return {
      eventId: `${gameId}-${event.time}`,
      eventType: event.type,
      timestamp: new Date(event.time),
      team: event.team,
      period: event.period,
      payload: {
        originalEvent: event
      }
    };
  }
}