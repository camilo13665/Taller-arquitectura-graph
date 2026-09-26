import { DomainError } from '../../domain/errors/DomainError';

/**
 * Ejecuta un comando y traduce cualquier DomainError a un payload GraphQL
 * { success: false, error: { code, message } } en vez de dejar que
 * Apollo devuelva un error genérico HTTP 500. Esto es lo que pide el
 * punto 20 del taller: mensajes de negocio claros y ricos.
 */
export async function runCommand<T>(
  fn: () => Promise<T>,
  resultKey: string
): Promise<Record<string, any>> {
  try {
    const result = await fn();
    return { success: true, [resultKey]: result, error: null };
  } catch (err) {
    if (err instanceof DomainError) {
      return {
        success: false,
        [resultKey]: null,
        error: { code: err.code, message: err.message },
      };
    }
    // Error inesperado (infraestructura, red, etc.) — no lo disfrazamos
    // de error de negocio, lo dejamos subir para que Apollo lo reporte.
    throw err;
  }
}
