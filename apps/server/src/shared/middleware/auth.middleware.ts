import { Response, NextFunction } from 'express';
import { verifyAccessToken, isTokenBlacklisted } from '../utils/token.utils';
import { AuthRequest } from '../types/auth.types';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }
    const token = authHeader.split(' ')[1];
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      res.status(401).json({ message: 'Token revoked' });
      return;
    }

    const payload = verifyAccessToken(token);

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'invalid or expired token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }
    next();
  };
};
