import { EventModel, IEventDocument } from './schemas/EventSchema';
import { v4 as uuidv4 } from 'uuid';

export interface EventData {
  eventType: string;
  aggregateId: string;
  timestamp: Date;
  payload: any;
  sourceApi?: string;
}

export class EventStore {
  async saveEvent(eventData: EventData): Promise<IEventDocument> {
    try {
      const currentVersion = await this.getCurrentVersion(eventData.aggregateId);
      const nextVersion = currentVersion + 1;

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

      const savedEvent = await event.save();
      
      console.log(`Event saved: ${eventData.eventType} for ${eventData.aggregateId} (v${nextVersion})`);
      
      return savedEvent;

    } catch (error) {
      console.error('Error saving event:', error);
      throw error;
    }
  }

  async getCurrentVersion(aggregateId: string): Promise<number> {
    const lastEvent = await EventModel
      .findOne({ aggregateId })
      .sort({ version: -1 })
      .select('version')
      .exec();

    return lastEvent ? lastEvent.version : 0;
  }

  async getEventsByGameId(aggregateId: string): Promise<any[]> {
    const events = await EventModel
      .find({ aggregateId })
      .sort({ version: 1 })
      .exec();
    
    return events;
  }

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

  async countEvents(aggregateId: string): Promise<number> {
    return await EventModel.countDocuments({ aggregateId });
  }
}