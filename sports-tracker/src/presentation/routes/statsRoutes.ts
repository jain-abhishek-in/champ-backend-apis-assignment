import { Router } from 'express';
import { GameController } from '../controllers/GameController';
import { GameRepository } from '../../infrastructure/persistence/GameRepository';
import { EventStore } from '../../infrastructure/persistence/EventStore';

/**
 * STATS ROUTES
 * 
 * Purpose: Statistics and analytics endpoints
 */

export function createStatsRoutes(
  gameRepository: GameRepository,
  eventStore: EventStore
): Router {
  const router = Router();
  const controller = new GameController(gameRepository, eventStore);

  /**
   * @route   GET /api/stats
   * @desc    Get overall statistics
   * @access  Public
   */
  router.get('/', (req, res) => controller.getStats(req, res));

  return router;
}