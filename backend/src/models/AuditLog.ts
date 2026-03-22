import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  resource: string;
  resourceId: mongoose.Types.ObjectId;
  changes?: { before: Record<string, any>; after: Record<string, any> };
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['CREATE', 'READ', 'UPDATE', 'DELETE'], required: true },
  resource: { type: String, required: true },
  resourceId: { type: Schema.Types.ObjectId, required: true },
  changes: {
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
  },
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now },
});

AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

// --- SAP Sync Log ---

export interface ISAPSyncLog extends Document {
  entity: 'CROPS' | 'PRODUCTS' | 'REGIONS' | 'PRICING' | 'ACREAGE' | 'YIELD_FORECAST';
  direction: 'INBOUND' | 'OUTBOUND';
  recordCount: number;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  error?: string;
  retryCount: number;
  timestamp: Date;
}

const SAPSyncLogSchema = new Schema<ISAPSyncLog>({
  entity: { type: String, enum: ['CROPS', 'PRODUCTS', 'REGIONS', 'PRICING', 'ACREAGE', 'YIELD_FORECAST'], required: true },
  direction: { type: String, enum: ['INBOUND', 'OUTBOUND'], required: true },
  recordCount: { type: Number, default: 0 },
  status: { type: String, enum: ['SUCCESS', 'FAILED', 'PARTIAL'], required: true },
  error: String,
  retryCount: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
});

SAPSyncLogSchema.index({ entity: 1, timestamp: -1 });
SAPSyncLogSchema.index({ status: 1 });

export const SAPSyncLog = mongoose.model<ISAPSyncLog>('SAPSyncLog', SAPSyncLogSchema);
