import mongoose, { Schema, Document } from 'mongoose';

export interface IEventDocument extends Document {
  eventId: string;
  eventType: string;
  
  aggregateId: string;
  aggregateType: string;
  
  version: number;
  
  timestamp: Date;
  
  payload: {
    sport?: string;
    team?: string;
    player?: number;
    minute?: number;
    period?: number;

    previousState?: any;
    newState?: any;

    originalEvent?: any;
  };
  
  sourceApi?: string;
  createdAt: Date;
}

const EventSchema = new Schema<IEventDocument>({
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  eventType: {
    type: String,
    required: true,
    index: true
  },
  
  aggregateId: {
    type: String,
    required: true,
    index: true
  },
  
  aggregateType: {
    type: String,
    required: true,
    default: 'GAME'
  },
  
  version: {
    type: Number,
    required: true,
    min: 1
  },
  
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  
  payload: {
    type: Schema.Types.Mixed,
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
  collection: 'events',
  timestamps: false
});

EventSchema.index(
  { aggregateId: 1, version: 1 },
  { unique: true }
);

EventSchema.index(
  { aggregateId: 1, timestamp: 1 }
);

EventSchema.index(
  { eventType: 1, timestamp: -1 }
);

export const EventModel = mongoose.model<IEventDocument>('Event', EventSchema);