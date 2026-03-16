import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chat.api';

export const useRooms = () => {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: chatApi.getRooms,
    staleTime: 30 * 1000,
  });
};

export const useMessages = (roomId: string | null) => {
  return useQuery({
    queryKey: ['messages', roomId],
    queryFn: () => chatApi.getMessages(roomId!),
    enabled: !!roomId, //only fetch when roomId exists
    staleTime: 0, //always consider stale-real-time data
  });
};

export const useJoinRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.joinRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatApi.createRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};
