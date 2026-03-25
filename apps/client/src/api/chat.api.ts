import { api } from './axios';

export interface Room {
  _id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  members: string[];
  createdBy: { _id: string; username: string };
}

export interface Message {
  _id: string;
  roomId: string;
  senderId: { _id: string; username: string } | string;
  content: string;
  type: 'text' | 'image' | 'file';
  createdAt: string;
}

export interface DMConversation {
  _id: string;
  participants: {
    _id: string;
    username: string;
    email: string;
    isOnline: boolean;
  }[];
  lastMessage?: Message;
  lastActivity: string;
}

export interface DMMessage {
  _id: string;
  conversationId: string;
  senderId: { _id: string; username: string } | string;
  content: string;
  createdAt: string;
}

export const chatApi = {
  getRooms: async (): Promise<Room[]> => {
    const res = await api.get('/chat/rooms');
    return res.data.data.rooms;
  },

  createRoom: async (data: { name: string; description: string }): Promise<Room> => {
    const res = await api.post('/chat/rooms', data);
    return res.data.data.room;
  },

  joinRoom: async (roomId: string): Promise<Room> => {
    const res = await api.post(`/chat/rooms/${roomId}/join`);
    return res.data.data.room;
  },

  getMessages: async (roomId: string, cursor?: string): Promise<Message[]> => {
    const res = await api.get(`/chat/rooms/${roomId}/messages`, {
      params: { cursor, limit: 50 },
    });
    return res.data.data.messages;
  },
};

export const dmApi = {
  getConversation: async (): Promise<DMConversation[]> => {
    const res = await api.get('/dm');
    return res.data.data.conversations;
  },

  getOrCreateConversation: async (userId: string): Promise<DMConversation> => {
    const res = await api.post(`/dm/${userId}`);
    return res.data.data.conversation;
  },

  getMessages: async (dmId: string, cursor?: string): Promise<DMMessage[]> => {
    const res = await api.get(`/dm/${dmId}/messages`, {
      params: { cursor, limit: 50 },
    });
    return res.data.data.messages;
  },

  searchUsers: async (query: string) => {
    const res = await api.get('/users/search', { params: { q: query } });
    return res.data.data.users;
  },
};
