import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  mobile: string;
  email?: string;
  name: string;
  password?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CXO' | 'MANAGER' | 'AGRONOMIST' | 'TM' | 'SALES' | 'FARMER';
  avatar?: string;
  language: 'en' | 'hi' | 'te' | 'ta' | 'mr';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  emailVerified: boolean;
  mobileVerified: boolean;
  preferences: {
    notifications: { email: boolean; sms: boolean; push: boolean };
    theme: 'light' | 'dark' | 'auto';
    units: {
      temperature: 'celsius' | 'fahrenheit';
      area: 'acres' | 'hectares';
      rainfall: 'mm' | 'inches';
    };
  };
  metadata: {
    lastLoginAt?: Date;
    lastLoginIP?: string;
    loginCount: number;
    devices: Array<{ deviceId: string; deviceType: string; lastUsed: Date; fcmToken?: string }>;
  };
  otp?: { code: string; expiresAt: Date; attempts: number };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    mobile: { type: String, required: true, unique: true, index: true },
    email: { type: String, sparse: true, index: true },
    name: { type: String, required: true },
    password: { type: String },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'CXO', 'MANAGER', 'AGRONOMIST', 'TM', 'SALES', 'FARMER'],
      default: 'FARMER',
    },
    avatar: { type: String },
    language: { type: String, enum: ['en', 'hi', 'te', 'ta', 'mr'], default: 'en' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
    emailVerified: { type: Boolean, default: false },
    mobileVerified: { type: Boolean, default: false },
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
      theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
      units: {
        temperature: { type: String, enum: ['celsius', 'fahrenheit'], default: 'celsius' },
        area: { type: String, enum: ['acres', 'hectares'], default: 'acres' },
        rainfall: { type: String, enum: ['mm', 'inches'], default: 'mm' },
      },
    },
    metadata: {
      lastLoginAt: { type: Date },
      lastLoginIP: { type: String },
      loginCount: { type: Number, default: 0 },
      devices: [
        {
          deviceId: String,
          deviceType: String,
          lastUsed: Date,
          fcmToken: String,
        },
      ],
    },
    otp: {
      code: String,
      expiresAt: Date,
      attempts: { type: Number, default: 0 },
    },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ 'metadata.lastLoginAt': -1 });

export const User = mongoose.model<IUser>('User', UserSchema);
