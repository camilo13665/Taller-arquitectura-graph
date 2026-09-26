import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import fs from 'fs';
import path from 'path';

import { resolvers } from './graphql/resolvers';
import { createContext } from './graphql/context';

async function main() {
  const typeDefs = fs.readFileSync(path.join(__dirname, 'graphql', 'schema.graphql'), 'utf-8');
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const app = express();
  const httpServer = http.createServer(app);

  // --- WebSocket server para GraphQL Subscriptions ---
  const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
  const serverCleanup = useServer({ schema, context: () => createContext() }, wsServer);

  const apolloServer = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await apolloServer.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    bodyParser.json(),
    expressMiddleware(apolloServer, {
      context: async () => createContext(),
    })
  );

  const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Afirmative Pill GraphQL API lista en http://localhost:${PORT}/graphql`);
    console.log(`🔌 Subscriptions vía WebSocket en ws://localhost:${PORT}/graphql`);
    console.log(`ℹ️  Zero-REST: este es el único endpoint expuesto por el backend.`);
  });
}

main().catch((err) => {
  console.error('Error iniciando el servidor:', err);
  process.exit(1);
});
