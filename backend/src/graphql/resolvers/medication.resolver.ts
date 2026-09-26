import { GraphQLContext } from '../context';

export const medicationResolvers = {
  Query: {
    medications: async (
      _: unknown,
      args: { filter?: any; page?: number; limit?: number },
      ctx: GraphQLContext
    ) => {
      const page = args.page ?? 1;
      const limit = args.limit ?? 10;
      const filter = {
        name: args.filter?.name,
        activeIngredient: args.filter?.activeIngredient,
        category: args.filter?.category,
        requiresPrescription: args.filter?.requiresPrescription,
      };
      const { items, total } = await ctx.queries.searchMedications.execute(filter, page, limit);
      return { items, total, page, limit };
    },

    medication: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      return ctx.queries.getMedicationById.execute(Number(args.id));
    },
  },

  Medication: {
    // El id llega como number desde Postgres; GraphQL ID! espera string.
    id: (parent: any) => String(parent.id),
  },
};
