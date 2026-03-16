import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { authStore } from '../store/auth.store';
import { connectSocket, disconnectSocket } from '../socket/socket';
import { useNavigate } from 'react-router-dom';

export const useMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      authStore.setToken(data.accessToken);
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
      authStore.clearToken();
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
      authStore.setToken(data.accessToken);
      queryClient.setQueryData(['me'], data.user);
      connectSocket();
      navigate('/chat');
    },
  });
};
