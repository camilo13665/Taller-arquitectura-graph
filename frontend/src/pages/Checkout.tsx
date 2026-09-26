import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { CartSummary } from '../components/CartSummary';
import { VALIDATE_PRESCRIPTION, SUBMIT_ORDER } from '../graphql/mutations';

export function Checkout() {
  const { cart, cartId, loading, resetCart } = useCart();
  const navigate = useNavigate();

  const [documentRef, setDocumentRef] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [validatePrescription, { loading: validating }] = useMutation(VALIDATE_PRESCRIPTION);
  const [submitOrder, { loading: submitting }] = useMutation(SUBMIT_ORDER);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (loading) return <div className="feedback-card">Preparando el pago...</div>;
  if (!cart) return <div className="empty-state">No hay carrito activo.</div>;

  const needsPrescription = cart.items.some((item: any) => item.medication.requiresPrescription);

  const handleValidatePrescription = async () => {
    const { data } = await validatePrescription({
      variables: { input: { cartId, documentRef, issuedBy } },
    });
    if (data.validatePrescription.success) {
      setFeedback('✅ Prescripción registrada.');
    } else {
      setFeedback(`❌ ${data.validatePrescription.error.message}`);
    }
  };

  const handleSubmitOrder = async () => {
    setFeedback(null);
    const { data } = await submitOrder({ variables: { input: { cartId } } });
    const payload = data.submitOrder;
    if (payload.success) {
      resetCart();
      navigate(`/orders/${payload.order.id}`);
    } else {
      setFeedback(`❌ ${payload.error.code}: ${payload.error.message}`);
    }
  };

  return (
    <section className="content-card">
      <div className="page-heading">
        <p className="eyebrow">Finaliza tu compra</p>
        <h1>Confirmar pedido</h1>
        <p className="muted">Revisa el resumen y confirma tu orden de forma segura.</p>
      </div>
      <CartSummary items={cart.items} total={cart.total} />

      {needsPrescription && (
        <div className="prescription-panel">
          <h3>⚠ Se requiere fórmula médica</h3>
          <p>Uno o más medicamentos de tu carrito requieren prescripción. Registra los datos de la fórmula para continuar.</p>
          <div className="prescription-fields">
            <input
              aria-label="Referencia del documento"
              placeholder="Referencia del documento"
              value={documentRef}
              onChange={(e) => setDocumentRef(e.target.value)}
            />
            <input
              aria-label="Médico o institución que emitió la fórmula"
              placeholder="Emitido por (médico/institución)"
              value={issuedBy}
              onChange={(e) => setIssuedBy(e.target.value)}
            />
            <button onClick={handleValidatePrescription} disabled={validating}>
              {validating ? 'Validando...' : 'Registrar fórmula'}
            </button>
          </div>
        </div>
      )}

      <div className="checkout-actions">
        <button onClick={handleSubmitOrder} disabled={submitting}>
          {submitting ? 'Enviando orden...' : 'Confirmar orden'}
        </button>
      </div>

      {feedback && <p className="live-note" role="status">{feedback}</p>}
    </section>
  );
}
