-- =====================================================================
-- RPC: decrement_medication_stock
-- =====================================================================
-- Resuelve el requisito #7: la resta de stock NUNCA se hace en JS con
-- "stock = stock - quantity" leído/escrito en dos pasos, porque dos
-- requests concurrentes podrían leer el mismo stock antes de que
-- cualquiera escriba (race condition clásica) y vender más unidades
-- de las que existen.
--
-- Esta función hace la resta y la validación en una sola sentencia
-- atómica dentro de PostgreSQL: la fila queda bloqueada durante el
-- UPDATE, así que si dos requests llegan al mismo tiempo, Postgres
-- serializa la segunda hasta que la primera termine. Si tras la
-- primera ya no queda stock suficiente, la condición WHERE stock >=
-- quantity hace que la segunda actualice 0 filas, y el backend lo
-- detecta revisando la fila devuelta.
-- =====================================================================

CREATE OR REPLACE FUNCTION decrement_medication_stock(
    p_medication_id INTEGER,
    p_quantity      INTEGER
)
RETURNS TABLE (id INTEGER, stock INTEGER) AS $$
BEGIN
    RETURN QUERY
    UPDATE medications
    SET stock = medications.stock - p_quantity
    WHERE medications.id = p_medication_id
      AND medications.stock >= p_quantity
    RETURNING medications.id, medications.stock;
END;
$$ LANGUAGE plpgsql;

-- Uso desde el backend (infrastructure/repositories/MedicationRepository.ts):
--   const { data, error } = await supabase.rpc('decrement_medication_stock', {
--     p_medication_id: id,
--     p_quantity: qty,
--   });
--   if (!data || data.length === 0) => INSUFFICIENT_STOCK
--
-- Si "data" viene vacío, significa que la condición stock >= quantity
-- no se cumplió: la fila no fue tocada, por lo tanto no hay riesgo de
-- vender de más aunque lleguen decenas de solicitudes simultáneas
-- para el mismo medicamento.

-- =====================================================================
-- RPC: submit_order_transactional
-- =====================================================================
-- Envuelve en una sola transacción: reservar stock de todos los items
-- del carrito + crear la orden + crear los order_items. Si cualquier
-- ítem falla por falta de stock, toda la operación se revierte
-- (atomicidad), evitando órdenes "a medias".
-- =====================================================================

CREATE OR REPLACE FUNCTION submit_order_transactional(
    p_cart_id UUID,
    p_initial_status VARCHAR
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_item RECORD;
    v_total NUMERIC(12,2) := 0;
    v_updated RECORD;
BEGIN
    -- Crear la orden en estado inicial (aún sin total definitivo).
    INSERT INTO orders (cart_id, status, total)
    VALUES (p_cart_id, p_initial_status, 0)
    RETURNING id INTO v_order_id;

    FOR v_item IN
        SELECT ci.medication_id, ci.quantity, m.price
        FROM cart_items ci
        JOIN medications m ON m.id = ci.medication_id
        WHERE ci.cart_id = p_cart_id
    LOOP
        -- Resta atómica y validada por cada ítem.
        SELECT * INTO v_updated
        FROM decrement_medication_stock(v_item.medication_id, v_item.quantity);

        IF v_updated IS NULL THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK: medication % ', v_item.medication_id
                USING ERRCODE = 'P0001';
        END IF;

        INSERT INTO order_items (order_id, medication_id, quantity, unit_price)
        VALUES (v_order_id, v_item.medication_id, v_item.quantity, v_item.price);

        v_total := v_total + (v_item.quantity * v_item.price);
    END LOOP;

    UPDATE orders SET total = v_total WHERE id = v_order_id;
    UPDATE carts SET status = 'CONVERTED' WHERE id = p_cart_id;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- Si esta función lanza excepción (RAISE EXCEPTION), PostgreSQL revierte
-- automáticamente TODO lo hecho dentro de ella, incluyendo los stocks ya
-- decrementados de ítems anteriores del mismo carrito. El backend
-- captura el error por su código/mensaje y lo traduce a
-- INSUFFICIENT_STOCK en la respuesta GraphQL.
