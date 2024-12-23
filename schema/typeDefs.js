import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Organization {
    id: ID!
    OrganizationName: String!
    OrganizationCode: String!
    OrganizationImage: String!
  }

  type User {
    id: ID!
    FirstName: String!
    SecondName: String!
    Email: String!
    DateOfBirth: String!
    Bio: String!
    Role: String!
    MobileNumber: String!
    Password: String!
    ProfilePicture: String!
    Organization: Organization!
    SuperAdmin: Boolean!
    FriendRequestSend: [User!]!
    FriendRequestReceived: [User!]!
    Friends: [User!]!
    isApproved: Boolean!
    isFriend: Boolean
    isRequestSent: Boolean
    isRequestReceived: Boolean
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
    id: ID!
    receiverId: ID!
    sender: User!
    type: String!
    message: String!
    createdAt: String!
  }

  type MutationResponse {
    success: Boolean!
    message: String!
  }

  type FriendRequestResponse {
    success: Boolean!
    message: String!
    sender: User!
  }

  type AuthResponse {
    success: Boolean!
    message: String!
    token: String
    user: User!
    organization: String
  }

  type FriendRequestPayload {
    senderId: ID!
    receiverId: ID!
    sender: User!
    receiver: User!
  }

  type NotificationResponse {
    success: Boolean!
    pendingNotifications: [Notification!]!
  }

  type Query {
    login(Email: String!, Password: String!): AuthResponse!
    getUnapprovedUsers(organizationId: ID!): [User]
    getUsersInOrganization(organizationId: ID!): [User!]!
    getFriends: [User!]!
    getMessages(senderId: ID!, receiverId: ID!): [Message!]!
  }

  type Mutation {
    registerOrganization(
      Name: String!,
      Email: String!,
      MobileNumber: String!,
      Password: String!,
      ProfilePicture: String!,
      OrganizationName: String!
      OrganizationCode: String!
    ): MutationResponse!
    register(
      Name: String!,
      Email: String!,
      MobileNumber: String!,
      Password: String!,
      ProfilePicture: String!,
      OrganizationCode: String!
    ): MutationResponse!
    approveUser(userId: ID!): MutationResponse!
    rejectUser(userId: ID!): MutationResponse!
    sendFriendRequest(senderId: ID!, receiverId: ID!): MutationResponse!
    acceptFriendRequest(senderId: ID!, receiverId: ID!): FriendRequestResponse!
    rejectFriendRequest(senderId: ID!, receiverId: ID!): MutationResponse!
    checkPendingNotifications: NotificationResponse!
    sendMessage(senderId: ID!, receiverId: ID!, content: String!, messageType: String!): Message!
    updateMessageStatus(messageId: ID!, deliveryStatus: String!): Message!
    markAsRead(messageId: ID!): Message!
  }

  type Subscription {
    friendRequestSent(receiverId: ID!): FriendRequestPayload!
    friendRequestAccept(receiverId: ID!): FriendRequestPayload!
    friendRequestReject(receiverId: ID!): FriendRequestPayload!
    newMessage(receiverId: ID!): Message!
    notification(receiverId: ID!): Notification!
  }
`;
