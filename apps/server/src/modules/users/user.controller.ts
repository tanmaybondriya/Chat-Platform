import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types/auth.types';
import { APIResponse } from '../../shared/utils/api-response';
import { User } from '../auth/auth.model';

export class UsersController {
  searchUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        res.status(200).json(new APIResponse(200, 'Users fetched', { users: [] }));
        return;
      }

      const users = await User.find({
        username: { $regex: query, $options: 'i' }, //search user case sensitive
        _id: { $ne: req.user!.userId }, //exclude current user
      })
        .select('username email isOnline')
        .limit(10)
        .lean();
      res.status(200).json(new APIResponse(200, 'Users fetched', { users }));
    } catch (error) {
      next(error);
    }
  };
}
