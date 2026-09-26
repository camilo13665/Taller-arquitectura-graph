export interface CartItem {
  id: string;
  cartId: string;
  medicationId: number;
  quantity: number;
}

export interface Cart {
  id: string;
  status: 'OPEN' | 'CONVERTED' | 'ABANDONED';
  items: CartItem[];
}

export function mapRowToCartItem(row: any): CartItem {
  return {
    id: row.id,
    cartId: row.cart_id,
    medicationId: row.medication_id,
    quantity: row.quantity,
  };
}
