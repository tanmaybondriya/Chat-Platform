import { Queue } from 'bullmq';
import { env } from '../config/env';

const bullMQConnection = {
  connection: {
    host: new URL(env.REDIS_URL).hostname,
    port: Number(new URL(env.REDIS_URL).port) || 6379,
  },
};
export interface NotificationJobData {
  type: 'new_message' | 'user_joined' | 'mention';
  messageId?: string;
  roomId: string;
  senderId: string;
  recipientIds: string[];
  content: string;
}

export const notificationQueue = new Queue<NotificationJobData>('notifications', {
  ...bullMQConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
// eslint-disable-next-line no-console
console.log('Queue connection config:', {
  host: new URL(env.REDIS_URL).hostname,
  port: Number(new URL(env.REDIS_URL).port) || 6379,
});

// eslint-disable-next-line no-console
console.log('Notification queue intitialized');
