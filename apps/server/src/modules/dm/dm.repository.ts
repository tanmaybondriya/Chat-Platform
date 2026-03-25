import mongoose from 'mongoose';
import { DMConverstation, IDMConversation, DMMessages, IDMMessage } from './dm.model';

export class DMRepository {
  //Find existing conversation between two users
  async findConversation(userId1: string, userId2: string): Promise<IDMConversation | null> {
    return DMConverstation.findOne({
      participants: {
        $all: [new mongoose.Types.ObjectId(userId1), new mongoose.Types.ObjectId(userId2)],
      },
    }).populate('participants', 'username email isOnline lastSeen');
  }

  //Create new conversation
  async createConversation(userId1: string, userId2: string): Promise<IDMConversation> {
    const conversation = new DMConverstation({
      participants: [new mongoose.Types.ObjectId(userId2), new mongoose.Types.ObjectId(userId2)],
    });
    return conversation.save();
  }

  //get all connection for a user
  async getUserConversation(userId: string): Promise<IDMConversation[]> {
    return DMConverstation.find({
      participants: new mongoose.Types.ObjectId(userId),
    })
      .populate('participants', 'username email isOnline lastSeen')
      .populate('lastMessage')
      .sort({ lastActivity: -1 })
      .lean(); //Most recent files
  }

  async findConversationById(dmId: string): Promise<IDMConversation | null> {
    return DMConverstation.findById(dmId).populate('participants', 'username email isOnline');
  }

  async saveMessage(data: {
    conversationId: string;
    senderId: string;
    content: string;
  }): Promise<IDMMessage> {
    const message = new DMMessages(data);
    const saved = await message.save();

    await DMConverstation.findByIdAndUpdate(data.conversationId, {
      lastMessage: saved._id,
      lastActivity: new Date(),
    });

    return saved;
  }

  async getMessages(
    conversationId: string,
    limit: number = 50,
    cursor?: string,
  ): Promise<IDMMessage[]> {
    const query: Record<string, unknown> = { conversationId };
    if (cursor) {
      query['_id'] = { $lt: cursor };
    }

    return DMMessages.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('senderId', 'username')
      .lean();
  }

  async isParticipant(dmId: string, userId: string): Promise<boolean> {
    const conversation = await DMConverstation.findOne({
      _id: new mongoose.Types.ObjectId(dmId),
      participants: new mongoose.Types.ObjectId(userId),
    });
    return conversation !== null;
  }
}
