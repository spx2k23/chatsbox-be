import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Organization {
    id: ID!
    OrganizationName: String!
    OrganizationCode: String!
    OrganizationLogo: String!
  }

  type User {
    id: ID!
    FirstName: String!
    LastName: String!
    Email: String!
    DateOfBirth: String!
    Bio: String
    Role: String!
    MobileNumber: String!
    Password: String!
    ProfilePicture: String
    Organization: [OrganizationResponse]!
    FriendRequestSend: [User!]!
    FriendRequestReceived: [User!]!
    Friends: [User!]!
    isFriend: Boolean
    isRequestSent: Boolean
    isRequestReceived: Boolean
    isBlockedBy: [User!]!
    isBlockedByMe: [User!]!
  }

  type OrganizationResponse {
    OrganizationId: Organization!
    SuperAdmin: Boolean!
    adminRights: [String]
    isApproved: Boolean!
    removedFromOrg: Boolean!
  }

  scalar Upload

  type Announcement {
    id: ID!
    createdBy: User!
    messages: [AnnouncementMessage!]!
    createdAt: String!
  }

  type AnnouncementMessage {
    type: String!
    content: String!
    order: Int!
  }

  input MessageInput {
    type: String!
    content: String
    file: Upload
    order: Int!
  }

  type Message {
    id: ID!
    sender: User!
    receiver: User!
    content: String!
    messageType: String!
    deliveryStatus: String!
    readAt: String
    isDeleted: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Notification {
    id: ID
    userId: ID!
    user: User
    type: String!
    createdAt: String
  }

  type MutationResponse {
    success: Boolean!
    message: String!
  }

  type FriendRequestResponse {
    success: Boolean!
    message: String!
    user: User
  }

  type AuthResponse {
    success: Boolean!
    message: String!
    token: String
    user: User
  }

  type FriendsUpdateResponse{
    Type: String!
    FriendsUpdateReceiverId: ID!
    ResponceReceiverId: ID!
    Friend: User
  }

  type NotificationResponse {
    success: Boolean!
    pendingNotifications: [Notification]
  }

  type Query {
    login(Email: String!, Password: String!): AuthResponse!
    getUnapprovedUsers(organizationId: ID!): [User]
    getUsersInOrganization(organizationId: ID!): [User!]!
    getFriends: [User!]!
    announcements: [Announcement!]!
    getMessages(senderId: ID!, receiverId: ID!): [Message!]!
  }

  type Mutation {
    registerOrganization(
      FirstName: String!,
      LastName: String!,
      DateOfBirth: String!,
      Role: String!,
      Email: String!,
      MobileNumber: String!,
      Password: String!,
      ProfilePicture: String!,
      OrganizationName: String!,
      OrganizationCode: String!,
      OrganizationLogo: String!
    ): MutationResponse!
    register(
      FirstName: String!,
      LastName: String!,
      DateOfBirth: String!,
      Role: String!,
      Email: String!,
      MobileNumber: String!,
      Password: String!,
      ProfilePicture: String!,
      OrganizationCode: String!
    ): MutationResponse!
    approveUser(userId: ID!): MutationResponse!
    rejectUser(userId: ID!): MutationResponse!
    sendFriendRequest(friendRequestSenderId: ID!, friendRequestReceiverId: ID!): MutationResponse!
    acceptFriendRequest(friendRequestAccepterId: ID!, friendRequestReceiverId: ID!): FriendRequestResponse!
    rejectFriendRequest(friendRequestRejecterId: ID!, friendRequestReceiverId: ID!): MutationResponse!
    createAnnouncement(createdBy: ID!, messages: [MessageInput!]!): MutationResponse!
    checkPendingNotifications: NotificationResponse!
    sendMessage(senderId: ID!, receiverId: ID!, content: String!, messageType: String!): Message!
    updateMessageStatus(messageId: ID!, deliveryStatus: String!): Message!
    markAsRead(messageId: ID!): Message!
    blockUser(userId: ID!, blockedUserId: ID!): MutationResponse!
  }

  type Subscription {
    friendsUpdate(userId: ID!): FriendsUpdateResponse!
    notification(userId: ID!): Notification!
    newMessage(receiverId: ID!): Message!
  }
`;
