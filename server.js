import express from "express";
import { ApolloServer } from "apollo-server-express";
import { makeExecutableSchema } from "@graphql-tools/schema"
import { createServer } from "http";
import mongoose from "mongoose";
import { PubSub } from "graphql-subscriptions";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { execute, subscribe } from "graphql";
import * as dotenv from 'dotenv';
import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./schema/resolvers.js";
import { mongoUrl } from "./Config/Config.js";

const PORT = process.env.PORT;

const app = express();
const pubsub = new PubSub();

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const databaseConnetion = () => {
  try {
    mongoose.connect(mongoUrl);
    console.log("Database Conneted Successfully");
  } catch {
    console.log(error);
    console.log("Database Connetion Failed");
  }
}

const context = ({ req }) => {
  const token = req.headers.authorization || '';

  let user = null;
  if (token) {
    try {
      user = jwt.verify(token, 'secretkey');
    } catch (e) {
      console.error('Authentication error:', e);
    }
  }
  return { user, pubsub };
};

async function startServer() {
  const server = new ApolloServer({
    schema,
    context,
  });

  await server.start();

  server.applyMiddleware({ app });

  const httpServer = createServer(app);
  
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: server.graphqlPath,
  });

  useServer({ schema, execute, subscribe, context }, wsServer);

  httpServer.listen({ port: 5000 }, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();
databaseConnetion();
