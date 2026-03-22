import mongoose, { Schema, Document } from 'mongoose';

export interface IWeatherSnapshot extends Document {
  fieldId: mongoose.Types.ObjectId;
  location: { type: 'Point'; coordinates: [number, number] };
  data: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    rainfall: number;
    condition: string;
  };
  source: 'OPENWEATHER' | 'IMD' | 'GKMS' | 'MANUAL';
  timestamp: Date;
  createdAt: Date;
}

const WeatherSnapshotSchema = new Schema<IWeatherSnapshot>(
  {
    fieldId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    data: {
      temperature: { type: Number, required: true },
      feelsLike: Number,
      humidity: Number,
      windSpeed: Number,
      rainfall: { type: Number, default: 0 },
      condition: String,
    },
    source: { type: String, enum: ['OPENWEATHER', 'IMD', 'GKMS', 'MANUAL'], default: 'OPENWEATHER' },
    timestamp: { type: Date, required: true },
  },
  { timestamps: true }
);

WeatherSnapshotSchema.index({ fieldId: 1, timestamp: -1 });
WeatherSnapshotSchema.index({ location: '2dsphere' });
WeatherSnapshotSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

export const WeatherSnapshot = mongoose.model<IWeatherSnapshot>('WeatherSnapshot', WeatherSnapshotSchema);

// --- Weather Alert ---

export interface IWeatherAlert extends Document {
  fieldId: mongoose.Types.ObjectId;
  type: 'HEAT_WAVE' | 'COLD_WAVE' | 'HEAVY_RAIN' | 'DROUGHT' | 'STORM' | 'FROST';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  weatherData: { temperature: number; rainfall: number; windSpeed: number };
  actionable: boolean;
  recommendations: string[];
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: mongoose.Types.ObjectId;
}

const WeatherAlertSchema = new Schema<IWeatherAlert>(
  {
    fieldId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
    type: { type: String, enum: ['HEAT_WAVE', 'COLD_WAVE', 'HEAVY_RAIN', 'DROUGHT', 'STORM', 'FROST'], required: true },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true },
    message: { type: String, required: true },
    weatherData: {
      temperature: Number,
      rainfall: Number,
      windSpeed: Number,
    },
    actionable: { type: Boolean, default: true },
    recommendations: [String],
    acknowledgedAt: Date,
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

WeatherAlertSchema.index({ fieldId: 1, createdAt: -1 });
WeatherAlertSchema.index({ severity: 1, acknowledgedAt: 1 });

export const WeatherAlert = mongoose.model<IWeatherAlert>('WeatherAlert', WeatherAlertSchema);
