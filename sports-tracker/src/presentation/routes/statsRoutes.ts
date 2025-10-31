import { Router } from 'express';
import { GameController } from '../controllers/GameController';
import { GameRepository } from '../../infrastructure/persistence/GameRepository';
import { EventStore } from '../../infrastructure/persistence/EventStore';

export function createStatsRoutes(
  gameRepository: GameRepository,
  eventStore: EventStore
): Router {
  const router = Router();
  const controller = new GameController(gameRepository, eventStore);

  router.get('/', (req, res) => controller.getStats(req, res));

  return router;
}