import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const HTTP_URL = import.meta.env.VITE_GRAPHQL_HTTP_URL || 'http://localhost:4000/graphql';
const WS_URL = import.meta.env.VITE_GRAPHQL_WS_URL || 'ws://localhost:4000/graphql';

// Todas las queries y mutations viajan por HTTP a /graphql (Zero-REST:
// este es el único endpoint que el frontend conoce).
const httpLink = new HttpLink({ uri: HTTP_URL });

// Las subscriptions viajan por WebSocket, protocolo requerido por
// GraphQL Subscriptions para mantener la conexión abierta.
const wsLink = new GraphQLWsLink(createClient({ url: WS_URL }));

// "split" decide, operación por operación, si va por WS o por HTTP.
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  httpLink
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
