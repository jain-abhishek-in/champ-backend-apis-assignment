

export class Score {
  private readonly team1Score: number;
  private readonly team2Score: number;

  constructor(team1Score: number, team2Score: number) {
    if (team1Score < 0 || team2Score < 0) {
      throw new Error('Score cannot be negative');
    }

    this.team1Score = team1Score;
    this.team2Score = team2Score;
  }

  static create(team1Score: number, team2Score: number): Score {
    return new Score(team1Score, team2Score);
  }

  static zero(): Score {
    return new Score(0, 0);
  }

  getTeam1Score(): number {
    return this.team1Score;
  }

  getTeam2Score(): number {
    return this.team2Score;
  }

  incrementTeam1(): Score {
    return new Score(this.team1Score + 1, this.team2Score);
  }

  incrementTeam2(): Score {
    return new Score(this.team1Score, this.team2Score + 1);
  }

  // Business logic - who's winning?
  isTeam1Winning(): boolean {
    return this.team1Score > this.team2Score;
  }

  isTeam2Winning(): boolean {
    return this.team2Score > this.team1Score;
  }

  isTied(): boolean {
    return this.team1Score === this.team2Score;
  }

  toString(): string {
    return `${this.team1Score}-${this.team2Score}`;
  }

  equals(other: Score): boolean {
    return this.team1Score === other.team1Score && 
           this.team2Score === other.team2Score;
  }
}