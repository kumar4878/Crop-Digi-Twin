import mongoose, { Schema, Document } from 'mongoose';

export type CropStage = 'SOWING' | 'GERMINATION' | 'VEGETATIVE' | 'FLOWERING' | 'FRUITING' | 'MATURATION' | 'HARVEST';

export interface ICropCalendar extends Document {
  cropName: string;
  sapCropCode?: string;
  category: string;
  growingSeasons: string[];
  avgDuration: number;
  tBase: number; // Base temperature for GDD calculation
  stages: Array<{
    stage: CropStage;
    durationDays: number;
    gddRequired?: number;
    criticalWeatherParams: {
      minTemp?: number; maxTemp?: number;
      minRainfall?: number; maxRainfall?: number;
    };
    advisories: mongoose.Types.ObjectId[];
    keyActivities: string[];
  }>;
  totalDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

const CropCalendarSchema = new Schema<ICropCalendar>(
  {
    cropName: { type: String, required: true, index: true },
    sapCropCode: { type: String, sparse: true },
    category: { type: String, required: true },
    growingSeasons: [String],
    avgDuration: { type: Number, required: true },
    tBase: { type: Number, default: 10 },
    stages: [
      {
        stage: { type: String, enum: ['SOWING', 'GERMINATION', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURATION', 'HARVEST'], required: true },
        durationDays: { type: Number, required: true },
        gddRequired: Number,
        criticalWeatherParams: {
          minTemp: Number, maxTemp: Number,
          minRainfall: Number, maxRainfall: Number,
        },
        advisories: [{ type: Schema.Types.ObjectId }],
        keyActivities: [String],
      },
    ],
    totalDuration: { type: Number, required: true },
  },
  { timestamps: true }
);

export const CropCalendar = mongoose.model<ICropCalendar>('CropCalendar', CropCalendarSchema);
