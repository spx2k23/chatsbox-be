import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Organization {
    id: ID!
    OrganizationName: String!
    OrganizationCode: String!
  }

  type User {
    id: ID!
    Name: String!
    Email: String!
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

  type Notification {
    id: ID!
    receiverId: ID!
    senderId: ID!
    type: String!
    message: String!
    isDelivered: Boolean!
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
    organization: String
  }

  type FriendRequestPayload {
    senderId: ID!
    receiverId: ID!
    sender: User!
    receiver: User!
}

  type Query {
    login(Email: String!, Password: String!): AuthResponse!
    getUnapprovedUsers(organizationId: ID!): [User]
    getUsersInOrganization(organizationId: ID!): [User!]!
    getFriends: [User!]!
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
    addMessage(sender: ID!, receiver: ID!, message: String!): MutationResponse!
  }

  type Subscription {
    friendRequestSent(receiverId: ID!): FriendRequestPayload!
    friendRequestAccept(receiverId: ID!): FriendRequestPayload!
    friendRequestReject(receiverId: ID!): FriendRequestPayload!
  }
`;
