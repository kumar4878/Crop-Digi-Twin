import mongoose, { Schema, Document } from 'mongoose';

export interface IDigitalTwin extends Document {
  plotId: mongoose.Types.ObjectId;
  season: string;
  currentStage: string;
  gddAccumulated: number;
  activitiesCount: {
    irrigations: number;
    sprays: number;
    fertilizers: number;
  };
  healthScore: number;
  lastEventId?: string;
  eventCount: number;
  rebuiltAt: Date;
}

const DigitalTwinSchema = new Schema<IDigitalTwin>(
  {
    plotId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
    season: { type: String, required: true },
    currentStage: { type: String, default: 'SOWING' },
    gddAccumulated: { type: Number, default: 0 },
    activitiesCount: {
      irrigations: { type: Number, default: 0 },
      sprays: { type: Number, default: 0 },
      fertilizers: { type: Number, default: 0 },
    },
    healthScore: { type: Number, min: 0, max: 100, default: 100 },
    lastEventId: { type: String },
    eventCount: { type: Number, default: 0 },
    rebuiltAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Unique compound index so a Plot + Season only has one Materialized View
DigitalTwinSchema.index({ plotId: 1, season: 1 }, { unique: true });

export const DigitalTwinModel = mongoose.model<IDigitalTwin>('DigitalTwin', DigitalTwinSchema);
