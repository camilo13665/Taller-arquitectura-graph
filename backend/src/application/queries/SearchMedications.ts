import { MedicationRepository, MedicationFilter } from '../../infrastructure/repositories/MedicationRepository';

/**
 * READ MODEL — este caso de uso solo lee. No existe ninguna ruta desde
 * aquí que module datos: es la mitad "Query" de CQRS.
 */
export class SearchMedications {
  constructor(private readonly medicationRepository: MedicationRepository) {}

  async execute(filter: MedicationFilter, page: number, limit: number) {
    return this.medicationRepository.search(filter, page, limit);
  }
}
