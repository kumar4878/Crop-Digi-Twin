import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  eventId: string;
  eventType: string;
  timestamp: Date;
  farmerId: mongoose.Types.ObjectId;
  plotId: mongoose.Types.ObjectId;
  season: string;
  payload: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    reasoning?: string[];
  };
  provenance: {
    source: 'SENSOR' | 'MANUAL' | 'AI' | 'SYSTEM';
    triggeredBy: string;
    confidence: number;
    modelVersion?: string;
  };
  hash: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    eventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true },
    timestamp: { type: Date, required: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plotId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
    season: { type: String, required: true },
    payload: {
      before: { type: Schema.Types.Mixed },
      after: { type: Schema.Types.Mixed },
      reasoning: [{ type: String }],
    },
    provenance: {
      source: { type: String, enum: ['SENSOR', 'MANUAL', 'AI', 'SYSTEM'], required: true },
      triggeredBy: { type: String, required: true },
      confidence: { type: Number, min: 0, max: 100, default: 100 },
      modelVersion: { type: String },
    },
    hash: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

// Indexes for high-performance querying
EventSchema.index({ plotId: 1, season: 1, timestamp: 1 });
EventSchema.index({ eventType: 1, timestamp: -1 });
EventSchema.index({ farmerId: 1, timestamp: -1 });

export const EventModel = mongoose.model<IEvent>('Event', EventSchema);
