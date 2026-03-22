import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'PEST_ALERT' | 'WEATHER_ALERT' | 'STAGE_CHANGE' | 'IRRIGATION_DUE' | 'HARVEST_READY' | 'ADVISORY' | 'SYSTEM';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  data: Record<string, any>;
  channels: { inApp: boolean; push: boolean; sms: boolean; email: boolean };
  status: 'PENDING' | 'SENT' | 'FAILED';
  readAt?: Date;
  actionUrl?: string;
  createdAt: Date;
  expiresAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['PEST_ALERT', 'WEATHER_ALERT', 'STAGE_CHANGE', 'IRRIGATION_DUE', 'HARVEST_READY', 'ADVISORY', 'SYSTEM'],
      required: true,
    },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    channels: {
      inApp: { type: Boolean, default: true },
      push: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
    },
    status: { type: String, enum: ['PENDING', 'SENT', 'FAILED'], default: 'PENDING' },
    readAt: Date,
    actionUrl: String,
    expiresAt: Date,
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ status: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
