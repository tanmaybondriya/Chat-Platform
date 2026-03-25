import { Server as HTTPServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from './env';
import { redisPublisher, redisSubscriber } from './redis';
import { verifyAccessToken, isTokenBlacklisted } from '../utils/token.utils';
import { TokenPayload } from '../types/auth.types';
import { ChatRepository } from '../../modules/chat/chat.repository';
import { notificationQueue } from '../queues/notification.queue';
import { logger } from './logger';
import { DMRepository } from '../../modules/dm/dm.repository';
export interface AuthenticatedSocket extends Socket {
  user?: TokenPayload;
}

let io: SocketServer;

export const initializeSocket = async (httpServer: HTTPServer): Promise<SocketServer> => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── Redis Adapter ───────────────────────────────────
  // This is the ONE LINE that enables horizontal scaling
  // All Socket.io instances now communicate via Redis
  io.adapter(createAdapter(redisPublisher, redisSubscriber));
  logger.info('✅ Socket.io Redis adapter initialized');

  // ─── Auth Middleware ─────────────────────────────────
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
        (socket.handshake.query?.token as string)?.replace('Bearer ', '');

      if (!token) return next(new Error('Authentication token required'));

      const blacklisted = await isTokenBlacklisted(token);
      if (blacklisted) return next(new Error('Token revoked'));

      const payload = verifyAccessToken(token);
      socket.user = payload;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // ─── Connection Handler ──────────────────────────────
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected`, { userId: socket.user?.userId, socketId: socket.id });
    registerChatEvents(socket, io);

    socket.on('disconnect', () => {
      logger.info(`User disconnected`, { userId: socket.user?.userId });
    });
  });

  return io;
};

// ─── Chat Event Handlers ─────────────────────────────────
const registerChatEvents = (socket: AuthenticatedSocket, io: SocketServer): void => {
  const repo = new ChatRepository();
  const dmRepo = new DMRepository();

  // ── Join Room ────────────────────────────────────────
  socket.on('room:join', async (rawData: unknown) => {
    try {
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      const { roomId } = data as { roomId: string };
      const userId = socket.user!.userId;

      const isMember = await repo.isRoomMember(roomId, userId);
      if (!isMember) {
        socket.emit('error', { message: 'You are not a member of this room' });
        return;
      }

      await socket.join(roomId);

      socket.to(roomId).emit('room:user_joined', {
        userId,
        roomId,
        timestamp: new Date(),
      });

      socket.emit('room:joined', { roomId });
      logger.info(`User joined room`, { userId, roomId });
    } catch (error) {
      logger.error(`room:join error`, { error });
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // ── Leave Room ───────────────────────────────────────
  socket.on('room:leave', async (rawData: unknown) => {
    try {
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      const { roomId } = data as { roomId: string };

      await socket.leave(roomId);
      socket.to(roomId).emit('room:user_left', {
        userId: socket.user!.userId,
        roomId,
        timestamp: new Date(),
      });
      socket.emit('room:left', { roomId });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      socket.emit('error', { message: 'Failed to leave room' });
    }
  });

  // ── Send Message ─────────────────────────────────────
  socket.on('message:send', async (rawData: unknown) => {
    try {
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      const { roomId, content } = data as { roomId: string; content: string };
      const userId = socket.user!.userId;

      if (!content?.trim()) {
        socket.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      const isMember = await repo.isRoomMember(roomId, userId);
      if (!isMember) {
        socket.emit('error', { message: 'You are not a member of this room' });
        return;
      }

      // 1. Save to MongoDB
      const message = await repo.saveMessage({
        roomId,
        senderId: userId,
        content: content.trim(),
        type: 'text',
      });

      // 2. Broadcast via Redis adapter (works across ALL servers)
      io.to(roomId).emit('message:new', {
        _id: message._id,
        roomId,
        senderId: {
          _id: userId,
          username: socket.user!.username,
        },
        content: message.content,
        type: message.type,
        createdAt: message.createdAt,
      });

      // 3. Add notification job to BullMQ queue (non-blocking)
      await notificationQueue.add('new_message', {
        type: 'new_message',
        messageId: message._id.toString(),
        roomId,
        senderId: userId,
        recipientIds: [], // In production: fetch room members minus sender
        content: content.trim(),
      });
    } catch (error) {
      logger.error('message:send error:', { error });
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // ── Typing Indicators ────────────────────────────────
  socket.on('typing:start', (rawData: unknown) => {
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    const { roomId } = data as { roomId: string };
    socket.to(roomId).emit('typing:update', {
      userId: socket.user!.userId,
      isTyping: true,
    });
  });

  socket.on('typing:stop', (rawData: unknown) => {
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    const { roomId } = data as { roomId: string };
    socket.to(roomId).emit('typing:update', {
      userId: socket.user!.userId,
      isTyping: false,
    });
  });

  // ── Read Receipts ───────────────────────────────────
  socket.on('message:read', async (rawData: unknown) => {
    try {
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      const { messageId, roomId } = data as { messageId: string; roomId: string };

      await repo.markMessageAsRead(messageId, socket.user!.userId);
      socket.to(roomId).emit('message:read_update', {
        messageId,
        readBy: socket.user!.userId,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      socket.emit('error', { message: 'Failed to mark message as read' });
    }
  });

  socket.on('dm:send', async (rawData: unknown) => {
    try {
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      const { conversationId, content } = data as {
        conversationId: string;
        content: string;
      };
      const userId = socket.user!.userId;

      if (!content?.trim()) {
        socket.emit('error', { message: 'Message cannout be empty' });
        return;
      }

      //Verify participant

      const isParticipant = await dmRepo.isParticipant(conversationId, userId);
      if (!isParticipant) {
        socket.emit('error', { message: 'Not a participant' });
        return;
      }

      const message = await dmRepo.saveMessage({
        conversationId,
        senderId: userId,
        content: content.trim(),
      });

      //emit to both participants via theri personal rooms
      io.to(`dm:${conversationId}`).emit(`dm:new`, {
        _id: message._id,
        conversationId,
        senderId: {
          _id: userId,
          username: socket.user!.username,
        },
        content: message.content,
        createdAt: message.createdAt,
      });

      await notificationQueue.add('new_message', {
        type: 'new_message',
        messageId: message._id.toString(),
        roomId: conversationId,
        senderId: userId,
        recipientIds: [],
        content: content.trim(),
      });
    } catch (error) {
      console.error('dm:send error:', error);
      socket.emit('error', { message: 'Failed to send DM' });
    }
  });

  socket.on('dm:join', async (rawData: unknown) => {
    try {
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      const { conversationId } = data as { conversationId: string };
      const userId = socket.user!.userId;

      const isParticipant = await dmRepo.isParticipant(conversationId, userId);
      if (!isParticipant) {
        socket.emit('error', { message: 'Not a aprticipant' });
        return;
      }
      await socket.join(`dm:${conversationId}`);
      socket.emit(`dm:joined`, { conversationId });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      socket.emit('error', { message: 'Failed to join DM' });
    }
  });
};

//  ──Send Dm ───────────────────────────────────

export const getIO = (): SocketServer => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
