import { Score } from '../value-objects/Score';
import { GameStatus, GameStatusEnum } from '../value-objects/GameStatus';

export enum SportType {
  SOCCER = 'SOCCER',
  TENNIS = 'TENNIS',
  HOCKEY = 'HOCKEY'
}

export interface Participant {
  name: string;
  side: 'TEAM1' | 'TEAM2';
}

export interface GameEvent {
  eventId: string;
  eventType: string;
  timestamp: Date;
  team?: string;
  player?: number;
  minute?: number;
  period?: number;
  payload: any;
}

export class Game {
  private readonly gameId: string;
  private readonly sport: SportType;
  private readonly participants: Participant[];
  private score: Score;
  private status: GameStatus;
  private currentTime: string;
  private events: GameEvent[];
  private lastUpdated: Date;

  constructor(
    gameId: string,
    sport: SportType,
    participants: Participant[],
    score?: Score,
    status?: GameStatus,
    currentTime?: string,
    events?: GameEvent[]
  ) {
    // Validation
    if (!gameId || gameId.trim() === '') {
      throw new Error('Game ID is required');
    }
    if (participants.length !== 2) {
      throw new Error('Game must have exactly 2 participants');
    }

    this.gameId = gameId;
    this.sport = sport;
    this.participants = participants;
    this.score = score || Score.zero();
    this.status = status || GameStatus.scheduled();
    this.currentTime = currentTime || '';
    this.events = events || [];
    this.lastUpdated = new Date();
  }

  // Factory method - create new game
  static create(
    gameId: string,
    sport: SportType,
    team1Name: string,
    team2Name: string
  ): Game {
    const participants: Participant[] = [
      { name: team1Name, side: 'TEAM1' },
      { name: team2Name, side: 'TEAM2' }
    ];
    return new Game(gameId, sport, participants);
  }

  // ========================================
  // BUSINESS LOGIC METHODS
  // ========================================

  /**
   * Start the game
   * Business Rule: Can only start scheduled games
   */
  start(): void {
    if (!this.status.isScheduled()) {
      throw new Error('Can only start scheduled games');
    }
    this.status = GameStatus.live();
    this.lastUpdated = new Date();
  }

  /**
   * Finish the game
   * Business Rule: Can only finish live games
   */
  finish(): void {
    if (!this.status.isLive()) {
      throw new Error('Can only finish live games');
    }
    this.status = GameStatus.finished();
    this.lastUpdated = new Date();
  }

  /**
   * Record a score for team 1
   * Business Rule: Can only score in live games
   */
  scoreTeam1(): void {
    if (!this.status.canScore()) {
      throw new Error('Cannot score when game is not live');
    }
    this.score = this.score.incrementTeam1();
    this.lastUpdated = new Date();
  }

  /**
   * Record a score for team 2
   * Business Rule: Can only score in live games
   */
  scoreTeam2(): void {
    if (!this.status.canScore()) {
      throw new Error('Cannot score when game is not live');
    }
    this.score = this.score.incrementTeam2();
    this.lastUpdated = new Date();
  }

  /**
   * Update score directly (for syncing from external API)
   */
  updateScore(team1Score: number, team2Score: number): void {
    this.score = Score.create(team1Score, team2Score);
    this.lastUpdated = new Date();
  }

  /**
   * Update game status
   */
  updateStatus(newStatus: GameStatusEnum): void {
    this.status = new GameStatus(newStatus);
    this.lastUpdated = new Date();
  }

  /**
   * Update current time/period
   */
  updateCurrentTime(time: string): void {
    this.currentTime = time;
    this.lastUpdated = new Date();
  }

  /**
   * Add an event
   */
  addEvent(event: GameEvent): void {
    this.events.push(event);
    this.lastUpdated = new Date();
  }

  // ========================================
  // GETTERS (Read-only access)
  // ========================================

  getGameId(): string {
    return this.gameId;
  }

  getSport(): SportType {
    return this.sport;
  }

  getParticipants(): Participant[] {
    return [...this.participants]; // Return copy (immutability)
  }

  getTeam1Name(): string {
    return this.participants[0].name;
  }

  getTeam2Name(): string {
    return this.participants[1].name;
  }

  getScore(): Score {
    return this.score;
  }

  getStatus(): GameStatus {
    return this.status;
  }

  getCurrentTime(): string {
    return this.currentTime;
  }

  getEvents(): GameEvent[] {
    return [...this.events]; // Return copy
  }

  getLastUpdated(): Date {
    return this.lastUpdated;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Convert to plain object (for database/API)
   */
  toObject() {
    return {
      gameId: this.gameId,
      sport: this.sport,
      team1: this.participants[0].name,
      team2: this.participants[1].name,
      score1: this.score.getTeam1Score(),
      score2: this.score.getTeam2Score(),
      status: this.status.getValue(),
      currentTime: this.currentTime,
      events: this.events,
      lastUpdated: this.lastUpdated
    };
  }
}