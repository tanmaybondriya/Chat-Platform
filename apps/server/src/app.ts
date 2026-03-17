import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './shared/config/env';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes';
import chatRoutes from './modules/chat/chat.routes';
import { errorHandler, notFoundHandler } from './shared/middleware/error.middleware';
import { requestLogger } from './shared/middleware/request-logger-middleware';
import { apiLimiter } from './shared/middleware/rate-limit-middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './shared/config/swagger';

const app: Application = express();

app.use(helmet());
app.use(requestLogger);
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [env.CLIENT_URL, 'http://localhost:3000'];
      // Allow requests with no origin (mobile apps, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use('/api', apiLimiter);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: env.NODE_ENV,
    timeStamp: new Date().toISOString(),
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
