import { Queue } from 'bullmq';
import { env } from '../config/env';
const redisUrl = new URL(env.REDIS_URL);

const bullMQConnection = {
  connection: {
    host: redisUrl.hostname,
    port: Number(redisUrl.port) || 6379,
    password: redisUrl.password,
    username: redisUrl.username || 'default',
    tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
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
