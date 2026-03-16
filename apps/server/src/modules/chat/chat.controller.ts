import { Response, NextFunction } from 'express';
import { ChatService } from './chat.service';
import { AuthRequest } from '../../shared/types/auth.types';
import { APIResponse } from '../../shared/utils/api-response';

export class ChatController {
  private service: ChatService;

  constructor() {
    this.service = new ChatService();
  }

  createRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, description = '', isPrivate = false } = req.body;
      const room = await this.service.createRoom({
        name,
        description,
        isPrivate,
        createdBy: req.user!.userId,
      });
      res.status(201).json(new APIResponse(201, 'Room created', { room }));
    } catch (error) {
      next(error);
    }
  };

  getAllRooms = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rooms = await this.service.getAllPublicRoom();
      res.status(200).json(new APIResponse(200, 'Rooms fetched', { rooms }));
    } catch (error) {
      next(error);
    }
  };

  joinRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.params.roomId as string;
      const room = await this.service.joinRoom(roomId, req.user!.userId);
      res.status(200).json(new APIResponse(200, 'Joined Room', { room }));
    } catch (error) {
      next(error);
    }
  };

  leaveRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.params.roomId as string;

      await this.service.leaveRoom(roomId, req.user!.userId);
      res.status(200).json(new APIResponse(200, 'Left Room'));
    } catch (error) {
      next(error);
    }
  };

  getMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.params.roomId as string;

      const limit = Number(req.query.limit) || 50;
      const cursor = req.query.cursor as string | undefined;

      const messages = await this.service.getRoomMessages(roomId, req.user!.userId, limit, cursor);

      res.status(200).json(new APIResponse(200, 'Messages Fetched', { messages }));
    } catch (error) {
      next(error);
    }
  };
}
