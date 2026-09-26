import { supabase } from '../supabaseClient';
import { Medication, mapRowToMedication } from '../../domain/entities/Medication';

export interface MedicationFilter {
  name?: string;
  activeIngredient?: string;
  category?: string;
  requiresPrescription?: boolean;
}

export class MedicationRepository {
  /** Read model: búsqueda con filtros combinables + paginación. */
  async search(
    filter: MedicationFilter,
    page: number,
    limit: number
  ): Promise<{ items: Medication[]; total: number }> {
    let query = supabase.from('medications').select('*', { count: 'exact' });

    if (filter.name) {
      query = query.ilike('name', `%${filter.name}%`);
    }
    if (filter.activeIngredient) {
      query = query.ilike('active_ingredient', `%${filter.activeIngredient}%`);
    }
    if (filter.category) {
      query = query.ilike('category', `%${filter.category}%`);
    }
    if (filter.requiresPrescription !== undefined) {
      query = query.eq('requires_prescription', filter.requiresPrescription);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.order('name', { ascending: true }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(`Error buscando medicamentos: ${error.message}`);

    return {
      items: (data || []).map(mapRowToMedication),
      total: count || 0,
    };
  }

  /** Read model: detalle por id (usado también por el DataLoader). */
  async findById(id: number): Promise<Medication | null> {
    const { data, error } = await supabase.from('medications').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Error obteniendo medicamento ${id}: ${error.message}`);
    return data ? mapRowToMedication(data) : null;
  }

  /** Read model: carga agrupada por lote de IDs (usada exclusivamente por el DataLoader). */
  async findByIds(ids: number[]): Promise<Medication[]> {
    console.log(`[MedicationRepository] Consulta AGRUPADA para ids=[${ids.join(', ')}]`);
    const { data, error } = await supabase.from('medications').select('*').in('id', ids);
    if (error) throw new Error(`Error obteniendo medicamentos por lote: ${error.message}`);
    return (data || []).map(mapRowToMedication);
  }

  /**
   * Write model: resta atómica de stock vía función RPC (ver
   * database/rpc_functions.sql). Devuelve null si no había stock
   * suficiente (0 filas afectadas), sin lanzar excepción, para que el
   * caso de uso decida qué error de negocio mostrar.
   */
  async decrementStock(medicationId: number, quantity: number): Promise<{ id: number; stock: number } | null> {
    const { data, error } = await supabase.rpc('decrement_medication_stock', {
      p_medication_id: medicationId,
      p_quantity: quantity,
    });
    if (error) throw new Error(`Error decrementando stock: ${error.message}`);
    if (!data || data.length === 0) return null;
    return data[0];
  }
}
