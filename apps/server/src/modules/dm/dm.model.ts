import mongoose, { Document, Schema } from 'mongoose';
export interface IDMConversation extends Document {
  _id: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const dmConversationSchema = new Schema<IDMConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'DMMessages',
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);
//Index for fast lookup by participants
dmConversationSchema.index({ participants: 1 });

export const DMConverstation = mongoose.model<IDMConversation>(
  'DMConversation',
  dmConversationSchema,
);

// DM Message----------------------------------------

export interface IDMMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const dmMessageSchema = new Schema<IDMMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'DMConversation',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlenght: 2000,
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true },
);

export const DMMessages = mongoose.model<IDMMessage>('DMMessage', dmMessageSchema);
