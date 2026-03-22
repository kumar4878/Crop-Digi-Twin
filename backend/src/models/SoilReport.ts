import mongoose, { Schema, Document } from 'mongoose';

export interface ISoilReport extends Document {
  fieldId: mongoose.Types.ObjectId;
  reportDate: Date;
  testingLab: string;
  reportFile?: string;
  results: {
    ph: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    organicCarbon?: number;
    electricalConductivity?: number;
    micronutrients?: {
      zinc?: number; boron?: number; iron?: number;
      manganese?: number; copper?: number; sulphur?: number;
    };
  };
  interpretation: {
    npkRating: 'DEFICIENT' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCESSIVE';
    phRating: 'ACIDIC' | 'SLIGHTLY_ACIDIC' | 'NEUTRAL' | 'SLIGHTLY_ALKALINE' | 'ALKALINE';
    overallScore: number;
  };
  recommendations: {
    fertilizers: Array<{
      name: string; quantity: number; applicationStage: string; notes: string;
    }>;
    amendments: Array<{
      type: 'LIME' | 'GYPSUM' | 'ORGANIC_MATTER';
      quantity: number; reason: string;
    }>;
  };
  createdBy: mongoose.Types.ObjectId;
  verifiedBy?: mongoose.Types.ObjectId;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

const SoilReportSchema = new Schema<ISoilReport>(
  {
    fieldId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
    reportDate: { type: Date, required: true },
    testingLab: { type: String, required: true },
    reportFile: String,
    results: {
      ph: { type: Number, required: true },
      nitrogen: { type: Number, required: true },
      phosphorus: { type: Number, required: true },
      potassium: { type: Number, required: true },
      organicCarbon: Number,
      electricalConductivity: Number,
      micronutrients: {
        zinc: Number, boron: Number, iron: Number,
        manganese: Number, copper: Number, sulphur: Number,
      },
    },
    interpretation: {
      npkRating: { type: String, enum: ['DEFICIENT', 'LOW', 'MEDIUM', 'HIGH', 'EXCESSIVE'] },
      phRating: { type: String, enum: ['ACIDIC', 'SLIGHTLY_ACIDIC', 'NEUTRAL', 'SLIGHTLY_ALKALINE', 'ALKALINE'] },
      overallScore: Number,
    },
    recommendations: {
      fertilizers: [{ name: String, quantity: Number, applicationStage: String, notes: String }],
      amendments: [{ type: { type: String, enum: ['LIME', 'GYPSUM', 'ORGANIC_MATTER'] }, quantity: Number, reason: String }],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
  },
  { timestamps: true }
);

SoilReportSchema.index({ fieldId: 1, reportDate: -1 });
SoilReportSchema.index({ status: 1 });

export const SoilReport = mongoose.model<ISoilReport>('SoilReport', SoilReportSchema);
