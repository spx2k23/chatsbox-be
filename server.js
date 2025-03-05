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
import jwt from 'jsonwebtoken';
import { log } from "console";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";

dotenv.config();

const PORT = process.env.PORT;

const app = express();
const pubsub = new PubSub();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(graphqlUploadExpress());

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

export const activeSubscriptions = new Map(); 

export const removeSubscription = (userId, type, connection) => {
  
  if (activeSubscriptions.has(userId)) {
    const typeMap = activeSubscriptions.get(userId);

    if (typeMap.has(type)) {
      const connections = typeMap.get(type);
      connections.delete(connection);

      if (connections.size === 0) {
        typeMap.delete(type);
      }
    }
  }
  console.log(activeSubscriptions);
  
}; 

const context = ({ req, connection }) => {
  if (connection) {
    const token = connection.context.authorization?.split(' ')[1] || '';
    let user = null;

    if (token) {
      try {
        user = jwt.verify(token, 'secretkey');
      } catch (e) {
        if (e.name === 'TokenExpiredError') {
          throw new Error("Token has expired, please log in again.");
        }
        throw new Error("Invalid token, authentication required.");
      }
    }
    return { pubsub, user, connection };
  } else {
    const token = req?.headers?.authorization?.split(' ')[1] || '';
    let user = null;

    if (token) {
      try {
        user = jwt.verify(token, 'secretkey');
      } catch (e) {
        if (e.name === 'TokenExpiredError') {
          throw new Error("Token has expired, please log in again.");
        }
        throw new Error("Invalid token, authentication required.");
      }
    }
    return { pubsub, user };
  }
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

  useServer({
    schema,
    execute,
    subscribe,
    context,
    subscriptions: {
      onConnect: (connectionParams, webSocket, context) => {
        console.log(webSocket.id);
      },
      onDisconnect: (ctx) => {
        const token = ctx.connectionParams.authorization?.split(' ')[1] || '';
        const user = jwt.verify(token, 'secretkey');
        const userId = user.id;
        if(userId && activeSubscriptions.has(userId)){
          const typeMap = activeSubscriptions.get(userId);
          typeMap.forEach((connections, type) => {
            console.log(type);
            console.log(ctx.connection);
            connections.delete(ctx.connection);
            if (connections.size === 0) {
              typeMap.delete(type);
            }
          });
          if (typeMap.size === 0) {
            activeSubscriptions.delete(userId);
          }
        }
        console.log(activeSubscriptions);
      },
    },
  }, wsServer); 

  httpServer.listen({ port: PORT }, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();
databaseConnetion();
