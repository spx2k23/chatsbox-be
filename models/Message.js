import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    Chat: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat', required: true
    },
    Sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
    Content: {
        type: String,
        required: true
    },
    CreatedAt: {
        type: Date,
        default: Date.now
    }
},

    { timestamps: true }

);

export const Message = mongoose.model('Message', MessageSchema);
