export type ErrorCode =
  | 'INSUFFICIENT_STOCK'
  | 'PRESCRIPTION_REQUIRED'
  | 'INVALID_QUANTITY'
  | 'MEDICATION_NOT_FOUND'
  | 'CART_NOT_FOUND'
  | 'ORDER_NOT_FOUND'
  | 'INVALID_ORDER_STATE';

/**
 * Todas las reglas de negocio (domain/rules) lanzan este error en vez de
 * un Error genérico de JS. Los casos de uso (application/*) lo capturan
 * y lo traducen a un payload GraphQL { success: false, error: { code, message } }
 * en vez de reventar la petición con un error 500 opaco.
 */
export class DomainError extends Error {
  constructor(public readonly code: ErrorCode, message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
