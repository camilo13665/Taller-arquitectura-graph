export type OrderStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'DISPATCHED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  orderId: string;
  medicationId: number;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  cartId: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

export function mapRowToOrder(row: any): Order {
  return {
    id: row.id,
    cartId: row.cart_id,
    status: row.status,
    total: Number(row.total),
    createdAt: row.created_at,
    items: [],
  };
}

export function mapRowToOrderItem(row: any): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    medicationId: row.medication_id,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
  };
}
