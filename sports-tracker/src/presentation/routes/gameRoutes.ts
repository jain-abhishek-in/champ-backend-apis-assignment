import { Router } from 'express';
import { GameController } from '../controllers/GameController';
import { GameRepository } from '../../infrastructure/persistence/GameRepository';
import { EventStore } from '../../infrastructure/persistence/EventStore';

export function createGameRoutes(
  gameRepository: GameRepository,
  eventStore: EventStore
): Router {
  const router = Router();
  const controller = new GameController(gameRepository, eventStore);

  router.get('/', (req, res) => controller.getAllGames(req, res));

  router.get('/live', (req, res) => controller.getLiveGames(req, res));

  router.get('/sport/:sport', (req, res) => controller.getGamesBySport(req, res));

  router.get('/:id', (req, res) => controller.getGameById(req, res));

  router.get('/:id/events', (req, res) => controller.getGameEvents(req, res));

  return router;
}