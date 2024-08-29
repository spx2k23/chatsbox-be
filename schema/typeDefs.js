import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Organization {
    id: ID!
    OrganizationName: String!
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

  type AuthPayload {
    success: Boolean!
    message: String!
  }

  type AuthResponse {
    success: Boolean!
    message: String!
    token: String
    organization: String
  }

  type Query {
    login(Email: String!, Password: String!): AuthResponse!
  }

  type Mutation {
    registerOrganization(
      Name: String!,
      Email: String!,
      MobileNumber: String!,
      Password: String!,
      ProfilePicture: String!,
      OrganizationName: String!
    ): AuthPayload!
    register(Name: String!, email: String!, password: String!): User!
    sendMessage(chatId: ID!, senderId: ID!, content: String!): Message!
  }

  type Subscription {
    messageAdded(chatId: ID!): Message!
  }
`;

// getChats(userId: ID!): [Chat!]
// createChat(name: String!, members: [ID!]!, isGroup: Boolean!): Chat!
