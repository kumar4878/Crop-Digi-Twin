import mongoose, { Schema, Document } from 'mongoose';

export interface IPestIncident extends Document {
  fieldId: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  images: Array<{ url: string; thumbnailUrl: string; uploadedAt: Date }>;
  identification: {
    pestId: string;
    pestName: string;
    scientificName: string;
    confidence: number;
    method: 'AI' | 'MANUAL' | 'AGRONOMIST';
    identifiedBy?: mongoose.Types.ObjectId;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedArea: number;
  symptoms: string[];
  treatment: {
    recommended: Array<{
      productName: string; activeIngredient: string;
      dosage: string; applicationMethod: string; safetyPeriod: number;
    }>;
    applied?: Array<{
      productName: string; appliedAt: Date;
      appliedBy: mongoose.Types.ObjectId; effectiveness: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
  };
  status: 'REPORTED' | 'UNDER_TREATMENT' | 'RESOLVED' | 'ESCALATED';
  reviewStatus: 'PENDING' | 'APPROVED' | 'NEEDS_EXPERT';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

const PestIncidentSchema = new Schema<IPestIncident>(
  {
    fieldId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    images: [{ url: String, thumbnailUrl: String, uploadedAt: { type: Date, default: Date.now } }],
    identification: {
      pestId: String,
      pestName: String,
      scientificName: String,
      confidence: Number,
      method: { type: String, enum: ['AI', 'MANUAL', 'AGRONOMIST'], default: 'AI' },
      identifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    affectedArea: { type: Number, default: 0 },
    symptoms: [String],
    treatment: {
      recommended: [{
        productName: String, activeIngredient: String,
        dosage: String, applicationMethod: String, safetyPeriod: Number,
      }],
      applied: [{
        productName: String, appliedAt: Date,
        appliedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        effectiveness: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
      }],
    },
    status: { type: String, enum: ['REPORTED', 'UNDER_TREATMENT', 'RESOLVED', 'ESCALATED'], default: 'REPORTED' },
    reviewStatus: { type: String, enum: ['PENDING', 'APPROVED', 'NEEDS_EXPERT'], default: 'PENDING' },
    notes: { type: String, default: '' },
    resolvedAt: Date,
  },
  { timestamps: true }
);

PestIncidentSchema.index({ fieldId: 1, createdAt: -1 });
PestIncidentSchema.index({ 'identification.pestId': 1 });
PestIncidentSchema.index({ status: 1, reviewStatus: 1 });

export const PestIncident = mongoose.model<IPestIncident>('PestIncident', PestIncidentSchema);
