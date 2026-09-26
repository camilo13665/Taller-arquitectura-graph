# Casos de prueba manuales — Afirmative Pill

Ejecutar con el backend corriendo en `http://localhost:4000/graphql`
(usar Apollo Sandbox / GraphiQL en esa URL) y el frontend en
`http://localhost:5173`.

---

### 1. Buscar medicamentos

```graphql
query {
  medications(filter: { name: "acetaminofen" }) {
    items { id name price presentation }
    total
  }
}
```
**Esperado:** devuelve "Acetaminofén Forte" (u otros que coincidan) sin traer `stock`, `manufacturer` ni `description` — demuestra ausencia de over-fetching.

---

### 2. Filtrar por categoría

```graphql
query {
  medications(filter: { category: "Analgésicos" }, page: 1, limit: 5) {
    items { name category }
    total
  }
}
```
**Esperado:** solo medicamentos de esa categoría, `total` refleja el conteo real (no solo los 5 devueltos).

---

### 3. Ver detalle

```graphql
query {
  medication(id: "1") {
    name manufacturer activeIngredient description price stock requiresPrescription
  }
}
```
**Esperado:** todos los campos del medicamento con id 1.

---

### 4. Crear carrito

```graphql
mutation { createCart { success cart { id status } } }
```
**Esperado:** `success: true`, `cart.status: "OPEN"`. Guardar el `id` para los siguientes pasos.

---

### 5. Agregar medicamento

```graphql
mutation {
  addItemToCart(input: { cartId: "CART_ID", medicationId: "1", quantity: 2 }) {
    success
    cart { total items { quantity subtotal } }
    error { code message }
  }
}
```
**Esperado:** `success: true`, el carrito refleja 2 unidades y el subtotal correcto.

---

### 6. Comprar medicamento OTC (sin fórmula)

Usar un medicamento con `requiresPrescription: false` (ej. Acetaminofén) y ejecutar:

```graphql
mutation { submitOrder(input: { cartId: "CART_ID" }) { success order { id status total } } }
```
**Esperado:** `order.status: "APPROVED"` inmediatamente (no requiere revisión).

---

### 7. Intentar comprar medicamento con fórmula sin receta

Agregar al carrito un medicamento con `requiresPrescription: true` y llamar `submitOrder` sin haber llamado antes `validatePrescription`.

**Esperado:** `order.status: "PENDING_APPROVAL"` (la orden se crea, pero no se aprueba automáticamente).

---

### 8. Comprar medicamento con fórmula válida

```graphql
mutation {
  validatePrescription(input: { cartId: "CART_ID", documentRef: "RX-001", issuedBy: "Dr. Pérez" }) {
    success
  }
}
```
Luego `submitOrder` con el mismo carrito.

**Esperado:** `order.status: "APPROVED"` porque ya existe una prescripción válida asociada al carrito.

---

### 9. Intentar comprar más unidades que el stock

```graphql
mutation {
  addItemToCart(input: { cartId: "CART_ID", medicationId: "1", quantity: 999999 }) {
    success
    error { code message }
  }
}
```
**Esperado:** `success: false`, `error.code: "INSUFFICIENT_STOCK"`.

---

### 10. Ver cambio de estado de la orden (Subscription)

En una pestaña del frontend, abrir `/orders/ORDER_ID` (queda suscrito). En Apollo Sandbox, ejecutar:

```graphql
mutation { approveOrder(orderId: "ORDER_ID") { success order { status } } }
```
**Esperado:** la página de seguimiento cambia de estado **sin recargar**, en tiempo real.

---

### 11. Demostrar DataLoader

Consultar una orden con varios items:

```graphql
query { order(id: "ORDER_ID") { items { medication { name } } } }
```
**Esperado:** en la consola del backend aparece **una sola línea**:
```
[DataLoader] batchLoadFn agrupó N solicitudes -> ids=[...]
```
en vez de N líneas de `[MedicationRepository] Consulta AGRUPADA...` individuales — confirma que las N resoluciones de `medication` se agruparon en una sola consulta SQL.

---

### 12. Comprobar que el frontend solo usa GraphQL

Abrir DevTools → pestaña **Network** → filtrar por `Fetch/XHR` y por `WS`.

**Esperado:**
- Todas las peticiones HTTP van a `POST /graphql` (ninguna a rutas REST como `/api/medications`).
- Existe una conexión WebSocket abierta hacia `/graphql` para las subscriptions.
