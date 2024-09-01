import { User } from '../models/User.js';
import { OrganizationModel } from '../models/Organization.js';
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
        const users = await User.find({ isApproved: false, Organization: organizationId });
        return users;
      } catch (error) {
        console.error('Error fetching unapproved users:', error);
        throw new Error('Failed to fetch unapproved users');
      }
    },

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

    register: async (_, { OrganizationCode, Name, Email, MobileNumber, Password, ProfilePicture }) => {
      try {
        let organizationSearch = await OrganizationModel.findOne({ OrganizationCode });
        const organizationCode = organizationSearch._id;
        const hashedPassword = await bcrypt.hash(Password, 10);
        const user = new User({
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
        const user = await User.findById(userId);
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
        const user = await User.findById(userId);
        if (!user) {
          throw new Error('User not found');
        }
        await user.remove();
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
