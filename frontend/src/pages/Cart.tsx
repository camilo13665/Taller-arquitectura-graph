import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { CartSummary } from '../components/CartSummary';

export function CartPage() {
  const { cart, loading, error } = useCart();
  const navigate = useNavigate();

  if (loading) return <div className="feedback-card">Cargando tu carrito...</div>;
  if (error) return <p className="error-message">Error: {error.message}</p>;
  if (!cart) return <div className="empty-state">No se pudo cargar el carrito.</div>;

  return (
    <section className="content-card">
      <div className="page-heading">
        <p className="eyebrow">Un paso más cerca de cuidarte</p>
        <h1>Tu carrito</h1>
        <p className="muted">Revisa tus productos antes de continuar.</p>
      </div>
      <CartSummary items={cart.items} total={cart.total} />

      <div className="cart-actions">
        <Link to="/" className="secondary-link">← Seguir comprando</Link>
        <button disabled={cart.items.length === 0} onClick={() => navigate('/checkout')}>
          Ir a pagar
        </button>
      </div>
    </section>
  );
}
