import { User } from '../models/User.js';
// import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';
import { Organization } from '../models/Organization.js';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const MESSAGE_ADDED = 'MESSAGE_ADDED';

export const resolvers = {
  Query: {

    login: async (_, { Email, Password }) => {
      const user = await User.findOne({ Email });
      if (!user) {
        return {
          success: false,
          message: 'User not founds',
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

    // getChats: (_, { userId }) => {
    //   return Chat.find({ members: userId });
    // },

  },

  Mutation: {

    registerOrganization: async (
      _,
      { OrganizationName, Name, Email, MobileNumber, Password, ProfilePicture }
    ) => {
      try {
        let organization = await Organization.findOne({ OrganizationName });
        if (organization) {
          return {
            success: false,
            message: 'Organization already exists',
          };
        }
        organization = new Organization({ OrganizationName });
        await organization.save();
        const hashedPassword = await bcrypt.hash(Password, 10);
        const user = new User({
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

    register: async (_, { username, email, password }) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ username, email, password: hashedPassword });
      return user.save();
    },
    // createChat: (_, { name, members, isGroup }) => {
    //   const chat = new Chat({ name, members, isGroup });
    //   return chat.save();
    // },

    sendMessage: async (_, { chatId, senderId, content }, { pubsub }) => {
      const message = new Message({ chat: chatId, sender: senderId, content });
      const savedMessage = await message.save();

      pubsub.publish(MESSAGE_ADDED, { messageAdded: savedMessage });

      return savedMessage;
    },

  },

  Subscription: {
    messageAdded: {
      subscribe: (_, { chatId }, { pubsub }) => pubsub.asyncIterator(MESSAGE_ADDED),
    },
  },
};
