import { EventModel, IEventDocument } from './schemas/EventSchema';
import { v4 as uuidv4 } from 'uuid';

/**
 * EVENT STORE
 * 
 * Purpose: Save and retrieve events
 * Pattern: Repository Pattern
 * Principle: Single Responsibility (only handles event persistence)
 */

export interface EventData {
  eventType: string;
  aggregateId: string;
  timestamp: Date;
  payload: any;
  sourceApi?: string;
}

export class EventStore {
  /**
   * Save a new event (append-only)
   */
  async saveEvent(eventData: EventData): Promise<IEventDocument> {
    try {
      // Step 1: Get the next version number for this game
      const currentVersion = await this.getCurrentVersion(eventData.aggregateId);
      const nextVersion = currentVersion + 1;

      // Step 2: Create event document
      const event = new EventModel({
        eventId: uuidv4(),
        eventType: eventData.eventType,
        aggregateId: eventData.aggregateId,
        aggregateType: 'GAME',
        version: nextVersion,
        timestamp: eventData.timestamp,
        payload: eventData.payload,
        sourceApi: eventData.sourceApi,
        createdAt: new Date()
      });

      // Step 3: Save to database
      const savedEvent = await event.save();
      
      console.log(`✅ Event saved: ${eventData.eventType} for ${eventData.aggregateId} (v${nextVersion})`);
      
      return savedEvent;

    } catch (error) {
      console.error('❌ Error saving event:', error);
      throw error;
    }
  }

  /**
   * Get current version number for a game
   */
  async getCurrentVersion(aggregateId: string): Promise<number> {
    const lastEvent = await EventModel
      .findOne({ aggregateId })
      .sort({ version: -1 })
      .select('version')
      .exec();

    return lastEvent ? lastEvent.version : 0;
  }

  /**
   * Get all events for a game, in order
   */
  async getEventsByGameId(aggregateId: string): Promise<any[]> {
    const events = await EventModel
      .find({ aggregateId })
      .sort({ version: 1 })
      .exec();
    
    return events;
  }

  /**
   * Get events for a game after a specific version
   */
  async getEventsAfterVersion(
    aggregateId: string,
    afterVersion: number
  ): Promise<any[]> {
    const events = await EventModel
      .find({
        aggregateId,
        version: { $gt: afterVersion }
      })
      .sort({ version: 1 })
      .exec();
    
    return events;
  }

  /**
   * Get all events of a specific type
   */
  async getEventsByType(
    eventType: string,
    limit: number = 100
  ): Promise<any[]> {
    const events = await EventModel
      .find({ eventType })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
    
    return events;
  }

  /**
   * Count total events for a game
   */
  async countEvents(aggregateId: string): Promise<number> {
    return await EventModel.countDocuments({ aggregateId });
  }
}