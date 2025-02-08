import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        messages: [
            {
                type: {
                    type: String,
                    required: true,
                    enum: ['text', 'image', 'video', 'document', 'audio']
                },
                content: {
                    type: String,
                    required: true
                },
                order: {
                    type: Number,
                    required: true
                }
            }
        ]
    },
    { timestamps: true }
);

export const AnnouncementModel = mongoose.model('Announcement', AnnouncementSchema);
