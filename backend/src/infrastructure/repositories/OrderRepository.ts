import { supabase } from '../supabaseClient';
import { Order, OrderItem, OrderStatus, mapRowToOrder, mapRowToOrderItem } from '../../domain/entities/Order';

export class OrderRepository {
  /**
   * Ejecuta la función RPC transaccional que reserva stock, crea la
   * orden y sus items en una sola transacción atómica (ver
   * database/rpc_functions.sql). Si falla por stock insuficiente,
   * Postgres revierte todo automáticamente.
   */
  async submitTransactional(cartId: string, initialStatus: OrderStatus): Promise<string> {
    const { data, error } = await supabase.rpc('submit_order_transactional', {
      p_cart_id: cartId,
      p_initial_status: initialStatus,
    });
    if (error) {
      if (error.message.includes('INSUFFICIENT_STOCK')) {
        throw new Error('INSUFFICIENT_STOCK');
      }
      throw new Error(`Error creando orden: ${error.message}`);
    }
    return data as string;
  }

  async findById(id: string): Promise<Order | null> {
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Error obteniendo orden ${id}: ${error.message}`);
    if (!data) return null;

    const order = mapRowToOrder(data);
    order.items = await this.getItems(id);
    return order;
  }

  async getItems(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await supabase.from('order_items').select('*').eq('order_id', orderId);
    if (error) throw new Error(`Error obteniendo items de la orden: ${error.message}`);
    return (data || []).map(mapRowToOrderItem);
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();
    if (error) throw new Error(`Error actualizando estado de orden: ${error.message}`);

    const order = mapRowToOrder(data);
    order.items = await this.getItems(orderId);
    return order;
  }
}
