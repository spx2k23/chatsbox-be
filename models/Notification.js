import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["FRIEND_REQUEST", "MESSAGE"],
        required: true
    },
    message: {
        type: String
    },
    isDelivered: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
},
    { timestamps: true }
);

export const NotificationModel = mongoose.model("Notification", NotificationSchema);
