import { pubsub, TOPICS } from '../../pubsub';

export const subscriptionResolvers = {
  Subscription: {
    orderStatusChanged: {
      subscribe: (_: unknown, args: { orderId: string }) => {
        return pubsub.asyncIterator(TOPICS.ORDER_STATUS_CHANGED(args.orderId));
      },
    },
  },
};
