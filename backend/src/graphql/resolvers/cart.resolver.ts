import { GraphQLContext } from '../context';
import { runCommand } from './errorMapper';
import { CartRepository } from '../../infrastructure/repositories/CartRepository';

const cartRepository = new CartRepository();

export const cartResolvers = {
  Query: {
    cart: async (_: unknown, args: { id: string }) => {
      return cartRepository.findById(args.id);
    },
  },

  Mutation: {
    createCart: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      return runCommand(() => ctx.commands.createCart.execute(), 'cart');
    },

    addItemToCart: async (_: unknown, args: { input: any }, ctx: GraphQLContext) => {
      return runCommand(
        () =>
          ctx.commands.addItemToCart.execute({
            cartId: args.input.cartId,
            medicationId: Number(args.input.medicationId),
            quantity: args.input.quantity,
          }),
        'cart'
      );
    },

    validatePrescription: async (_: unknown, args: { input: any }, ctx: GraphQLContext) => {
      return runCommand(
        () =>
          ctx.commands.validatePrescription.execute({
            cartId: args.input.cartId,
            documentRef: args.input.documentRef,
            issuedBy: args.input.issuedBy,
          }),
        'prescription'
      );
    },
  },

  Cart: {
    // Cada CartItem necesita su Medication: si hubiera muchos items,
    // esto es exactamente el punto donde el DataLoader agrupa consultas
    // (ver Cart.items -> CartItem.medication más abajo).
    items: (parent: { items: any[] }) => parent.items,

    total: async (parent: { items: any[] }, _: unknown, ctx: GraphQLContext) => {
      let total = 0;
      for (const item of parent.items) {
        const medication = await ctx.medicationLoader.load(item.medicationId);
        if (medication) total += medication.price * item.quantity;
      }
      return total;
    },
  },

  CartItem: {
    id: (parent: any) => String(parent.id),
    medication: (parent: any, _: unknown, ctx: GraphQLContext) => {
      return ctx.medicationLoader.load(parent.medicationId);
    },
    subtotal: async (parent: any, _: unknown, ctx: GraphQLContext) => {
      const medication = await ctx.medicationLoader.load(parent.medicationId);
      return medication ? medication.price * parent.quantity : 0;
    },
  },
};
