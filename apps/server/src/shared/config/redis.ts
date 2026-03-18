import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';
const createRedisClient = (name: string): Redis => {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
  });

  client.on('connect', () => logger.info(`Redis connected [${name}]`));
  client.on('error', (err) => logger.error(`Redis error [${name}]`, { error: err.message }));

  return client;
};

export const redis = createRedisClient('main');
export const redisPublisher = createRedisClient('publisher');
export const redisSubscriber = createRedisClient('subscriber');
export const redisBullMQ = createRedisClient('bullmq');
