import { CartRepository } from '../../infrastructure/repositories/CartRepository';
import { MedicationRepository } from '../../infrastructure/repositories/MedicationRepository';
import { OrderRepository } from '../../infrastructure/repositories/OrderRepository';
import { DomainError } from '../../domain/errors/DomainError';
import { determineInitialOrderStatus } from '../../domain/rules/orderRules';
import { pubsub, TOPICS } from '../../pubsub';

export interface SubmitOrderInput {
  cartId: string;
}

/**
 * WRITE MODEL — flujo completo de checkout:
 *  1) Obtener los medicamentos del carrito.
 *  2) Detectar si alguno requiere fórmula.
 *  3) Si requiere, verificar que exista soporte de prescripción.
 *  4) Reservar/decrementar stock de forma atómica (RPC en Postgres,
 *     ver database/rpc_functions.sql — Regla 4).
 *  5) Crear la orden con el estado inicial correcto (Regla 2).
 *
 * La resta de stock NO ocurre aquí en JavaScript: ocurre dentro de la
 * función SQL submit_order_transactional, para que sea atómica y
 * segura ante concurrencia. Este caso de uso solo decide el estado
 * inicial y orquesta la llamada.
 */
export class SubmitOrder {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly medicationRepository: MedicationRepository,
    private readonly orderRepository: OrderRepository
  ) {}

  async execute(input: SubmitOrderInput) {
    const cart = await this.cartRepository.findById(input.cartId);
    if (!cart) {
      throw new DomainError('CART_NOT_FOUND', `No existe el carrito ${input.cartId}.`);
    }
    if (cart.items.length === 0) {
      throw new DomainError('INVALID_QUANTITY', 'El carrito está vacío.');
    }

    // Paso 1 y 2: cargar medicamentos y detectar si alguno requiere fórmula.
    const medicationIds = cart.items.map((i) => i.medicationId);
    const medications = await this.medicationRepository.findByIds(medicationIds);
    const requiresPrescription = medications.some((m) => m.requiresPrescription);

    // Paso 3: verificar soporte de prescripción si aplica.
    const hasValidPrescription = requiresPrescription
      ? await this.cartRepository.hasValidPrescription(input.cartId)
      : false;

    // Regla 2: si requiere fórmula y no hay prescripción válida, la orden
    // queda PENDING_APPROVAL (nunca APPROVED directamente).
    const initialStatus = determineInitialOrderStatus(requiresPrescription, hasValidPrescription);

    // Paso 4 y 5: reservar stock + crear orden, todo en una transacción
    // atómica de Postgres (evita vender de más si hay concurrencia).
    let orderId: string;
    try {
      orderId = await this.orderRepository.submitTransactional(input.cartId, initialStatus);
    } catch (err: any) {
      if (err.message === 'INSUFFICIENT_STOCK') {
        throw new DomainError('INSUFFICIENT_STOCK', 'Uno o más medicamentos ya no tienen stock suficiente.');
      }
      throw err;
    }

    const order = await this.orderRepository.findById(orderId);

    // Publicar el evento para que cualquier cliente suscrito a esta
    // orden reciba la actualización en tiempo real.
    pubsub.publish(TOPICS.ORDER_STATUS_CHANGED(orderId), { orderStatusChanged: order });

    return order;
  }
}
