import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';
const createRedisClient = (name: string): Redis => {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, //required by redis otherwise it thorws an error on startup
    lazyConnect: true,
  });

  client.on('connect ', () => logger.info(` ✅ redis connected [${name}]`));
  client.on('error', (err) => logger.error(`Redis error [${name}]`, err));

  return client;
};

export const redis = createRedisClient('main');
export const redisPublisher = createRedisClient('publisher');
export const redisSubscriber = createRedisClient('subscriber');
export const redisBullMQ = createRedisClient('bullmq');
