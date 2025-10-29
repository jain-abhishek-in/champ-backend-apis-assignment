import mongoose, { Schema, Document } from 'mongoose';

/**
 * EVENT SCHEMA (Event Sourcing Pattern)
 * 
 * This is our SOURCE OF TRUTH - the complete history
 * 
 * Key principles:
 * 1. APPEND-ONLY: Never update or delete events
 * 2. IMMUTABLE: Once written, never changed
 * 3. ORDERED: Events have sequence (version number)
 * 4. COMPLETE: Every change is recorded
 */

export interface IEventDocument extends Document {
  // Event identity
  eventId: string;              // Unique ID for this event (UUID)
  eventType: string;            // What happened: "GAME_STARTED", "GOAL_SCORED", etc.
  
  // What entity does this event belong to?
  aggregateId: string;          // Which game: "M1", "T1", "H1"
  aggregateType: string;        // Type of entity: "GAME"
  
  // Event ordering
  version: number;              // Sequence number (1, 2, 3...) for this game
  
  // When did it happen?
  timestamp: Date;              // When the event occurred in real world
  
  // What changed?
  payload: {
    sport?: string;             // "SOCCER", "TENNIS", "HOCKEY"
    team?: string;              // Which team: "home", "away", "team1", "team2"
    player?: number;            // Which player (for tennis): 1 or 2
    minute?: number;            // Game minute (for soccer)
    period?: number;            // Period (for hockey)
    
    // Before and after (for changes)
    previousState?: any;        // State before event
    newState?: any;             // State after event
    
    // Original event data from API
    originalEvent?: any;
  };
  
  // Technical metadata
  sourceApi?: string;           // Where it came from: "soccer-api", etc.
  createdAt: Date;              // When saved to database
}

/**
 * MongoDB Schema Definition
 */
const EventSchema = new Schema<IEventDocument>({
  eventId: {
    type: String,
    required: true,
    unique: true,               // No duplicate events
    index: true                 // Fast lookups
  },
  
  eventType: {
    type: String,
    required: true,
    index: true                 // Query by event type
  },
  
  aggregateId: {
    type: String,
    required: true,
    index: true                 // Query by game ID
  },
  
  aggregateType: {
    type: String,
    required: true,
    default: 'GAME'
  },
  
  version: {
    type: Number,
    required: true,
    min: 1                      // Versions start at 1
  },
  
  timestamp: {
    type: Date,
    required: true,
    index: true                 // Query by time
  },
  
  payload: {
    type: Schema.Types.Mixed,   // Flexible structure (different per event type)
    required: true
  },
  
  sourceApi: {
    type: String
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  collection: 'events',         // Collection name
  timestamps: false             // We handle timestamps manually
});

/**
 * COMPOUND INDEXES for performance
 * 
 * 1. Query all events for a game, in order
 * 2. Ensure no duplicate versions for same game
 */
EventSchema.index(
  { aggregateId: 1, version: 1 },
  { unique: true }              // Can't have two events with same version for same game
);

EventSchema.index(
  { aggregateId: 1, timestamp: 1 }
);

EventSchema.index(
  { eventType: 1, timestamp: -1 }
);

/**
 * Export the model
 */
export const EventModel = mongoose.model<IEventDocument>('Event', EventSchema);