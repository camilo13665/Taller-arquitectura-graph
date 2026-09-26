import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_MEDICATIONS } from '../graphql/queries';
import { MedicationCard } from '../components/MedicationCard';

export function Catalog() {
  const [name, setName] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12;

  const filter = {
    name: name || undefined,
    activeIngredient: activeIngredient || undefined,
    category: category || undefined,
  };

  const { data, loading, error } = useQuery(GET_MEDICATIONS, {
    variables: { filter, page, limit },
  });

  return (
    <div className="catalog-page">
      <section className="catalog-hero">
        <div className="catalog-hero-copy">
          <p className="eyebrow">Bienestar que te acompaña</p>
          <h1>Tu salud merece<br />sentirse simple.</h1>
          <p>Encuentra lo que necesitas para cuidarte, con información clara y una experiencia segura.</p>
        </div>
      </section>

      <section className="search-panel" aria-label="Filtros del catálogo">
        <label className="search-field">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input aria-label="Buscar por nombre" placeholder="Buscar medicamento..." value={name} onChange={(e) => { setPage(1); setName(e.target.value); }} />
        </label>
        <label className="search-field">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input aria-label="Buscar por principio activo" placeholder="Principio activo" value={activeIngredient} onChange={(e) => { setPage(1); setActiveIngredient(e.target.value); }} />
        </label>
        <label className="search-field">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input aria-label="Filtrar por categoría" placeholder="Categoría" value={category} onChange={(e) => { setPage(1); setCategory(e.target.value); }} />
        </label>
      </section>

      <div className="section-heading">
        <div><p className="eyebrow">Explora nuestra selección</p><h2>Catálogo de medicamentos</h2></div>
        {data && <span className="result-count">{data.medications.total} productos</span>}
      </div>

      {loading && <div className="feedback-card">Preparando tu catálogo...</div>}
      {error && <p className="error-message">No pudimos cargar los medicamentos: {error.message}</p>}

      {data && (
        <>
          <div className="medication-grid">
            {data.medications.items.map((med: any) => (
              <MedicationCard key={med.id} medication={med} />
            ))}
          </div>
          {data.medications.items.length === 0 && <div className="empty-state">No encontramos resultados. Prueba con otro nombre o categoría.</div>}

          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </button>
            <span>Página {page}</span>
            <button
              disabled={page * limit >= data.medications.total}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}
