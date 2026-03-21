import { Worker, Job } from 'bullmq';
import { env } from '../config/env';
import { NotificationJobData } from './notification.queue';
import { logger } from '../config/logger';

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

const processNotification = async (job: Job<NotificationJobData>): Promise<void> => {
  const { type } = job.data;

  logger.info(`Processing job`, { jobId: job.id, type });

  switch (type) {
    case 'new_message':
      await handleNewMessageNotification(job.data);
      break;
    case 'user_joined':
      await handleUserJoinedNotification(job.data);
      break;
    case 'mention':
      await handleMentionNotification(job.data);
      break;
    default:
      logger.warn(`Unkown job type: ${type}`);
  }
};

const handleNewMessageNotification = async (data: NotificationJobData): Promise<void> => {
  logger.info(`Sending notification to${data.recipientIds.length} users`);
  logger.info(`Room : ${data.roomId}`);
  logger.info(`Content preview: ${data.content?.substring(0, 50)}`);

  await new Promise((resolve) => setTimeout(resolve, 100));
  logger.info(`Notifications sent`, { messageId: data.messageId });
};

const handleUserJoinedNotification = async (data: NotificationJobData): Promise<void> => {
  logger.info(`User ${data.senderId} joined room ${data.roomId}`);
};

const handleMentionNotification = async (data: NotificationJobData): Promise<void> => {
  logger.info(`Mention notification for ${data.recipientIds.length} users`);
};
//worker Instance

export const notificationWorker = new Worker<NotificationJobData>(
  'notifications',
  processNotification,
  {
    ...bullMQConnection,
    concurrency: 5,
  },
);
logger.info('worker connectection config', {
  host: new URL(env.REDIS_URL).hostname,
  port: Number(new URL(env.REDIS_URL).port) || 6379,
});

notificationWorker.on('ready', () => {
  logger.info('✅ Worker is ready and listening for jobs');
});

// Add this — catches silent connection failures
notificationWorker.on('error', (error) => {
  logger.error('❌ Worker error:', error);
});

notificationWorker.on('completed', (job) => {
  logger.info(`Job completed`, { jobId: job.id });
});
notificationWorker
  .waitUntilReady()
  .then(() => logger.info('✅ Worker connected to Redis successfully'))
  .catch((err) => logger.error('❌ Worker failed to connect to Redis:', err));
notificationWorker.on('failed', (job, error) => {
  logger.error(`Job failed`, { jobId: job?.id, error: error.message });
});

notificationWorker.on('error', (error) => {
  logger.error(`Worker error:`, error);
});

logger.info('Notification worker started');
logger.info('Redis host:', redisUrl.hostname);
