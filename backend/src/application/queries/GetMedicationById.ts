import { MedicationLoader } from '../../graphql/loaders/medicationLoader';

/** READ MODEL — usa el DataLoader para aprovechar el batching aunque se llame una sola vez. */
export class GetMedicationById {
  constructor(private readonly medicationLoader: MedicationLoader) {}

  async execute(id: number) {
    return this.medicationLoader.load(id);
  }
}
