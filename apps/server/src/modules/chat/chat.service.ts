import { ChatRepository } from './chat.repository';
import { APIError } from '../../shared/utils/api-error';
import { IRoom, IMessage } from './chat.model';

export class ChatService {
  private repository: ChatRepository;

  constructor() {
    this.repository = new ChatRepository();
  }

  async createRoom(data: {
    name: string;
    description: string;
    isPrivate: boolean;
    createdBy: string;
  }): Promise<IRoom> {
    const existing = await this.repository.findRoomByName(data.name);
    if (existing) {
      throw APIError.conflict('Room name already taken');
    }
    return this.repository.createRoom(data);
  }

  async joinRoom(roomId: string, userId: string): Promise<IRoom> {
    const room = await this.repository.findRoomById(roomId);
    if (!room) {
      throw APIError.notFound('Room not found');
    }
    if (room.isPrivate) {
      throw APIError.forbidden('this is a private room');
    }
    await this.repository.addMemberToRoom(roomId, userId);
    return room;
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const room = await this.repository.findRoomById(roomId);
    if (!room) {
      throw APIError.notFound('Room not found');
    }
    await this.repository.removeMemberFromRoom(roomId, userId);
  }

  async getRoomMessages(
    roomId: string,
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<IMessage[]> {
    const isMember = await this.repository.isRoomMember(roomId, userId);
    if (!isMember) {
      throw APIError.forbidden('You are not a member of this room');
    }
    return this.repository.getMessagesByRoom(roomId, limit, cursor);
  }

  async getAllPublicRoom(): Promise<IRoom[]> {
    return this.repository.getAllPublicRooms();
  }
}
