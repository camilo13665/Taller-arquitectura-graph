import { CartRepository } from '../../infrastructure/repositories/CartRepository';
import { MedicationRepository } from '../../infrastructure/repositories/MedicationRepository';
import { DomainError } from '../../domain/errors/DomainError';
import { assertValidQuantity, assertSufficientStock } from '../../domain/rules/orderRules';

export interface AddItemToCartCommandInput {
  cartId: string;
  medicationId: number;
  quantity: number;
}

/**
 * WRITE MODEL — agregar un ítem exige:
 *  1) el medicamento exista,
 *  2) la cantidad sea > 0 (Regla 3),
 *  3) haya stock suficiente (Regla 1) — validación "optimista" aquí;
 *     la validación definitiva y atómica ocurre en submitOrder vía RPC.
 */
export class AddItemToCart {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly medicationRepository: MedicationRepository
  ) {}

  async execute(input: AddItemToCartCommandInput) {
    const cart = await this.cartRepository.findById(input.cartId);
    if (!cart) {
      throw new DomainError('CART_NOT_FOUND', `No existe el carrito ${input.cartId}.`);
    }

    assertValidQuantity(input.quantity);

    const medication = await this.medicationRepository.findById(input.medicationId);
    if (!medication) {
      throw new DomainError('MEDICATION_NOT_FOUND', `No existe el medicamento ${input.medicationId}.`);
    }

    assertSufficientStock(medication, input.quantity);

    await this.cartRepository.addItem(input.cartId, input.medicationId, input.quantity);
    return this.cartRepository.findById(input.cartId);
  }
}
