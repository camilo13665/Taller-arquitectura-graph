import DataLoader from 'dataloader';
import { MedicationRepository } from '../../infrastructure/repositories/MedicationRepository';
import { Medication } from '../../domain/entities/Medication';

/**
 * Problema N+1 sin DataLoader:
 *
 *   Order
 *    ├── Item -> SELECT * FROM medications WHERE id = 1
 *    ├── Item -> SELECT * FROM medications WHERE id = 2
 *    ├── Item -> SELECT * FROM medications WHERE id = 3
 *    └── Item -> SELECT * FROM medications WHERE id = 4
 *
 * Con DataLoader:
 *
 *   Order
 *    ├── Item ─┐
 *    ├── Item ─┤
 *    ├── Item ─┼──► medicationLoader.load(id) se acumulan en el mismo tick
 *    └── Item ─┘         ↓
 *                 batchLoadFn([1,2,3,4])
 *                        ↓
 *              SELECT * FROM medications WHERE id IN (1,2,3,4)   -- 1 sola consulta
 *
 * GraphQL resuelve cada OrderItem.medication de forma independiente,
 * pero como todos llaman a loader.load(id) dentro del mismo ciclo de
 * event loop, DataLoader los junta antes de golpear la base de datos.
 */
export function createMedicationLoader(repository: MedicationRepository) {
  return new DataLoader<number, Medication | null>(async (ids: readonly number[]) => {
    console.log(`[DataLoader] batchLoadFn agrupó ${ids.length} solicitudes -> ids=[${ids.join(', ')}]`);

    const medications = await repository.findByIds(ids as number[]);
    const byId = new Map(medications.map((m) => [m.id, m]));

    // DataLoader exige devolver un array en el MISMO orden que "ids",
    // incluso con null para los que no existan.
    return ids.map((id) => byId.get(id) ?? null);
  });
}

export type MedicationLoader = ReturnType<typeof createMedicationLoader>;
