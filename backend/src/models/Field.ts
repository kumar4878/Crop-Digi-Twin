import mongoose, { Schema, Document } from 'mongoose';

export interface IField extends Document {
  farmId: mongoose.Types.ObjectId;
  name: string;
  boundary: { type: 'Polygon'; coordinates: number[][][] };
  centroid: { type: 'Point'; coordinates: [number, number] };
  area: number;
  soilType: 'CLAY' | 'LOAM' | 'SANDY' | 'SILT' | 'PEATY' | 'CHALKY';
  irrigationType: 'DRIP' | 'SPRINKLER' | 'FLOOD' | 'RAINFED';
  elevation?: number;
  slope?: number;
  currentCrop?: {
    cropId: mongoose.Types.ObjectId;
    cropName: string;
    season: string;
    sowingDate: Date;
    expectedHarvestDate: Date;
    targetYield: number;
    seedVariety: string;
    status: 'ACTIVE' | 'HARVESTED' | 'FAILED';
    assignedAt: Date;
  };
  healthMetrics: {
    ndvi: number;
    stressLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    lastUpdated: Date;
  };
  villageCode?: string;
  villageName?: string;
  district?: string;
  state?: string;
  villageMatchConfidence?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'FALLOW';
  createdAt: Date;
  updatedAt: Date;
}

const FieldSchema = new Schema<IField>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    name: { type: String, required: true },
    boundary: {
      type: { type: String, enum: ['Polygon'], default: 'Polygon' },
      coordinates: { type: [[[Number]]], required: true },
    },
    centroid: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] },
    },
    area: { type: Number, required: true },
    soilType: { type: String, enum: ['CLAY', 'LOAM', 'SANDY', 'SILT', 'PEATY', 'CHALKY'], required: true },
    irrigationType: { type: String, enum: ['DRIP', 'SPRINKLER', 'FLOOD', 'RAINFED'], required: true },
    elevation: Number,
    slope: Number,
    currentCrop: {
      cropId: { type: Schema.Types.ObjectId, ref: 'CropCalendar' },
      cropName: String,
      season: String,
      sowingDate: Date,
      expectedHarvestDate: Date,
      targetYield: Number,
      seedVariety: String,
      status: { type: String, enum: ['ACTIVE', 'HARVESTED', 'FAILED'] },
      assignedAt: Date,
    },
    healthMetrics: {
      ndvi: { type: Number, default: 0 },
      stressLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
      lastUpdated: { type: Date, default: Date.now },
    },
    villageCode: String,
    villageName: String,
    district: String,
    state: String,
    villageMatchConfidence: Number,
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'FALLOW'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

FieldSchema.index({ boundary: '2dsphere' });
FieldSchema.index({ 'currentCrop.cropId': 1 });
FieldSchema.index({ 'currentCrop.season': 1, 'currentCrop.status': 1 });
FieldSchema.index({ status: 1 });

export const Field = mongoose.model<IField>('Field', FieldSchema);
