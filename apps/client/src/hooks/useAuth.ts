import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { authStore } from '../store/auth.store';
import { connectSocket, disconnectSocket } from '../socket/socket';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export const useMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};
type AuthStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated';

export const useAuthBootstrap = (): AuthStatus => {
  const [status, setStatus] = useState<AuthStatus>('bootstrapping');

  useEffect(() => {
    const pathname = window.location.pathname;

    if (pathname === '/login' || pathname === '/register') {
      authStore.clearAuth();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('unauthenticated');
      return;
    }

    const bootstrap = async () => {
      try {
        const accessToken = await authApi.refresh();
        authStore.setToken(accessToken);

        const user = await authApi.me();
        authStore.setAuthenticated(accessToken, user);

        connectSocket();
        setStatus('authenticated');
      } catch {
        authStore.clearAuth();
        disconnectSocket();
        setStatus('unauthenticated');
      }
    };

    void bootstrap();
  }, []);

  return status;
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      authStore.setAuthenticated(data.accessToken, data.user);
      queryClient.setQueryData(['me'], data.user);
      connectSocket();
      navigate('/chat');
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      authStore.clearAuth();
      queryClient.clear();
      disconnectSocket();
      navigate('/login');
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      authStore.setAuthenticated(data.accessToken, data.user);
      queryClient.setQueryData(['me'], data.user);
      connectSocket();
      navigate('/chat');
    },
  });
};
