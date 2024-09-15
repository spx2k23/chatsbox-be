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

  type Message {
    id: ID!
    Content: String!
    Sender: User!
    Receiver: User!
    CreatedAt: String!
  }

  type Grop {
    id: ID!
    GropName: String!
    Image: String!
    Admin: [User!]!
    CreatedAt: String!
  }

  type GropMessage {
    id: ID!
    Content: String!
    Sender: User!
    GropId: Grop!
    CreatedAt: String!
  }

  type MutationResponse {
    success: Boolean!
    message: String!
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
    sendMessage(chatId: ID!, senderId: ID!, content: String!): Message!
    approveUser(userId: ID!): MutationResponse!
    rejectUser(userId: ID!): MutationResponse!
    sendFriendRequest(senderId: ID!, receiverId: ID!): MutationResponse!
  }

  type Subscription {
    messageAdded(chatId: ID!): Message!
    friendRequestSent(receiverId: ID!): FriendRequestPayload!
  }
`;
