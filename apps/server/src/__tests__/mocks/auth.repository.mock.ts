export const mockAuthRepository = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
  updateOnlineStatus: jest.fn(),
};

export const mockUser = {
  _id: { toString: () => '69ac902a2de98bbb0e3e59e0' },
  username: 'testuser',
  email: 'test@gmail.com',
  password: 'hashedpassword',
  role: 'user' as const,
  isOnline: false,
  comparePassword: jest.fn(),
};
