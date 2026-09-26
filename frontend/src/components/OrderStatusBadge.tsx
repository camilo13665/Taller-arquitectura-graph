const LABELS: Record<string, string> = {
  PENDING_APPROVAL: 'Pendiente de aprobación',
  APPROVED: 'Aprobada',
  DISPATCHED: 'Despachada',
  CANCELLED: 'Cancelada',
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      {LABELS[status] || status}
    </span>
  );
}
