import { Link } from 'react-router-dom';

interface Props {
  medication: {
    id: string;
    name: string;
    price: number;
    presentation: string;
  };
}

export function MedicationCard({ medication }: Props) {
  return (
    <article className="medication-card">
      <div className="medication-card-top">
        <span className="medication-art" aria-hidden="true">✚</span>
        <span className="card-label">Cuidado diario</span>
      </div>
      <h3 className="medication-name">{medication.name}</h3>
      <p className="medication-presentation">{medication.presentation}</p>
      <div className="medication-card-bottom">
        <span className="medication-price">${medication.price.toLocaleString('es-CO')}</span>
        <Link to={`/medications/${medication.id}`} className="card-link">Ver detalle →</Link>
      </div>
    </article>
  );
}
