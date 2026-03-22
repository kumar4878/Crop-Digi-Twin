import mongoose from 'mongoose';
import { config } from '../config/env';

export async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('[db]: MongoDB connected successfully');
  } catch (error) {
    console.error('[db]: MongoDB connection error:', error);
    process.exit(1);
  }
}

mongoose.connection.on('error', (err) => {
  console.error('[db]: MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('[db]: MongoDB disconnected');
});
