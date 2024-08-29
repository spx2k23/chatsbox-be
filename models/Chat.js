import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
    name: { type: String },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isGroup: { type: Boolean, default: false },
});

export const Chat = mongoose.model('Chat', ChatSchema);
