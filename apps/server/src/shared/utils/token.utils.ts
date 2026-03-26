import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { redis } from '../config/redis';
import { TokenPayload, AuthTokens } from '../types/auth.types';

export const generateTokens = (payload: TokenPayload): AuthTokens => {
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};

export const blacklistToken = async (token: string, expiresInSeconds: number): Promise<void> => {
  await redis.setex(`blacklist:${token}`, expiresInSeconds, '1');
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const result = await redis.get(`blacklist:${token}`);
  return result !== null;
};
