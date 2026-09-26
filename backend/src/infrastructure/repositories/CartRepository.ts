import { supabase } from '../supabaseClient';
import { Cart, CartItem, mapRowToCartItem } from '../../domain/entities/Cart';

export class CartRepository {
  async create(): Promise<Cart> {
    const { data, error } = await supabase.from('carts').insert({}).select().single();
    if (error) throw new Error(`Error creando carrito: ${error.message}`);
    return { id: data.id, status: data.status, items: [] };
  }

  async findById(id: string): Promise<Cart | null> {
    const { data, error } = await supabase.from('carts').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Error obteniendo carrito ${id}: ${error.message}`);
    if (!data) return null;

    const items = await this.getItems(id);
    return { id: data.id, status: data.status, items };
  }

  async getItems(cartId: string): Promise<CartItem[]> {
    const { data, error } = await supabase.from('cart_items').select('*').eq('cart_id', cartId);
    if (error) throw new Error(`Error obteniendo items del carrito: ${error.message}`);
    return (data || []).map(mapRowToCartItem);
  }

  /** Upsert: si el medicamento ya está en el carrito, suma la cantidad. */
  async addItem(cartId: string, medicationId: number, quantity: number): Promise<void> {
    const { data: existing, error: findError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId)
      .eq('medication_id', medicationId)
      .maybeSingle();

    if (findError) throw new Error(`Error verificando item existente: ${findError.message}`);

    if (existing) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id);
      if (error) throw new Error(`Error actualizando item del carrito: ${error.message}`);
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .insert({ cart_id: cartId, medication_id: medicationId, quantity });
    if (error) throw new Error(`Error agregando item al carrito: ${error.message}`);
  }

  async savePrescription(cartId: string, documentRef: string, issuedBy: string) {
    const { data, error } = await supabase
      .from('prescriptions')
      .insert({ cart_id: cartId, document_ref: documentRef, issued_by: issuedBy, is_valid: true })
      .select()
      .single();
    if (error) throw new Error(`Error guardando prescripción: ${error.message}`);
    return data;
  }

  async hasValidPrescription(cartId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('id')
      .eq('cart_id', cartId)
      .eq('is_valid', true)
      .limit(1);
    if (error) throw new Error(`Error verificando prescripción: ${error.message}`);
    return (data || []).length > 0;
  }
}
