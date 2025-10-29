import { Game } from '../../domain/entities/Game';

/**
 * SPORT ADAPTER INTERFACE
 * 
 * Why an interface?
 * - SOLID: Dependency Inversion Principle
 *   (Depend on abstractions, not concrete implementations)
 * 
 * - SOLID: Interface Segregation Principle
 *   (Small, focused interface - only what's needed)
 * 
 * - SOLID: Open/Closed Principle
 *   (Open for extension - add new sports without changing existing code)
 * 
 * Any class that implements this interface MUST have these methods.
 * This ensures all adapters work the same way.
 */

export interface ISportAdapter {
  /**
   * Fetch games from the sport API and convert to our Game entities
   * @returns Array of Game entities (our unified format)
   */
  fetchGames(): Promise<Game[]>;

  /**
   * Get the sport type this adapter handles
   * @returns The sport name (SOCCER, TENNIS, HOCKEY)
   */
  getSportType(): string;
}