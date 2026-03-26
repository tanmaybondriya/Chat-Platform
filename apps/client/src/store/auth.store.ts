interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
}
let accessToken: string | null = null;
let user: AuthUser | null = null;

export const authStore = {
  getToken: (): string | null => accessToken,
  getUser: (): AuthUser | null => user,

  setAuthenticated: (token: string, nextUser: AuthUser): void => {
    accessToken = token;
    user = nextUser;
  },

  setToken: (token: string): void => {
    accessToken = token;
  },

  clearAuth: (): void => {
    accessToken = null;
    user = null;
  },
};
