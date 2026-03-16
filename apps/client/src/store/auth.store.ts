let accessToken: string | null = null;

export const authStore = {
  getToken: (): string | null => accessToken,
  setToken: (token: string): void => {
    accessToken = token;
  },
  clearToken: (): void => {
    accessToken = null;
  },

  isAuthenticated: (): boolean => accessToken !== null,
};
