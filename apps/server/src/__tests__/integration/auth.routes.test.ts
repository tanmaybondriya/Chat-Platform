import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { User } from '../../modules/auth/auth.model';

// ─── Setup + Teardown ─────────────────────────────────────

beforeAll(async () => {
  // Connect to a separate test database
  await mongoose.connect(
    process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/chat-platform-test',
  );
});

afterAll(async () => {
  // Clean up and disconnect
  await User.deleteMany({});
  await mongoose.disconnect();
});

afterEach(async () => {
  // Clear users between tests
  await User.deleteMany({});
});

// ─── Test Suite ───────────────────────────────────────────

describe('Auth Routes Integration', () => {
  // ── POST /api/auth/register ──────────────────────────────

  describe('POST /api/auth/register', () => {
    const validUser = {
      username: 'testuser',
      email: 'test@gmail.com',
      password: 'password123',
    };

    it('should register a user and return 201 with accessToken', async () => {
      const res = await request(app).post('/api/auth/register').send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data.user.password).toBeUndefined(); // Never expose password
    });

    it('should return 409 when email is already registered', async () => {
      // Register first time
      await request(app).post('/api/auth/register').send(validUser);

      // Register again with same email
      const res = await request(app).post('/api/auth/register').send(validUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should set refreshToken as httpOnly cookie', async () => {
      const res = await request(app).post('/api/auth/register').send(validUser);

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('refreshToken'))).toBe(true);
      expect(cookies.some((c: string) => c.includes('HttpOnly'))).toBe(true);
    });
  });

  // ── POST /api/auth/login ─────────────────────────────────

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a user before each login test
      await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@gmail.com',
        password: 'password123',
      });
    });

    it('should login successfully and return accessToken', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@gmail.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@gmail.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' });

      expect(res.status).toBe(401);
    });

    it('should return same error for wrong email and wrong password', async () => {
      const wrongEmail = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' });

      const wrongPassword = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@gmail.com', password: 'wrongpassword' });

      // Same message — prevents user enumeration
      expect(wrongEmail.body.message).toBe(wrongPassword.body.message);
    });
  });

  // ── GET /api/auth/me ─────────────────────────────────────

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      // Register and get token
      const registerRes = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@gmail.com',
        password: 'password123',
      });

      const { accessToken } = registerRes.body.data;

      // Use token to get current user
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('test@gmail.com');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(res.status).toBe(401);
    });
  });
});
