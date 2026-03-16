import { Room, IRoom, Message, IMessage } from './chat.model';
import mongoose from 'mongoose';
export class ChatRepository {
  // Room operations
  async createRoom(data: {
    name: string;
    description: string;
    isPrivate: boolean;
    createdBy: string;
  }): Promise<IRoom> {
    const room = new Room({
      ...data,
      members: [data.createdBy], //createor is first member
    });
    return room.save();
  }

  async findRoomById(roomId: string): Promise<IRoom | null> {
    return Room.findById(roomId);
  }

  async findRoomByName(name: string): Promise<IRoom | null> {
    return Room.findOne({ name });
  }
  async getAllPublicRooms(): Promise<IRoom[]> {
    return Room.find({
      isPrivate: false,
    }).populate('createdBy', 'username');
  }

  async addMemberToRoom(roomId: string, userId: string): Promise<void> {
    await Room.findByIdAndUpdate(roomId, {
      $addToSet: { members: userId }, //addToSet prevents duplicates
    });
  }

  async removeMemberFromRoom(roomId: string, userId: string): Promise<void> {
    await Room.findByIdAndUpdate(roomId, {
      $pull: {
        members: userId,
      },
    });
  }
  async isRoomMember(roomId: string, userId: string): Promise<boolean> {
    const room = await Room.findOne({
      _id: new mongoose.Types.ObjectId(roomId),
      members: new mongoose.Types.ObjectId(userId),
    });
    return room !== null;
  }

  //Message operations

  async saveMessage(data: {
    roomId: string;
    senderId: string;
    content: string;
    type?: 'text' | 'image' | 'file';
  }): Promise<IMessage> {
    const message = new Message(data);
    return message.save();
  }

  async getMessagesByRoom(
    roomId: string,
    limit: number = 50,
    cursor?: string,
  ): Promise<IMessage[]> {
    const query: Record<string, unknown> = { roomId };
    if (cursor) {
      query['_id'] = { $lt: cursor };
    }

    return Message.find(query)
      .sort({ createdAt: -1 }) //newest first
      .limit(limit)
      .populate('senderId', 'username')
      .lean(); //lean() return plain jsvobjects --faster,less memory
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { readBy: userId },
    });
  }
}
