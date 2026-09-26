import { CartRepository } from '../../infrastructure/repositories/CartRepository';
import { DomainError } from '../../domain/errors/DomainError';

export interface ValidatePrescriptionInput {
  cartId: string;
  documentRef: string;
  issuedBy: string;
}

/**
 * WRITE MODEL — registra el soporte de prescripción asociado a un
 * carrito. Es una simplificación académica: no valida contra un sistema
 * externo de salud, solo registra que el usuario aportó una referencia
 * de fórmula médica, que luego se usa para decidir el estado de la orden.
 */
export class ValidatePrescription {
  constructor(private readonly cartRepository: CartRepository) {}

  async execute(input: ValidatePrescriptionInput) {
    const cart = await this.cartRepository.findById(input.cartId);
    if (!cart) {
      throw new DomainError('CART_NOT_FOUND', `No existe el carrito ${input.cartId}.`);
    }
    if (!input.documentRef.trim() || !input.issuedBy.trim()) {
      throw new DomainError('INVALID_QUANTITY', 'La referencia y el emisor de la fórmula son obligatorios.');
    }
    return this.cartRepository.savePrescription(input.cartId, input.documentRef, input.issuedBy);
  }
}
