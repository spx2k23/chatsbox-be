import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    Name: { 
        type: String,
        required: true,
        unique: false
    },
    Email: {
        type: String,
        required: true,
        unique: true
    },
    MobileNumber: { 
        type: Number,
        required: true,
        unique: true
    },
    Password: {
        type: String,
        required: true
    },
    ProfilePicture: {
        type: String,
        required: false
    },
    Organization: {
        type: String,
        required: true
    },
    SuperAdmin: {
        type: Boolean,
        required: false,
        default: false
    },
    FriendRequestSend: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          }
    ],
    FriendRequestReceived: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          }
    ],
    Friends: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          }
    ],
    isApproved: {
        type: Boolean,
        required: false,
        default: false
    }
},

    { timestamps: true }

);

export const UserModel = mongoose.model('User', UserSchema);
