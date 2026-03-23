import { api } from './axios';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
  accessToken: string;
}

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const res = await api.post('/auth/register', data);
    return res.data.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', data);
    return res.data.data;
  },
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
  me: async (): Promise<AuthResponse['user']> => {
    const res = await api.get('/auth/me');
    return res.data.data.user;
  },
  refresh: async (): Promise<string> => {
    const res = await api.post('/auth/refresh');
    return res.data.data.accessToken;
  },
};
