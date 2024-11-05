import { UserModel } from '../models/User.js';
import { OrganizationModel } from '../models/Organization.js';
import { ChatModel } from '../models/Chat.js';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { isUserOnline } from '../userService.js';
import { NotificationModel } from '../models/Notification.js';

export const resolvers = {
  Query: {

    login: async (_, { Email, Password }) => {
      const user = await UserModel.findOne({ Email });
      if (!user) {
        return {
          success: false,
          message: 'User not founds',
          token: null,
          organization: null,
        };
      }
      if (user.isApproved === false) {
        return {
          success: false,
          message: 'User not approved by admin',
          token: null,
          organization: null,
        };
      }
      const isMatch = await bcrypt.compare(Password, user.Password);
      if (!isMatch) {
        return {
          success: false,
          message: 'Invalid credentials',
          token: null,
          organization: null,
        };
      }
      const token = jwt.sign({ id: user.id ,superAdmin: user.SuperAdmin}, 'secretkey', { expiresIn: '1h' });
      return {
        success: true,
        message: 'Login successful',
        token,
        organization: user.Organization,
      };
    },

    getUnapprovedUsers: async (_, { organizationId }) => {
      try {
        const users = await UserModel.find({ isApproved: false, Organization: organizationId });
        return users;
        
      } catch (error) {
        console.error('Error fetching unapproved users:', error);
        throw new Error('Failed to fetch unapproved users');
      }
    },

    getUsersInOrganization: async (_, { organizationId }, { user }) => {
      try {
        if (!user) {
          throw new Error('Missing required parameters');
        }
        const userId = user.id;
        
        const users = await UserModel.find({
          Organization: organizationId,
          isApproved: true,
          _id: { $ne: userId },
        });
    
        return users.map((otherUser) => {
          const isFriend = otherUser.Friends.some(friend => friend.equals(userId));
          const isRequestSent = otherUser.FriendRequestReceived.some(request => request.equals(userId));
          const isRequestReceived = otherUser.FriendRequestSend.some(request => request.equals(userId));
    
          return {
            id: otherUser._id.toString(),
            Name: otherUser.Name,
            Email: otherUser.Email,
            ProfilePicture: otherUser.ProfilePicture,
            isFriend,
            isRequestSent,
            isRequestReceived,
          };
        });
      } catch (error) {
        console.error('Error fetching users:', error);
        throw new Error('Failed to fetch users');
      }
    },
    
    getFriends: async (_, __, { user }) => {
      try {
        const currentUser = await UserModel.findById(user.id).populate('Friends');
        if (!currentUser) {
          throw new Error('User not found');
        }
        return currentUser.Friends;
      } catch (error) {
        console.error('Error fetching friends:', error);
        throw new Error('Failed to fetch friends');
      }
    }

  },

  Mutation: {

    registerOrganization: async (
      _,
      { OrganizationName, OrganizationCode, Name, Email, MobileNumber, Password, ProfilePicture }
    ) => {
      try {
        let organization = await OrganizationModel.findOne({ OrganizationName });
        if (organization) {
          return {
            success: false,
            message: 'Organization already exists',
          };
        }
        organization = new OrganizationModel({ OrganizationName, OrganizationCode });
        await organization.save();
        const hashedPassword = await bcrypt.hash(Password, 10);
        const user = new UserModel({
          Name,
          Email,
          MobileNumber,
          Password: hashedPassword,
          ProfilePicture,
          Organization: organization._id,
          SuperAdmin: true,
          isApproved: true,
        });
        await user.save();
        return {
          success: true,
          message: 'Organization and user created successfully',
        };
      } catch (error) {
        console.error('Error in registerOrganization:', error);
        return {
          success: false,
          message: 'Failed to create organization or user',
        };
      }
    },

    register: async (_, { OrganizationCode, Name, Email, MobileNumber, Password, ProfilePicture }) => {
      try {
        let organizationSearch = await OrganizationModel.findOne({ OrganizationCode });
        const organizationCode = organizationSearch._id;
        const hashedPassword = await bcrypt.hash(Password, 10);
        const user = new UserModel({
          Name,
          Email,
          MobileNumber,
          Password: hashedPassword,
          ProfilePicture,
          Organization: organizationCode,
          SuperAdmin: false,
          isApproved: false,
        });
        await user.save();
        return {
          success: true,
          message: 'User created successfully and send request to admin',
        };
      } catch (error) {
        console.error('Error in register:', error);
        return {
          success: false,
          message: 'Failed to create user',
        };
      }
    },

    approveUser: async (_, { userId }) => {
      try {
        const user = await UserModel.findById(userId);
        if (!user) {
          throw new Error('User not found');
        }
        user.isApproved = true;
        await user.save();
        return {
          success: true,
          message: 'User approved successfully',
        };
      } catch (error) {
        console.error('Error approving user:', error);
        return {
          success: false,
          message: 'Failed to approve user',
        };
      }
    },

    rejectUser: async (_, { userId }) => {
      try {
        const user = await UserModel.findById(userId);
        if (!user) {
          throw new Error('User not found');
        }
        await user.deleteOne();
        return {
          success: true,
          message: 'User rejected and deleted successfully',
        };
      } catch (error) {
        console.error('Error rejecting user:', error);
        return {
          success: false,
          message: 'Failed to reject user',
        };
      }
    },

    sendFriendRequest: async (_, { senderId, receiverId }, { pubsub }) => {
      try {
        const sender = await UserModel.findById(senderId);
        const receiver = await UserModel.findById(receiverId);

        const onlineStatus = isUserOnline(receiverId);

        if (!sender || !receiver) {
          return { success: false, message: 'User not found' };
        }

        if (receiver.FriendRequestReceived.includes(senderId)) {
          return { success: false, message: 'Friend request already sent' };
        }

        receiver.FriendRequestReceived.push(senderId);
        sender.FriendRequestSend.push(receiverId);

        await receiver.save();
        await sender.save();

        if (onlineStatus) {
          pubsub.publish(`FRIEND_REQUEST_SENT_${receiverId}`, { friendRequestSent: { senderId, receiverId, sender, receiver } });
        } else {
          await NotificationModel.create({
            type: 'FRIEND_REQUEST',
            senderId,
            receiverId,
            message: sender.Name+' has send you friend request',
          })
        }

        return { success: true, message: 'Friend request sent successfully' };
      } catch (error) {
        console.error('Error sending friend request:', error);
        return { success: false, message: 'Failed to send friend request' };
      }
    },

    acceptFriendRequest: async (_, { senderId, receiverId }, { pubsub }) => {
      try {
        const sender = await UserModel.findById(senderId);
        const receiver = await UserModel.findById(receiverId);

        const onlineStatus = isUserOnline(receiverId);

        if (!sender || !receiver) {
          return { success: false, message: 'User not found' };
        }

        await UserModel.updateOne({ _id: receiverId }, { $pull: { FriendRequestSend: senderId } });
        await UserModel.updateOne({ _id: senderId }, { $pull: { FriendRequestReceived: receiverId } });

        receiver.Friends.push(senderId);
        sender.Friends.push(receiverId);

        await receiver.save();
        await sender.save();

        if (onlineStatus) {
          pubsub.publish(`FRIEND_REQUEST_ACCEPT_${receiverId}`, { friendRequestAccept: { senderId, receiverId, sender, receiver } });
        } else {
          await NotificationModel.create({
            type: 'FRIEND_REQUEST_ACCEPT',
            senderId,
            receiverId,
            message: sender.Name+ ' has accepted your friend request',
          });
        }

        return { success: true, message: 'Friend request accepted successfully', sender };
      } catch (error) {
        console.error('Error sending friend request:', error);
        return { success: false, message: 'Failed to accept friend request' };
      }
    },

    rejectFriendRequest: async (_, { senderId, receiverId }, { pubsub }) => {
      try {
        const sender = await UserModel.findById(senderId);
        const receiver = await UserModel.findById(receiverId);

        if (!sender || !receiver) {
          return { success: false, message: 'User not found' };
        }
        
        await UserModel.updateOne({ _id: receiverId }, { $pull: { FriendRequestSend: senderId } });
        await UserModel.updateOne({ _id: senderId }, { $pull: { FriendRequestReceived: receiverId } });

        pubsub.publish(`FRIEND_REQUEST_REJECT_${receiverId}`, { friendRequestReject: { senderId, receiverId, sender, receiver } });

        return { success: true, message: 'Friend request rejected successfully' };
      } catch (error) {
        console.error('Error sending friend request:', error);
        return { success: false, message: 'Failed to reject friend request' };
      }
    },

    addMessage: async (_, { sender, receiver, message }) => {
      try{
        const newMessage = new ChatModel({ sender, receiver, message });
        await newMessage.save();
        return { success: true, message: 'Message saved.' };
      } catch (error) {
        return { success: false, message: 'Failed to send message.' };
      }
    },

    checkPendingNotifications: async (_, __, {userId}) => {
      try {
        const pendingNotifications = await NotificationModel.find({ receiverId: userId })
        .populate('senderId', 'Name Email ProfilePicture MobileNumber ');

        await NotificationModel.deleteMany({ receiverId: userId });

        return {success: true, pendingNotifications }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return { success: false, pendingNotifications: [] };
      }
    }

  },

  Subscription: {

    friendRequestSent: {
      subscribe: (_, { receiverId }, { pubsub }) => {
        return pubsub.asyncIterator([`FRIEND_REQUEST_SENT_${receiverId}`]);
      },
      resolve: (payload, args) => {
        return payload.friendRequestSent.receiverId === args.receiverId
          ? payload.friendRequestSent
          : null;
      },
    },

    friendRequestAccept: {
      subscribe: (_, { receiverId }, { pubsub }) => {
        return pubsub.asyncIterator([`FRIEND_REQUEST_ACCEPT_${receiverId}`]);
      },
      resolve: (payload, args) => {
        return payload.friendRequestAccept.receiverId === args.receiverId
          ? payload.friendRequestAccept
          :null;
      },
    },

    friendRequestReject: {
      subscribe: (_, { receiverId }, { pubsub }) => {
        return pubsub.asyncIterator([`FRIEND_REQUEST_REJECT_${receiverId}`]);
      },
      resolve: (payload, args) => {
        return payload.friendRequestReject.receiverId === args.receiverId
          ? payload.friendRequestReject
          :null;
      },
    }

  },
};
