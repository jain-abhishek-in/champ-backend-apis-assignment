import { GameModel, IGameDocument } from './schemas/GameSchema';
import { Game } from '../../domain/entities/Game';

export class GameRepository {
  async save(game: Game): Promise<IGameDocument> {
    try {
      const gameData = {
        gameId: game.getGameId(),
        sport: game.getSport(),
        team1: game.getTeam1Name(),
        team2: game.getTeam2Name(),
        score1: game.getScore().getTeam1Score(),
        score2: game.getScore().getTeam2Score(),
        status: game.getStatus().getValue(),
        currentTime: game.getCurrentTime(),
        version: 0,
        lastUpdated: new Date()
      };

      const savedGame = await GameModel.findOneAndUpdate(
        { gameId: game.getGameId() },
        { $set: gameData },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      ).exec();

      console.log(`✅ Game saved: ${game.getGameId()} (${game.getSport()})`);
      
      return savedGame as IGameDocument;

    } catch (error) {
      console.error('❌ Error saving game:', error);
      throw error;
    }
  }

  async findById(gameId: string): Promise<IGameDocument | null> {
    const game = await GameModel.findOne({ gameId }).exec();
    return game;
  }

  async findAll(): Promise<any[]> {
    const games = await GameModel
      .find()
      .sort({ lastUpdated: -1 })
      .exec();
    
    return games;
  }

  async findBySport(sport: string): Promise<any[]> {
    const games = await GameModel
      .find({ sport })
      .sort({ lastUpdated: -1 })
      .exec();
    
    return games;
  }

  async findByStatus(status: string): Promise<any[]> {
    const games = await GameModel
      .find({ status })
      .sort({ lastUpdated: -1 })
      .exec();
    
    return games;
  }

  async findLiveGames(): Promise<any[]> {
    const games = await GameModel
      .find({ status: 'LIVE' })
      .sort({ sport: 1, gameId: 1 })
      .exec();
    
    return games;
  }

  async updateVersion(
    gameId: string,
    version: number,
    eventId: string
  ): Promise<void> {
    await GameModel.updateOne(
      { gameId },
      {
        $set: {
          version,
          lastEventId: eventId,
          lastUpdated: new Date()
        }
      }
    ).exec();
  }

  async delete(gameId: string): Promise<void> {
    await GameModel.deleteOne({ gameId }).exec();
    console.log(`🗑️ Game deleted: ${gameId}`);
  }

  async deleteAll(): Promise<void> {
    await GameModel.deleteMany({}).exec();
    console.log('🗑️ All games deleted');
  }

  async count(): Promise<number> {
    return await GameModel.countDocuments().exec();
  }

  async countByStatus(): Promise<{ [status: string]: number }> {
    const results = await GameModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).exec();

    return results.reduce((acc: any, curr: any) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
  }
}