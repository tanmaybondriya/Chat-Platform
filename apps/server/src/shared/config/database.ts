import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';
export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('✅ MongoDB connected');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', { error });
    process.exit(1);
  }
};
