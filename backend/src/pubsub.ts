import { PubSub } from 'graphql-subscriptions';

// Implementación en memoria: suficiente para una demostración académica
// con un único proceso de servidor. En producción real se usaría un
// PubSub respaldado por Redis para soportar múltiples instancias.
export const pubsub = new PubSub();

export const TOPICS = {
  ORDER_STATUS_CHANGED: (orderId: string) => `ORDER_STATUS_CHANGED_${orderId}`,
};
