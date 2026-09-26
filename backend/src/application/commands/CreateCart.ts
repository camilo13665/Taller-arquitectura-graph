import { CartRepository } from '../../infrastructure/repositories/CartRepository';

/** WRITE MODEL — intención de negocio "crear carrito", no un INSERT genérico expuesto tal cual. */
export class CreateCart {
  constructor(private readonly cartRepository: CartRepository) {}

  async execute() {
    return this.cartRepository.create();
  }
}
