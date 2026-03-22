import mongoose, { Schema, Document } from 'mongoose';
import { CropStage } from './CropCalendar';

export interface IFieldCropStage extends Document {
  fieldId: mongoose.Types.ObjectId;
  cropId: mongoose.Types.ObjectId;
  season: string;
  sowingDate: Date;
  currentStage: CropStage;
  stageHistory: Array<{
    stage: CropStage;
    enteredAt: Date;
    exitedAt?: Date;
    durationDays: number;
    gddAccumulated?: number;
    wasAutoProgressed: boolean;
    overriddenBy?: mongoose.Types.ObjectId;
  }>;
  expectedHarvestDate: Date;
  actualHarvestDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FieldCropStageSchema = new Schema<IFieldCropStage>(
  {
    fieldId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
    cropId: { type: Schema.Types.ObjectId, ref: 'CropCalendar', required: true },
    season: { type: String, required: true },
    sowingDate: { type: Date, required: true },
    currentStage: {
      type: String,
      enum: ['SOWING', 'GERMINATION', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURATION', 'HARVEST'],
      default: 'SOWING',
    },
    stageHistory: [
      {
        stage: { type: String, enum: ['SOWING', 'GERMINATION', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURATION', 'HARVEST'] },
        enteredAt: { type: Date, default: Date.now },
        exitedAt: Date,
        durationDays: { type: Number, default: 0 },
        gddAccumulated: Number,
        wasAutoProgressed: { type: Boolean, default: false },
        overriddenBy: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    expectedHarvestDate: { type: Date, required: true },
    actualHarvestDate: Date,
  },
  { timestamps: true }
);

FieldCropStageSchema.index({ fieldId: 1, season: 1 });
FieldCropStageSchema.index({ cropId: 1, currentStage: 1 });

export const FieldCropStage = mongoose.model<IFieldCropStage>('FieldCropStage', FieldCropStageSchema);
