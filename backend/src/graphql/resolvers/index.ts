import { GraphQLScalarType, Kind } from 'graphql';
import { medicationResolvers } from './medication.resolver';
import { cartResolvers } from './cart.resolver';
import { orderResolvers } from './order.resolver';
import { subscriptionResolvers } from './subscription.resolver';

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'Fecha/hora en formato ISO-8601',
  serialize: (value: any) => new Date(value).toISOString(),
  parseValue: (value: any) => new Date(value),
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : null),
});

export const resolvers = {
  DateTime: DateTimeScalar,

  Query: {
    ...medicationResolvers.Query,
    ...cartResolvers.Query,
    ...orderResolvers.Query,
  },
  Mutation: {
    ...cartResolvers.Mutation,
    ...orderResolvers.Mutation,
  },
  Subscription: {
    ...subscriptionResolvers.Subscription,
  },

  Medication: medicationResolvers.Medication,
  Cart: cartResolvers.Cart,
  CartItem: cartResolvers.CartItem,
  Order: orderResolvers.Order,
  OrderItem: orderResolvers.OrderItem,
};
