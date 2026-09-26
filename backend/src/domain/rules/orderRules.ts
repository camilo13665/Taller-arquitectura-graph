import { DomainError } from '../errors/DomainError';
import { Medication } from '../entities/Medication';
import { OrderStatus } from '../entities/Order';

/**
 * Todas las funciones de este archivo son puras: no llaman a Supabase,
 * no hacen I/O. Reciben datos ya cargados y devuelven una decisión o
 * lanzan un DomainError. Esto es lo que se sustenta como "invariantes
 * de negocio en la capa de dominio, no en React".
 */

// Regla 3: no permitir cantidades menores o iguales a cero.
export function assertValidQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new DomainError('INVALID_QUANTITY', 'La cantidad debe ser un entero mayor que cero.');
  }
}

// Regla 1: no permitir comprar una cantidad superior al stock disponible.
export function assertSufficientStock(medication: Medication, quantity: number): void {
  if (medication.stock < quantity) {
    throw new DomainError(
      'INSUFFICIENT_STOCK',
      `Stock insuficiente para "${medication.name}". Disponible: ${medication.stock}, solicitado: ${quantity}.`
    );
  }
}

// Regla 2: no aprobar medicamentos que requieren fórmula si no hay prescripción válida.
export function determineInitialOrderStatus(
  medicationsRequirePrescription: boolean,
  hasValidPrescription: boolean
): OrderStatus {
  if (medicationsRequirePrescription && !hasValidPrescription) {
    return 'PENDING_APPROVAL';
  }
  return medicationsRequirePrescription ? 'PENDING_APPROVAL' : 'APPROVED';
}

export function assertCanApprove(
  currentStatus: OrderStatus,
  requiresPrescription: boolean,
  hasValidPrescription: boolean
): void {
  // Regla 5: una orden cancelada no puede volver a aprobarse directamente.
  if (currentStatus === 'CANCELLED') {
    throw new DomainError('INVALID_ORDER_STATE', 'Una orden cancelada no puede aprobarse.');
  }
  if (currentStatus === 'DISPATCHED') {
    throw new DomainError('INVALID_ORDER_STATE', 'La orden ya fue despachada.');
  }
  // Regla 2 aplicada en el momento de aprobar.
  if (requiresPrescription && !hasValidPrescription) {
    throw new DomainError(
      'PRESCRIPTION_REQUIRED',
      'No se puede aprobar: hay medicamentos que requieren fórmula validada.'
    );
  }
}

// Regla 6: una orden aprobada puede avanzar a DISPATCHED (no al revés, no desde otros estados).
export function assertCanDispatch(currentStatus: OrderStatus): void {
  if (currentStatus !== 'APPROVED') {
    throw new DomainError(
      'INVALID_ORDER_STATE',
      `Solo una orden APPROVED puede pasar a DISPATCHED (estado actual: ${currentStatus}).`
    );
  }
}

export function assertCanCancel(currentStatus: OrderStatus): void {
  if (currentStatus === 'DISPATCHED') {
    throw new DomainError('INVALID_ORDER_STATE', 'Una orden despachada no puede cancelarse.');
  }
  if (currentStatus === 'CANCELLED') {
    throw new DomainError('INVALID_ORDER_STATE', 'La orden ya está cancelada.');
  }
}
