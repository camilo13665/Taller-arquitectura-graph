import { OrderRepository } from '../../infrastructure/repositories/OrderRepository';
import { DomainError } from '../../domain/errors/DomainError';
import { assertCanCancel } from '../../domain/rules/orderRules';
import { pubsub, TOPICS } from '../../pubsub';

/** WRITE MODEL — cancela una orden que no esté ya despachada o cancelada (Regla 5/6). */
export class CancelOrder {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(orderId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new DomainError('ORDER_NOT_FOUND', `No existe la orden ${orderId}.`);
    }

    assertCanCancel(order.status);

    const updated = await this.orderRepository.updateStatus(orderId, 'CANCELLED');
    pubsub.publish(TOPICS.ORDER_STATUS_CHANGED(orderId), { orderStatusChanged: updated });
    return updated;
  }
}
