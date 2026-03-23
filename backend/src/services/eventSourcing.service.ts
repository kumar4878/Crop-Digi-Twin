import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { EventModel, IEvent } from '../models/Event';
import { DigitalTwinModel, IDigitalTwin } from '../models/DigitalTwin';
import mongoose from 'mongoose';

export class EventSourcingService {
  /**
   * Creates a new immutable event, securely hashes it, and stores it in the database.
   * After saving, it automatically reconstructs the Digital Twin Materialized View.
   */
  async createEvent(eventData: {
    eventType: string;
    timestamp: Date;
    farmerId: string | mongoose.Types.ObjectId;
    plotId: string | mongoose.Types.ObjectId;
    season: string;
    payload: any;
    provenance: {
      source: 'SENSOR' | 'MANUAL' | 'AI' | 'SYSTEM';
      triggeredBy: string;
      confidence: number;
      modelVersion?: string;
    };
  }): Promise<IEvent> {
    const eventId = uuidv4();
    
    // Deterministic hashing for tamper-evident provenance
    // A production enterprise system ensures immutability here
    const hashPayload = JSON.stringify({
      eventType: eventData.eventType,
      timestamp: eventData.timestamp.toISOString(),
      plotId: eventData.plotId.toString(),
      payload: eventData.payload
    });

    const hash = crypto
      .createHash('sha256')
      .update(hashPayload)
      .digest('hex');
    
    // Validate uniqueness of the hash to prevent duplicate identical events rapidly firing
    const existing = await EventModel.findOne({ hash });
    if (existing) {
      console.log(`[EventSourcing] Duplicate event blocked with hash: ${hash}`);
      return existing;
    }

    const event = new EventModel({
      eventId,
      ...eventData,
      hash
    });
    
    await event.save();
    console.log(`[EventSourcing] Created event: ${event.eventType} on plot: ${eventData.plotId} for season: ${eventData.season}`);

    // Synchronously or asynchronously rebuild the materialized view
    // A robust enterprise approach would use a message queue (e.g. RabbitMQ/Kafka) for high throughput
    // But for this V2 implementation, synchronous update ensures reading your own writes.
    await this.reconstructDigitalTwin(
      new mongoose.Types.ObjectId(eventData.plotId.toString()), 
      eventData.season
    );
    
    return event;
  }
  
  /**
   * Replays ALL events for a given Plot + Season to compute the current true state of the farm.
   */
  async reconstructDigitalTwin(plotId: mongoose.Types.ObjectId, season: string): Promise<IDigitalTwin> {
    const events = await EventModel.find({ plotId, season }).sort({ timestamp: 1 });
    
    // Initial State Template
    const state = {
      plotId,
      season,
      currentStage: 'SOWING',
      gddAccumulated: 0,
      activitiesCount: { irrigations: 0, sprays: 0, fertilizers: 0 },
      eventCount: events.length,
      lastEventId: events.length > 0 ? events[events.length - 1].eventId : undefined,
      rebuiltAt: new Date()
    };
    
    // Event Reducer - Replaying the ledger
    for (const event of events) {
      switch (event.eventType) {
        case 'STAGE_PROGRESSION':
          if (event.payload?.after?.stage) {
            state.currentStage = event.payload.after.stage;
          }
          if (event.payload?.after?.gdd !== undefined) {
             // In case GDD is passed explicitly in the progression event
            state.gddAccumulated = event.payload.after.gdd;
          }
          break;
          
        case 'IRRIGATION_APPLIED':
          state.activitiesCount.irrigations += 1;
          break;
          
        case 'SPRAY_APPLIED':
        case 'PESTICIDE_APPLIED':
          state.activitiesCount.sprays += 1;
          break;

        case 'FERTILIZER_APPLIED':
          state.activitiesCount.fertilizers += 1;
          break;
          
        case 'HEALTH_SCORE_UPDATED':
           // We could capture health score if the payload holds it
           break;
           
        default:
          // Unhandled event types are safely ignored in projection
          break;
      }
    }
    
    // Upsert the Materialized View
    const updatedTwin = await DigitalTwinModel.findOneAndUpdate(
      { plotId, season },
      { $set: state },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    console.log(`[EventSourcing] Digital Twin reconstructed for Plot: ${plotId}`);
    return updatedTwin;
  }

  /**
   * Optional manual trigger for reconstructing the whole database (Useful during large migrations)
   */
  async reconstructAllTwins(): Promise<number> {
      const distinctGroupings = await EventModel.aggregate([
          { $group: { _id: { plotId: "$plotId", season: "$season" } } }
      ]);

      let reconstructedCount = 0;
      for (const group of distinctGroupings) {
          await this.reconstructDigitalTwin(group._id.plotId, group._id.season);
          reconstructedCount++;
      }
      return reconstructedCount;
  }
}

export const eventSourcingService = new EventSourcingService();
