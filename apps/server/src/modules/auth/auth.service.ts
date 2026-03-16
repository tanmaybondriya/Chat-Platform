import { AuthRepository } from './auth.repository';
import {
  generateTokens,
  blacklistToken,
  isTokenBlacklisted,
  verifyRefreshToken,
} from '../../shared/utils/token.utils';
import { AuthTokens, TokenPayload } from '../../shared/types/auth.types';
import { APIError } from '../../shared/utils/api-error';

interface RegisterDTO {
  username: string;
  email: string;
  password: string;
}

interface LogindDTO {
  email: string;
  password: string;
}

interface AuthResult {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  tokens: AuthTokens;
}

export class AuthService {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  async register(data: RegisterDTO): Promise<AuthResult> {
    const existingEmail = await this.repository.findByEmail(data.email);
    if (existingEmail) {
      throw APIError.conflict('Email already in use');
    }

    const existingUsername = await this.repository.findByUsername(data.username);
    if (existingUsername) {
      throw APIError.conflict('Username already taken');
    }

    const user = await this.repository.create(data);

    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };
    const tokens = generateTokens(payload);

    return {
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      },
      tokens,
    };
  }

  async login(data: LogindDTO): Promise<AuthResult> {
    const user = await this.repository.findByEmail(data.email);
    if (!user) {
      throw APIError.unauthorized('Invalid Email or Password');
    }
    const isValid = await user.comparePassword(data.password);
    if (!isValid) {
      throw APIError.unauthorized('Invalid Email or Password');
    }

    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const tokens = generateTokens(payload);

    return {
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      },
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const blacklisted = await isTokenBlacklisted(refreshToken);
    if (blacklisted) {
      throw APIError.unauthorized('Token has been revoked');
    }
    const payload = verifyRefreshToken(refreshToken);

    const user = await this.repository.findById(payload.userId);
    if (!user) {
      throw APIError.notFound('User not found');
    }

    await blacklistToken(refreshToken, 7 * 24 * 60 * 60);

    const newPayload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };
    return generateTokens(newPayload);
  }

  async logout(refreshToken: string): Promise<void> {
    await blacklistToken(refreshToken, 7 * 24 * 60 * 60);
  }
}
