import app from './app';
import http from 'http';
import { env } from './shared/config/env';
import { connectDatabase } from './shared/config/database';
import './shared/config/redis';
import { initializeSocket } from './shared/config/socket';
import { redis } from './shared/config/redis';
import './shared/queues/notification.worker';
import { logger } from './shared/config/logger';

const startServer = async (): Promise<void> => {
  await connectDatabase();

  await redis.connect();

  const httpServer = http.createServer(app);

  await initializeSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 Server running`, { port: env.PORT, environment: env.NODE_ENV });
  });
};

startServer().catch((error) => {
  logger.error(`Failed to start server:`, { error });
  process.exit(1);
});
