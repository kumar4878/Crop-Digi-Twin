import mongoose, { Schema, Document } from 'mongoose';

export interface IFarm extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  address: {
    line1: string;
    line2?: string;
    village: string;
    district: string;
    state: string;
    pincode: string;
    country: string;
  };
  location: { type: 'Point'; coordinates: [number, number] };
  totalArea: number;
  ownershipType: 'OWNED' | 'LEASED' | 'SHARED';
  status: 'ACTIVE' | 'INACTIVE';
  metadata: { registrationNumber?: string; surveyNumber?: string };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const FarmSchema = new Schema<IFarm>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    address: {
      line1: { type: String, required: true },
      line2: String,
      village: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'IN' },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    totalArea: { type: Number, required: true },
    ownershipType: { type: String, enum: ['OWNED', 'LEASED', 'SHARED'], required: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    metadata: {
      registrationNumber: String,
      surveyNumber: String,
    },
    deletedAt: Date,
  },
  { timestamps: true }
);

FarmSchema.index({ location: '2dsphere' });
FarmSchema.index({ 'address.district': 1, 'address.state': 1 });
FarmSchema.index({ status: 1 });

export const Farm = mongoose.model<IFarm>('Farm', FarmSchema);
