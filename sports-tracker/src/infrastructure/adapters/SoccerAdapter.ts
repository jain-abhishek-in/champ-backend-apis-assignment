import axios from 'axios';
import { Game, SportType, GameEvent } from '../../domain/entities/Game';
import { Score } from '../../domain/value-objects/Score';
import { GameStatus, GameStatusEnum } from '../../domain/value-objects/GameStatus';
import { ISportAdapter } from './ISportAdapter';

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

  async fetchGames(): Promise<Game[]> {
    try {
      const response = await axios.get<SoccerApiResponse>(
        `${this.apiUrl}/api/matches`
      );

      const games = response.data.matches.map(match => 
        this.convertToGame(match)
      );

      return games;

    } catch (error) {
      console.error('Error fetching soccer games:', error);
      return [];
    }
  }

  getSportType(): string {
    return SportType.SOCCER;
  }

  private convertToGame(match: SoccerMatch): Game {
    const score = Score.create(
      match.score.home,
      match.score.away
    );

    const status = this.mapStatus(match.status);

    const events = match.events.map(event => this.convertEvent(event, match.matchId));

    const game = new Game(
      match.matchId,
      SportType.SOCCER,
      [
        { name: match.homeTeam, side: 'TEAM1' },
        { name: match.awayTeam, side: 'TEAM2' }
      ],
      score,
      status,
      `${match.minute} min`,
      events
    );

    return game;
  }

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

  private convertEvent(
    event: SoccerMatch['events'][0],
    gameId: string
  ): GameEvent {
    return {
      eventId: `${gameId}-${event.time}`,
      eventType: event.type,
      timestamp: new Date(event.time),
      team: event.team,
      minute: event.minute,
      payload: {
        originalEvent: event
      }
    };
  }
}