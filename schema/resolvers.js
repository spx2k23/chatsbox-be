import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { activeSubscriptions, removeSubscription } from '../server.js'
import { UserModel } from '../models/User.js';
import { MessageModel } from "../models/Message.js";
import { OrganizationModel } from '../models/Organization.js';
import { NotificationModel } from '../models/Notification.js';
import { AnnouncementModel } from "../models/Announcements.js";

export const resolvers = {
  Query: {

    login: async (_, { Email, Password }) => {      
      const user = await UserModel.findOne({ Email }).populate('Organization.OrganizationId');
      if (!user) {
        return {
          success: false,
          message: 'User not founds',
          token: null
        };
      }
      if (user.isApproved === false) {
        return {
          success: false,
          message: 'User not approved by admin',
          token: null
        };
      }
      const isMatch = await bcrypt.compare(Password, user.Password);
      if (!isMatch) {
        return {
          success: false,
          message: 'Invalid credentials',
          token: null
        };
      }
      const token = jwt.sign({ id: user.id ,superAdmin: user.SuperAdmin}, 'secretkey', { expiresIn: '7d' });
      return {
        success: true,
        message: 'Login successful',
        user,
        token
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
          Organization: {
            $elemMatch: {
              OrganizationId: organizationId,
              isApproved: true,
              removedFromOrg: false,
            },
          },
          _id: { $ne: userId },
        });
    
        return users.map((otherUser) => {
          const isFriend = otherUser.Friends.some(friend => friend.equals(userId));
          const isRequestSent = otherUser.FriendRequestReceived.some(request => request.equals(userId));
          const isRequestReceived = otherUser.FriendRequestSend.some(request => request.equals(userId));
    
          return {
            id: otherUser._id.toString(),
            FirstName: otherUser.FirstName,
            LastName: otherUser.LastName,
            Email: otherUser.Email,
            Role: otherUser.Role,
            Bio: otherUser.Bio,
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
    },

    announcements: async () => {
      try {
        const announcements = await AnnouncementModel.find().populate('createdBy');
        return announcements;
      } catch (error) {
        console.error('Error fetching announcements:', error);
        throw new Error('Failed to fetch announcements');
      }
    },

    getMessages: async (_, { senderId, receiverId }) => {
      return await MessageModel.find({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId },
        ],
        isDeleted: false,
      }).sort({ createdAt: 1 });
    },

  },

  Mutation: {

    registerOrganization: async (
      _,
      { OrganizationName, OrganizationCode, OrganizationLogo, FirstName, LastName, Email, MobileNumber, DateOfBirth, Bio, Role, Password, ProfilePicture }
    ) => {
      try {
        let organization = await OrganizationModel.findOne({ OrganizationName });
        if (organization) {
          return {
            success: false,
            message: 'Organization already exists',
          };
        }
        organization = new OrganizationModel({ OrganizationName, OrganizationCode, OrganizationLogo });
        await organization.save();
        const hashedPassword = await bcrypt.hash(Password, 10);
        const user = new UserModel({
          FirstName,
          LastName,
          Email,
          MobileNumber,
          DateOfBirth,
          Bio,
          Role,
          Password: hashedPassword,
          ProfilePicture,
          Organization: {
            OrganizationId: organization._id,
            SuperAdmin: true,
            isApproved: true,
          }
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

    register: async (_, { OrganizationCode, FirstName, LastName, Email, MobileNumber, DateOfBirth, Bio, Role, Password, ProfilePicture }) => {
      try {
        let organizationSearch = await OrganizationModel.findOne({ OrganizationCode });
        const organizationCode = organizationSearch._id;
        const hashedPassword = await bcrypt.hash(Password, 10);
        const user = new UserModel({
          FirstName,
          LastName,
          Email,
          MobileNumber,
          DateOfBirth,
          Bio,
          Role,
          Password: hashedPassword,
          ProfilePicture,
          Organization: {
            OrganizationId: organizationCode,
            SuperAdmin: true,
            isApproved: true,
          }
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

    sendFriendRequest: async (_, { friendRequestSenderId, friendRequestReceiverId }, { pubsub }) => {
      try {
        const friendRequestSender = await UserModel.findById(friendRequestSenderId);
        const friendRequestReceiver = await UserModel.findById(friendRequestReceiverId);

        if (!friendRequestSender || !friendRequestReceiver) {
          return { success: false, message: 'User not found' };
        }

        if (friendRequestReceiver.FriendRequestReceived.includes(friendRequestSenderId)) {
          return { success: false, message: 'Friend request already sent' };
        }

        friendRequestReceiver.FriendRequestReceived.push(friendRequestSenderId);
        friendRequestSender.FriendRequestSend.push(friendRequestReceiverId);

        await friendRequestReceiver.save();
        await friendRequestSender.save();

        const typeMap = activeSubscriptions.get(friendRequestReceiverId);
        const isSubscribedtoFriend = typeMap && typeMap.has("friendsUpdate") && typeMap.get("friendsUpdate").size > 0;
        
        if (isSubscribedtoFriend) {
          pubsub.publish(`FRIEND_REQUEST_UPDATES_${friendRequestReceiverId}`, { friendsUpdate: { Type: "SEND_FRIEND_REQUEST", ResponceReceiverId: friendRequestReceiverId,  FriendsUpdateReceiverId: friendRequestSenderId } });
        } else {
          const isSubscribed = typeMap && typeMap.has("notification") && typeMap.get("notification").size > 0;
          if(isSubscribed){
            pubsub.publish(`NOTIFICATION_${friendRequestReceiverId}`, { notification: { userId: friendRequestSenderId, user: friendRequestSender, type: "SEND_FRIEND_REQUEST" }});
          } else {
            await NotificationModel.create({
              type: 'FRIEND_REQUEST',
              sender: senderId,
              receiverId,
              message: friendRequestSender.Name+' has send you friend request',
            })
          }
        }

        return { success: true, message: 'Friend request sent successfully' };
      } catch (error) {
        console.error('Error sending friend request:', error);
        return { success: false, message: 'Failed to send friend request' };
      }
    },

    acceptFriendRequest: async (_, { friendRequestAccepterId, friendRequestReceiverId }, { pubsub }) => {
      try {
        const friendRequestAccepter = await UserModel.findById(friendRequestAccepterId);
        const friendRequestReceiver = await UserModel.findById(friendRequestReceiverId);

        if (!friendRequestAccepter || !friendRequestReceiver) {
          return { success: false, message: 'User not found' };
        }

        await UserModel.updateOne({ _id: friendRequestReceiverId }, { $pull: { FriendRequestSend: friendRequestAccepterId } });
        await UserModel.updateOne({ _id: friendRequestAccepterId }, { $pull: { FriendRequestReceived: friendRequestReceiverId } });

        friendRequestReceiver.Friends.push(friendRequestAccepterId);
        friendRequestAccepter.Friends.push(friendRequestReceiverId);

        await friendRequestReceiver.save();
        await friendRequestAccepter.save();

        const typeMap = activeSubscriptions.get(friendRequestReceiverId);
        const isSubscribedtoFriend = typeMap && typeMap.has("friendsUpdate") && typeMap.get("friendsUpdate").size > 0;

        if (isSubscribedtoFriend) {
          pubsub.publish(`FRIEND_REQUEST_UPDATES_${friendRequestReceiverId}`, { friendsUpdate: { Type: "ACCEPT_FRIEND_REQUEST", ResponceReceiverId: friendRequestReceiverId,  FriendsUpdateReceiverId: friendRequestAccepterId, Friend: friendRequestAccepter } });
        } else {
          const isSubscribed = typeMap && typeMap.has("notification") && typeMap.get("notification").size > 0;
          if(isSubscribed){
            pubsub.publish(`NOTIFICATION_${friendRequestReceiverId}`, { notification: { userId: friendRequestAccepterId, user: friendRequestAccepter, type: "ACCEPT_FRIEND_REQUEST" }});
          } else {
            await NotificationModel.create({
              type: 'FRIEND_REQUEST_ACCEPT',
              sender : friendRequestAccepterId,
              receiverId: friendRequestReceiverId,
              message: sender.Name + ' has accepted your friend request',
            });
          }
        }

        return { success: true, message: 'Friend request accepted successfully', user: friendRequestReceiver };
      } catch (error) {
        console.error('Error sending friend request:', error);
        return { success: false, message: 'Failed to accept friend request' };
      }
    },

    rejectFriendRequest: async (_, { friendRequestRejecterId, friendRequestReceiverId }, { pubsub }) => {
      try {
        const friendRequestRejecter = await UserModel.findById(friendRequestRejecterId);
        const friendRequestReceiver = await UserModel.findById(friendRequestReceiverId);

        if (!friendRequestRejecter || !friendRequestReceiver) {
          return { success: false, message: 'User not found' };
        }
        
        await UserModel.updateOne({ _id: friendRequestReceiverId }, { $pull: { FriendRequestSend: friendRequestRejecterId } });
        await UserModel.updateOne({ _id: friendRequestRejecterId }, { $pull: { FriendRequestReceived: friendRequestReceiverId } });

        pubsub.publish(`FRIEND_REQUEST_UPDATES_${friendRequestReceiverId}`, { friendsUpdate: { Type: "REJECT_FRIEND_REQUEST", ResponceReceiverId: friendRequestReceiverId, FriendsUpdateReceiverId: friendRequestRejecterId } });

        return { success: true, message: 'Friend request rejected successfully' };
      } catch (error) {
        console.error('Error sending friend request:', error);
        return { success: false, message: 'Failed to reject friend request' };
      }
    },

    checkPendingNotifications: async (_, __, {userId}) => {
      try {
        const pendingNotifications = await NotificationModel.find({ receiverId: userId })
        .populate('sender', 'id FirstName LastName Email ProfilePicture MobileNumber');

        await NotificationModel.deleteMany({ receiverId: userId });

        return {success: true, pendingNotifications }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return { success: false, pendingNotifications: [] };
      }
    },

    blockUser: async (_, __, { userId, blockedUserId }) => {
      try {
        await UserModel.findByIdAndUpdate(userId, {
          $addToSet: { isBlockedByMe: blockedUserId }
        });
        await UserModel.findByIdAndUpdate(blockedUserId, {
          $addToSet: { isBlockedBy: userId }
        });
        return {
          success: true,
          message: "User successfully blocked.",
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
        };
      }
    },

    createAnnouncement: async (_, __, { input }) => {
      try {
        const { createdBy, messages } = input;

        if (!mongoose.Types.ObjectId.isValid(createdBy)) {
          throw new Error('Invalid createdBy ID');
        }

        const newAnnouncement = await AnnouncementModel.create({
          createdBy,
          messages,
        });

        await newAnnouncement.populate('createdBy');

        return { success: true, message: 'Announcement added successfully' };
      } catch (error) {
        console.error('Error creating announcement:', error);
        throw new Error('Failed to create announcement');
      }
    },

    sendMessage: async (_, { senderId, receiverId, content, messageType }) => {
      const newMessage = new MessageModel({
        Sender: senderId,
        Receiver: receiverId,
        Content: content,
        MessageType: messageType,
      });
      const savedMessage = await newMessage.save();

      pubsub.publish(`MESSAGE_ADDED_${receiverId}`, { newMessage: savedMessage });

      return savedMessage;
    },

    updateMessageStatus: async (_, { messageId, deliveryStatus }) => {
      const updatedMessage = await MessageModel.findByIdAndUpdate(
        messageId,
        { DeliveryStatus: deliveryStatus },
        { new: true }
      );
      return updatedMessage;
    },

    markAsRead: async (_, { messageId }) => {
      const updatedMessage = await MessageModel.findByIdAndUpdate(
        messageId,
        { ReadAt: new Date(), DeliveryStatus: 'read' },
        { new: true }
      );
      return updatedMessage;
    },

  },

  Subscription: {

    friendsUpdate: {
      subscribe: (_, { userId }, { pubsub, connection }) => {

        if (!pubsub) {
          throw new Error("PubSub instance is undefined.");
        }
    
        if (!activeSubscriptions.has(userId)) {
          activeSubscriptions.set(userId, new Map());
        }
        const typeMap = activeSubscriptions.get(userId);
        if (!typeMap.has("friendsUpdate")) {
          typeMap.set("friendsUpdate", new Set());
        }
        const connections = typeMap.get("friendsUpdate");
        connections.add(connection);

        console.log("Active subscriptions:", activeSubscriptions);
        const asyncIterator = pubsub.asyncIterator([`FRIEND_REQUEST_UPDATES_${userId}`]);
        asyncIterator.return = () => {
          removeSubscription(userId,"friendsUpdate",connection);
          return Promise.resolve({value: undefined, done:true});
        };
        return asyncIterator;
      },
      resolve: (payload, args) => {
        return payload.friendsUpdate.ResponceReceiverId === args.userId
          ? payload.friendsUpdate
          : null;
      },
    },

    newMessage: {
      subscribe: (_, { receiverId }) =>
        pubsub.asyncIterator([`MESSAGE_ADDED_${receiverId}`]).filter(
          (payload) => payload.newMessage.receiver.toString() === receiverId
        ),
    },

    notification : {
      subscribe: (_, { userId }, { pubsub, connection }) => {
        if (!activeSubscriptions.has(userId)) {
          activeSubscriptions.set(userId, new Map());
        }
        const typeMap = activeSubscriptions.get(userId);
        if (!typeMap.has("notification")) {
          typeMap.set("notification", new Set());
        }
        const connections = typeMap.get("notification");
        connections.add(connection);

        console.log("Active subscriptions:", activeSubscriptions);
        return pubsub.asyncIterator([`NOTIFICATION_${userId}`]);
      },
      resolve: (payload, args) => {
        return payload.notification.userId === args.userId
          ? payload.notification
          : null;
      },
    },

  },
};
