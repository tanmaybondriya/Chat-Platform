import { Response, NextFunction } from 'express';
import { DMService } from './dm.service';
import { AuthRequest } from '../../shared/types/auth.types';
import { APIResponse } from '../../shared/utils/api-response';

export class DMController {
  private service: DMService;

  constructor() {
    this.service = new DMService();
  }

  getOrCreateConversation = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const conversation = await this.service.getOrCreateConversation(
        req.user!.userId,
        req.params.userId as string,
      );
      res.status(200).json(new APIResponse(200, 'Conversation ready', { conversation }));
    } catch (error) {
      next(error);
    }
  };

  getUserConversations = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const conversations = await this.service.getUserConversations(req.user!.userId);
      res.status(200).json(new APIResponse(200, 'Conversations fetched', { conversations }));
    } catch (error) {
      next(error);
    }
  };

  getMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dmId = req.params.dmId as string;
      const limit = Number(req.query.limit) || 50;
      const cursor = req.query.cursor as string | undefined;

      const messages = await this.service.getMessages(dmId, req.user!.userId, limit, cursor);
      res.status(200).json(new APIResponse(200, 'Messages fetched', { messages }));
    } catch (error) {
      next(error);
    }
  };
}
