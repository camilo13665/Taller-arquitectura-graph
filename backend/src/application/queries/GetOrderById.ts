import { OrderRepository } from '../../infrastructure/repositories/OrderRepository';
import { DomainError } from '../../domain/errors/DomainError';

/** READ MODEL — proyección de la orden para "seguimiento de orden" en el frontend. */
export class GetOrderById {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(id: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new DomainError('ORDER_NOT_FOUND', `No existe la orden ${id}.`);
    }
    return order;
  }
}
