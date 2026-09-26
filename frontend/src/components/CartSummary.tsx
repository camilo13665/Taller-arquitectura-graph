interface CartItemView {
  id: string;
  quantity: number;
  subtotal: number;
  medication: { id: string; name: string; price: number; presentation: string };
}

interface Props {
  items: CartItemView[];
  total: number;
}

export function CartSummary({ items, total }: Props) {
  if (items.length === 0) {
    return <div className="empty-state">Tu carrito todavía está vacío. Explora el catálogo para agregar productos.</div>;
  }

  return (
    <div>
      <div className="data-table-wrap"><table className="data-table">
        <thead>
          <tr>
            <th>Medicamento</th>
            <th>Presentación</th>
            <th>Cantidad</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.medication.name}</td>
              <td>{item.medication.presentation}</td>
              <td>{item.quantity}</td>
              <td>${item.subtotal.toLocaleString('es-CO')}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <div className="table-total"><span>Total</span><strong>${total.toLocaleString('es-CO')}</strong></div>
    </div>
  );
}
