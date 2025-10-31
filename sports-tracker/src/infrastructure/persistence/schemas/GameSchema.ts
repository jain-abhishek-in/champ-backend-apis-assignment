import mongoose, { Schema, Document } from 'mongoose';

export interface IGameDocument extends Document {
  gameId: string;
  sport: string;
  
  team1: string;
  team2: string;
  
  score1: number;
  score2: number;
  status: string;
  currentTime: string;
  
  version: number;
  lastEventId: string;

  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GameSchema = new Schema<IGameDocument>({
  gameId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  sport: {
    type: String,
    required: true,
    enum: ['SOCCER', 'TENNIS', 'HOCKEY'],
    index: true
  },
  
  team1: {
    type: String,
    required: true
  },
  
  team2: {
    type: String,
    required: true
  },
  
  score1: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  
  score2: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  
  status: {
    type: String,
    required: true,
    enum: ['SCHEDULED', 'LIVE', 'FINISHED'],
    index: true
  },
  
  currentTime: {
    type: String,
    default: ''
  },
  
  version: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  
  lastEventId: {
    type: String
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  collection: 'games',
  timestamps: true
});

GameSchema.index({ sport: 1, status: 1 });
GameSchema.index({ status: 1, lastUpdated: -1 });
GameSchema.index({ lastUpdated: -1 });

export const GameModel = mongoose.model<IGameDocument>('Game', GameSchema);