import { NextFunction, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthRequest } from '../../shared/types/auth.types';
import { APIResponse } from '../../shared/utils/api-response';

const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, //7 days in ms
};

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, email, password } = req.body;
      const result = await this.service.register({ username, email, password });

      res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
      res.status(201).json(
        new APIResponse(201, 'Registration successful', {
          user: result.user,
          accessToken: result.tokens.accessToken,
        }),
      );
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.service.login({ email, password });

      res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      res.status(200).json(
        new APIResponse(200, 'Login succesfull', {
          user: result.user,
          accessToken: result.tokens.accessToken,
        }),
      );
    } catch (error) {
      next(error);
    }
  };
  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Read refresh token from httpOnly cookie
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        res.status(401).json({ message: 'No refresh token' });
        return;
      }

      const tokens = await this.service.refresh(refreshToken);

      // Set new refresh token cookie (rotation)
      res.cookie('refreshToken', tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      res
        .status(200)
        .json(new APIResponse(200, 'Token Refreshed', { accessToken: tokens.accessToken }));
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        await this.service.logout(refreshToken);
      }

      // Clear the cookie
      res.clearCookie('refreshToken');
      res.status(200).json(new APIResponse(200, 'Logged out successfully'));
    } catch (error) {
      next(error);
    }
  };

  me = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    // req.user is populated by authenticate middleware
    try {
      res.status(200).json(new APIResponse(200, 'User Fetched', { user: req.user }));
    } catch (error) {
      next(error);
    }
  };
}
