import { Router } from 'express';
import { GameController } from '../controllers/GameController';
import { GameRepository } from '../../infrastructure/persistence/GameRepository';
import { EventStore } from '../../infrastructure/persistence/EventStore';

/**
 * GAME ROUTES
 * 
 * Purpose: Define API endpoints and map them to controller methods
 * Pattern: Router Pattern
 */

export function createGameRoutes(
  gameRepository: GameRepository,
  eventStore: EventStore
): Router {
  const router = Router();
  const controller = new GameController(gameRepository, eventStore);

  /**
   * @route   GET /api/games
   * @desc    Get all games
   * @access  Public
   */
  router.get('/', (req, res) => controller.getAllGames(req, res));

  /**
   * @route   GET /api/games/live
   * @desc    Get all live games
   * @access  Public
   * @note    Must come BEFORE /:id route to avoid conflict
   */
  router.get('/live', (req, res) => controller.getLiveGames(req, res));

  /**
   * @route   GET /api/games/sport/:sport
   * @desc    Get games by sport (soccer, tennis, hockey)
   * @access  Public
   */
  router.get('/sport/:sport', (req, res) => controller.getGamesBySport(req, res));

  /**
   * @route   GET /api/games/:id
   * @desc    Get single game by ID
   * @access  Public
   */
  router.get('/:id', (req, res) => controller.getGameById(req, res));

  /**
   * @route   GET /api/games/:id/events
   * @desc    Get all events for a game (complete history)
   * @access  Public
   */
  router.get('/:id/events', (req, res) => controller.getGameEvents(req, res));

  return router;
}