import { OrderRepository } from '../../infrastructure/repositories/OrderRepository';
import { CartRepository } from '../../infrastructure/repositories/CartRepository';
import { MedicationRepository } from '../../infrastructure/repositories/MedicationRepository';
import { DomainError } from '../../domain/errors/DomainError';
import { assertCanApprove } from '../../domain/rules/orderRules';
import { pubsub, TOPICS } from '../../pubsub';

/**
 * WRITE MODEL — aprueba una orden PENDING_APPROVAL. Vuelve a validar la
 * Regla 2 en este punto (no solo al crear la orden), por si la
 * prescripción se valida después de haber emitido la orden.
 */
export class ApproveOrder {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cartRepository: CartRepository,
    private readonly medicationRepository: MedicationRepository
  ) {}

  async execute(orderId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new DomainError('ORDER_NOT_FOUND', `No existe la orden ${orderId}.`);
    }

    const medicationIds = order.items.map((i) => i.medicationId);
    const medications = await this.medicationRepository.findByIds(medicationIds);
    const requiresPrescription = medications.some((m) => m.requiresPrescription);
    const hasValidPrescription = requiresPrescription
      ? await this.cartRepository.hasValidPrescription(order.cartId)
      : true;

    assertCanApprove(order.status, requiresPrescription, hasValidPrescription);

    const updated = await this.orderRepository.updateStatus(orderId, 'APPROVED');
    pubsub.publish(TOPICS.ORDER_STATUS_CHANGED(orderId), { orderStatusChanged: updated });
    return updated;
  }
}
