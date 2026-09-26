-- =====================================================================
-- Afirmative Pill — Schema principal (PostgreSQL / Supabase)
-- =====================================================================
-- Tabla: medications
-- Corresponde 1:1 a las columnas del dataset original (no se agregan
-- columnas inventadas, salvo timestamps de auditoría estándar).
-- =====================================================================

CREATE TABLE IF NOT EXISTS medications (
    id                      SERIAL PRIMARY KEY,
    sku                     VARCHAR(20)     NOT NULL,
    name                    VARCHAR(150)    NOT NULL,
    active_ingredient       VARCHAR(150)    NOT NULL,
    category                VARCHAR(80)     NOT NULL,
    dosage                  VARCHAR(80)     NOT NULL,
    presentation            VARCHAR(120)    NOT NULL,
    price                   NUMERIC(10, 2)  NOT NULL CHECK (price >= 0),
    stock                   INTEGER         NOT NULL CHECK (stock >= 0),
    requires_prescription   BOOLEAN         NOT NULL DEFAULT FALSE,
    manufacturer            VARCHAR(120)    NOT NULL,
    description             TEXT,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT uq_medications_sku UNIQUE (sku)
);

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------
-- name: el catálogo permite "búsqueda por nombre" en texto libre; el
-- índice trigram acelera ILIKE '%texto%' en vez de forzar full scan
-- sobre 50 (o miles) de filas cada vez que el usuario escribe.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_medications_name_trgm
    ON medications USING GIN (name gin_trgm_ops);

-- active_ingredient: es uno de los filtros explícitos del taller
-- (buscar por principio activo). B-Tree normal porque suele filtrarse
-- por igualdad o prefijo, no solo por substring.
CREATE INDEX IF NOT EXISTS idx_medications_active_ingredient
    ON medications (active_ingredient);

-- category: el catálogo se navega principalmente por categoría
-- (Analgésicos, Antiinflamatorios, etc.), así que un índice por
-- igualdad evita escanear toda la tabla en cada filtro.
CREATE INDEX IF NOT EXISTS idx_medications_category
    ON medications (category);

-- requires_prescription: se consulta en cada submitOrder para decidir
-- si la orden exige receta. Aunque es booleano (baja cardinalidad),
-- ayuda cuando se combina con otros filtros (índice parcial sobre los
-- que sí requieren fórmula, que normalmente son la minoría).
CREATE INDEX IF NOT EXISTS idx_medications_requires_prescription
    ON medications (requires_prescription)
    WHERE requires_prescription = TRUE;

-- Trigger para mantener updated_at sincronizado en cada UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_medications_updated_at ON medications;
CREATE TRIGGER trg_medications_updated_at
    BEFORE UPDATE ON medications
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- Carritos y órdenes (Write Model)
-- =====================================================================

CREATE TABLE IF NOT EXISTS carts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status      VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CONVERTED', 'ABANDONED')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id        UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    medication_id  INTEGER NOT NULL REFERENCES medications(id),
    quantity       INTEGER NOT NULL CHECK (quantity > 0),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_cart_item UNIQUE (cart_id, medication_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items (cart_id);

CREATE TABLE IF NOT EXISTS prescriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id         UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    document_ref    VARCHAR(120) NOT NULL,
    issued_by       VARCHAR(150) NOT NULL,
    is_valid        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_cart_id ON prescriptions (cart_id);

CREATE TABLE IF NOT EXISTS orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id         UUID NOT NULL REFERENCES carts(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING_APPROVAL'
                        CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'DISPATCHED', 'CANCELLED')),
    total           NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    requires_prescription_check BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    medication_id   INTEGER NOT NULL REFERENCES medications(id),
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_medication_id ON order_items (medication_id);
