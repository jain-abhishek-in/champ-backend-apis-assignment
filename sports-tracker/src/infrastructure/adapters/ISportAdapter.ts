import { Game } from '../../domain/entities/Game';

export interface ISportAdapter {
  fetchGames(): Promise<Game[]>;
  getSportType(): string;
}