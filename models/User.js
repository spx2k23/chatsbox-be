import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    FirstName: { 
        type: String,
        required: true,
        unique: false
    },
    SecondName: { 
        type: String,
        required: false,
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
    ProfilePicture: {
        type: String,
        required: false,
        default: null
    },
    DateOfBirth: {
        type: Date,
        required: true
    },
    Bio: {
        type: String,
        required: false,
        default: null
    },
    Role: {
        type: String,
        required: true,
    },
    SuperAdmin: {
        type: Boolean,
        required: false,
        default: false
    },
    Password: {
        type: String,
        required: true
    },
    Organization: [
        {
            type: String,
            required: true
        }
    ],
    isBlockedBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          }
    ],
    isBlockedByMe: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          }
    ],
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
    },
    removedFromOrg: {
        type: Boolean,
        default: false,
        required: true,
    }
},

    { timestamps: true }

);

export const UserModel = mongoose.model('User', UserSchema);
