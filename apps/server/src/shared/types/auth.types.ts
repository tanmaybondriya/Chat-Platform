import { Request } from 'express';

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  role: 'user' | 'moderator' | 'admin';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}
