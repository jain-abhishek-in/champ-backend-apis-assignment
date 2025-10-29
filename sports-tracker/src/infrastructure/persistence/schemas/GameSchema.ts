import mongoose, { Schema, Document } from 'mongoose';

/**
 * GAME SCHEMA (Snapshot / Read Model)
 * 
 * This is the CURRENT STATE - rebuilt from events
 * 
 * Purpose:
 * - Fast queries (don't need to replay all events)
 * - Simple API responses
 * - Can be deleted and rebuilt from events
 * 
 * Relationship with Events:
 * - Events = Source of truth
 * - Games = Derived from events (cache)
 */

export interface IGameDocument extends Document {
  // Identity
  gameId: string;               // Original ID from API: "M1", "T1", "H1"
  sport: string;                // "SOCCER", "TENNIS", "HOCKEY"
  
  // Participants (unified format)
  team1: string;                // First team/player name
  team2: string;                // Second team/player name
  
  // Current state
  score1: number;               // Team 1 score
  score2: number;               // Team 2 score
  status: string;               // "LIVE", "SCHEDULED", "FINISHED"
  currentTime: string;          // "45 min", "Period 2", "Set 1 (6-4)"
  
  // Event sourcing metadata
  version: number;              // Last event version applied
  lastEventId: string;          // ID of last event processed
  
  // Timestamps
  lastUpdated: Date;            // When last changed
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MongoDB Schema Definition
 */
const GameSchema = new Schema<IGameDocument>({
  gameId: {
    type: String,
    required: true,
    unique: true,               // Each game ID appears once
    index: true
  },
  
  sport: {
    type: String,
    required: true,
    enum: ['SOCCER', 'TENNIS', 'HOCKEY'],
    index: true                 // Query by sport
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
    index: true                 // Query by status (e.g., all live games)
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
  timestamps: true              // Auto-manage createdAt/updatedAt
});

/**
 * INDEXES for common queries
 */
GameSchema.index({ sport: 1, status: 1 });        // Find live soccer games
GameSchema.index({ status: 1, lastUpdated: -1 }); // Find recent live games
GameSchema.index({ lastUpdated: -1 });            // Find recently updated games

/**
 * Export the model
 */
export const GameModel = mongoose.model<IGameDocument>('Game', GameSchema);