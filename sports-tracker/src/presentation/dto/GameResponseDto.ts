export interface GameResponseDto {
  gameId: string;
  sport: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  status: string;
  currentTime: string;
  lastUpdated: string;  // ISO string format
}

export interface EventResponseDto {
  eventId: string;
  eventType: string;
  gameId: string;
  version: number;
  timestamp: string;  // ISO string format
  payload: any;
}

export interface StatsResponseDto {
  totalGames: number;
  byStatus: {
    [status: string]: number;
  };
  bySport: {
    [sport: string]: number;
  };
  totalEvents: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}