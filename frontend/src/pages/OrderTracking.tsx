import { useParams } from 'react-router-dom';
import { useQuery, useSubscription } from '@apollo/client';
import { GET_ORDER } from '../graphql/queries';
import { ORDER_STATUS_CHANGED } from '../graphql/subscriptions';
import { OrderStatusBadge } from '../components/OrderStatusBadge';

export function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery(GET_ORDER, { variables: { id } });

  // Se suscribe al canal de esta orden específica. Cuando el backend
  // publique un cambio de estado (approveOrder, cancelOrder, etc.),
  // Apollo Client actualiza automáticamente la UI sin recargar ni
  // hacer polling.
  const { data: subData } = useSubscription(ORDER_STATUS_CHANGED, {
    variables: { orderId: id },
  });

  if (loading) return <div className="feedback-card">Cargando seguimiento de tu orden...</div>;
  if (error) return <p className="error-message">Error: {error.message}</p>;

  const order = subData?.orderStatusChanged ?? data?.order;
  if (!order) return <div className="empty-state">Orden no encontrada.</div>;

  return (
    <section className="content-card">
      <div className="page-heading">
        <p className="eyebrow">Gracias por tu compra</p>
        <h1>Tu orden está en marcha</h1>
        <div className="order-meta"><OrderStatusBadge status={order.status} /><span>Realizada el {new Date(order.createdAt).toLocaleString('es-CO')}</span></div>
        <p className="order-number">Número de orden: {order.id}</p>
      </div>

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
          {order.items.map((item: any) => (
            <tr key={item.id}>
              <td>{item.medication.name}</td>
              <td>{item.medication.presentation}</td>
              <td>{item.quantity}</td>
              <td>${item.subtotal.toLocaleString('es-CO')}</td>
            </tr>
          ))}
        </tbody>
      </table></div>

      <div className="table-total"><span>Total de la orden</span><strong>${order.total.toLocaleString('es-CO')}</strong></div>

      <p className="live-note">Esta página se actualiza automáticamente cuando cambia el estado de tu orden.</p>
    </section>
  );
}
