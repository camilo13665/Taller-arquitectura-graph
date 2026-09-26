import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_MEDICATION_DETAIL } from '../graphql/queries';
import { ADD_ITEM_TO_CART } from '../graphql/mutations';
import { useCart } from '../hooks/useCart';
import { useState } from 'react';

export function MedicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { cartId } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data, loading, error } = useQuery(GET_MEDICATION_DETAIL, { variables: { id } });
  const [addItemToCart, { loading: adding }] = useMutation(ADD_ITEM_TO_CART);

  if (loading) return <div className="feedback-card">Cargando información del medicamento...</div>;
  if (error) return <p className="error-message">Error: {error.message}</p>;
  if (!data?.medication) return <div className="empty-state">Medicamento no encontrado.</div>;

  const med = data.medication;

  const handleAdd = async () => {
    setFeedback(null);
    const { data: result } = await addItemToCart({
      variables: { input: { cartId, medicationId: med.id, quantity } },
    });
    const payload = result.addItemToCart;
    if (payload.success) {
      setFeedback(`✅ Agregado al carrito (${quantity} unidad(es)).`);
    } else {
      setFeedback(`❌ ${payload.error.code}: ${payload.error.message}`);
    }
  };

  return (
    <section>
      <Link to="/" className="back-link">← Volver al catálogo</Link>
      <div className="content-card detail-layout">
        <div>
          <div className="detail-art" aria-hidden="true">✚</div>
          <p className="eyebrow" style={{ marginTop: 25 }}>{med.category}</p>
          <h1 className="detail-title">{med.name}</h1>
          <p className="detail-description">{med.description}</p>
          <div className="detail-facts">
            <div className="fact"><span className="fact-label">Principio activo</span><span className="fact-value">{med.activeIngredient}</span></div>
            <div className="fact"><span className="fact-label">Dosis</span><span className="fact-value">{med.dosage}</span></div>
            <div className="fact"><span className="fact-label">Presentación</span><span className="fact-value">{med.presentation}</span></div>
            <div className="fact"><span className="fact-label">Fabricante</span><span className="fact-value">{med.manufacturer}</span></div>
          </div>
        </div>
        <aside className="purchase-panel">
          <p className="eyebrow">Compra segura</p>
          <p className="purchase-price">${med.price.toLocaleString('es-CO')}</p>
          <p className="stock-note">{med.stock > 0 ? `${med.stock} unidades disponibles` : 'Agotado'}</p>
          {med.requiresPrescription && <p className="prescription-note">⚠ Este medicamento requiere fórmula médica.</p>}
          <div className="quantity-row">
            <input aria-label="Cantidad" type="number" min={1} max={med.stock} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} />
            <button onClick={handleAdd} disabled={adding || !cartId || med.stock < 1}>
              {adding ? 'Agregando...' : 'Agregar al carrito'}
            </button>
          </div>
          {feedback && <p className="live-note" role="status">{feedback}</p>}
        </aside>
      </div>
    </section>
  );
}
