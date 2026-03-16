import { AuthService } from '../../modules/auth/auth.service';
import { AuthRepository } from '../../modules/auth/auth.repository';
import { mockAuthRepository, mockUser } from '../mocks/auth.repository.mock';
import { APIError } from '../../shared/utils/api-error';
import { blacklistToken } from '../../shared/utils/token.utils';

//Mock dependencies
jest.mock('../../modules/auth/auth.repository');

jest.mock('../../shared/utils/token.utils', () => ({
  generateTokens: jest.fn().mockReturnValue({
    accessToken: 'mock_access_token',
    refreshToken: 'mock_refresh_token',
  }),
  verifyRefreshToken: jest.fn(),
  blacklistToken: jest.fn(),
  isTokenBlacklisted: jest.fn(),
}));

//Test Suite

describe('AUuthService', () => {
  let authService: AuthService;

  beforeAll(() => {
    //replace Authrepository methods with our mocks
    (AuthRepository as jest.Mock).mockImplementation(() => mockAuthRepository);
    authService = new AuthService();
  });

  //register()

  describe('register()', () => {
    const registerData = {
      username: 'testuser',
      email: 'test@gmail.com',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null); //email not taken
      mockAuthRepository.findByUsername.mockResolvedValue(null); //username not taken
      mockAuthRepository.create.mockResolvedValue(mockUser); //email not taken

      const result = await authService.register(registerData);

      //Assert
      expect(result.user.email).toBe('test@gmail.com');
      expect(result.user.username).toBe('testuser');
      expect(result.tokens.accessToken).toBe('mock_access_token');
      expect(mockAuthRepository.create).toHaveBeenCalledWith(registerData);
    });

    it('should throw CONFLICT when email is already taken', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.register(registerData)).rejects.toThrow('Email already in use');

      //Verify create was never called
      expect(mockAuthRepository.create).not.toHaveBeenCalled();
    });

    it('should throw CONFLICT when username is already taken', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockAuthRepository.findByUsername.mockResolvedValue(mockUser);

      await expect(authService.register(registerData)).rejects.toThrow('Username already taken');
    });

    it('should throw APIError with status 409 for duplicate email', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(mockUser);

      try {
        await authService.register(registerData);
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).statusCode).toBe(409);
      }
    });
  });

  // Login

  describe('login()', () => {
    const loginData = {
      email: 'test@gmail.com',
      password: 'password123',
    };

    it('should login successfully with correct credentials', async () => {
      //Arrange
      mockAuthRepository.findByEmail.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(true);

      const result = await authService.login(loginData);
      expect(result.user.email).toBe('test@gmail.com');
      expect(result.tokens.accessToken).toBe('mock_access_token');
    });

    it('should throw UNAUTHORIZED when user does not exist', async () => {
      //arrange-user not found
      mockAuthRepository.findByEmail.mockResolvedValue(null);

      //acts+assert
      await expect(authService.login(loginData)).rejects.toThrow('Invalid Email or Password');
    });

    it('should use same error message for wrong email and wrong password', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(false);

      await expect(authService.login(loginData)).rejects.toThrow('Invalid Email or Password');
    });

    it('should use same error message for wrong email and wrong password', async () => {
      //security test
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      let errorMessage1 = '';
      try {
        await authService.login(loginData);
      } catch (e) {
        errorMessage1 = (e as Error).message;
      }

      mockAuthRepository.findByEmail.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(false);
      let errorMessage2 = '';
      try {
        await authService.login(loginData);
      } catch (e) {
        errorMessage2 = (e as Error).message;
      }

      //Both errros must be identical-prevents enumeration attacks
      expect(errorMessage1).toBe(errorMessage2);
    });

    it('should throw APIError with status 401', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);

      try {
        await authService.login(loginData);
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).statusCode).toBe(401);
      }
    });
  });

  describe('Logout()', () => {
    it('should blacklist the refresh token on logout', async () => {
      await authService.logout('mock_refresh_token');

      expect(blacklistToken).toHaveBeenCalledWith('mock_refresh_token', 7 * 24 * 60 * 60);
    });
  });
});
