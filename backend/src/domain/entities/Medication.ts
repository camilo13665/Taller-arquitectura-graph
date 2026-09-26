export interface Medication {
  id: number;
  sku: string;
  name: string;
  activeIngredient: string;
  category: string;
  dosage: string;
  presentation: string;
  price: number;
  stock: number;
  requiresPrescription: boolean;
  manufacturer: string;
  description: string | null;
}

/** Convierte una fila cruda de Postgres (snake_case) a la entidad de dominio (camelCase). */
export function mapRowToMedication(row: any): Medication {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    activeIngredient: row.active_ingredient,
    category: row.category,
    dosage: row.dosage,
    presentation: row.presentation,
    price: Number(row.price),
    stock: row.stock,
    requiresPrescription: row.requires_prescription,
    manufacturer: row.manufacturer,
    description: row.description,
  };
}
