import { GraphQLContext } from '../context';
import { runCommand } from './errorMapper';

export const orderResolvers = {
  Query: {
    order: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      return ctx.queries.getOrderById.execute(args.id);
    },
  },

  Mutation: {
    submitOrder: async (_: unknown, args: { input: any }, ctx: GraphQLContext) => {
      return runCommand(() => ctx.commands.submitOrder.execute({ cartId: args.input.cartId }), 'order');
    },

    approveOrder: async (_: unknown, args: { orderId: string }, ctx: GraphQLContext) => {
      return runCommand(() => ctx.commands.approveOrder.execute(args.orderId), 'order');
    },

    cancelOrder: async (_: unknown, args: { orderId: string }, ctx: GraphQLContext) => {
      return runCommand(() => ctx.commands.cancelOrder.execute(args.orderId), 'order');
    },
  },

  Order: {
    id: (parent: any) => String(parent.id),
    items: (parent: any) => parent.items,
  },

  OrderItem: {
    id: (parent: any) => String(parent.id),
    medication: (parent: any, _: unknown, ctx: GraphQLContext) => {
      // Aquí es donde más se nota el DataLoader: una orden con varios
      // OrderItem dispara varias llamadas a .load(), pero se agrupan en
      // una sola consulta SQL (ver logs de [DataLoader] en consola).
      return ctx.medicationLoader.load(parent.medicationId);
    },
    subtotal: (parent: any) => parent.unitPrice * parent.quantity,
  },
};
