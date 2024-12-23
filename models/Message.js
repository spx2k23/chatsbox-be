import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    Sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    Receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    Content: {
      type: String,
      required: true,
    },
    MessageType: {
      type: String,
      enum: ['text', 'image', 'video', 'document', 'audio'],
      default: 'text',
    },
    DeliveryStatus: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    ReadAt: {
      type: Date,
      default: null,
    },
    IsDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const MessageModel = mongoose.model('Message', MessageSchema);
