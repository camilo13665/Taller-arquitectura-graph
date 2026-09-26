import { MedicationRepository } from '../infrastructure/repositories/MedicationRepository';
import { CartRepository } from '../infrastructure/repositories/CartRepository';
import { OrderRepository } from '../infrastructure/repositories/OrderRepository';
import { createMedicationLoader, MedicationLoader } from './loaders/medicationLoader';

import { SearchMedications } from '../application/queries/SearchMedications';
import { GetMedicationById } from '../application/queries/GetMedicationById';
import { GetOrderById } from '../application/queries/GetOrderById';

import { CreateCart } from '../application/commands/CreateCart';
import { AddItemToCart } from '../application/commands/AddItemToCart';
import { ValidatePrescription } from '../application/commands/ValidatePrescription';
import { SubmitOrder } from '../application/commands/SubmitOrder';
import { ApproveOrder } from '../application/commands/ApproveOrder';
import { CancelOrder } from '../application/commands/CancelOrder';

export interface GraphQLContext {
  medicationLoader: MedicationLoader;
  queries: {
    searchMedications: SearchMedications;
    getMedicationById: GetMedicationById;
    getOrderById: GetOrderById;
  };
  commands: {
    createCart: CreateCart;
    addItemToCart: AddItemToCart;
    validatePrescription: ValidatePrescription;
    submitOrder: SubmitOrder;
    approveOrder: ApproveOrder;
    cancelOrder: CancelOrder;
  };
}

/**
 * IMPORTANTE: el DataLoader se crea UNA VEZ POR REQUEST (aquí, en la
 * función de contexto que Apollo Server llama en cada petición HTTP).
 * Si se creara una sola vez a nivel global, su caché interna viviría
 * entre requests de distintos usuarios y podría servir datos obsoletos.
 */
export function createContext(): GraphQLContext {
  const medicationRepository = new MedicationRepository();
  const cartRepository = new CartRepository();
  const orderRepository = new OrderRepository();
  const medicationLoader = createMedicationLoader(medicationRepository);

  return {
    medicationLoader,
    queries: {
      searchMedications: new SearchMedications(medicationRepository),
      getMedicationById: new GetMedicationById(medicationLoader),
      getOrderById: new GetOrderById(orderRepository),
    },
    commands: {
      createCart: new CreateCart(cartRepository),
      addItemToCart: new AddItemToCart(cartRepository, medicationRepository),
      validatePrescription: new ValidatePrescription(cartRepository),
      submitOrder: new SubmitOrder(cartRepository, medicationRepository, orderRepository),
      approveOrder: new ApproveOrder(orderRepository, cartRepository, medicationRepository),
      cancelOrder: new CancelOrder(orderRepository),
    },
  };
}
