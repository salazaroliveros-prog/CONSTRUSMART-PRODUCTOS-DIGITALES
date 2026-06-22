# Checklist Técnico — Implementación de Pago, Comprobantes y Entrega Digital

> **Formato:** `[ ]` pendiente, `[x]` completado, `[~]` en progreso
> **Prioridad:** 🔴 Alta, 🟡 Media, 🟢 Baja

---

### FASE 1 — Base de Datos e Infraestructura (🔴)

- [ ] **1.1** Crear bucket `payment_receipts` en Supabase Storage
  - Configurar RLS: INSERT anon con validación, SELECT dueño/admin
  - Límite: 10MB por archivo
  - Tipos: `image/png`, `image/jpeg`, `image/webp`, `application/pdf`
- [ ] **1.2** Crear bucket `product_files` (privado, solo service_role)
  - Subir archivos de productos existentes
- [ ] **1.3** Migración SQL: crear tabla `payment_proofs`
- [ ] **1.4** Migración SQL: actualizar CHECK de `constructora_orders.status`
- [ ] **1.5** Migración SQL: columnas `file_storage_path`, `downloaded_at` en `download_links`
- [ ] **1.6** Habilitar Realtime en Supabase para `payment_proofs`
- [ ] **1.7** Índices en `payment_proofs(order_id, status, customer_email)` y `download_links(token)`

### FASE 2 — Servicio Frontend: `receiptService.ts` (🔴)

- [ ] **2.1** Crear `src/lib/receiptService.ts` con:
  - `uploadReceipt(orderId, customerEmail, file, onProgress?)`
  - `getReceipts(orderId): PaymentProof[]`
  - `getReceiptUrl(filePath): string | null`
- [ ] **2.2** Validaciones client-side:
  - Tipos: solo `image/png`, `image/jpeg`, `image/webp`, `application/pdf`
  - Tamaño: max 10MB
  - Rate: máximo 5 subidas por orden

### FASE 3 — Componente UI: `FileUploader.tsx` (🔴)

- [ ] **3.1** Crear `src/components/FileUploader.tsx`:
  - Drag & drop zone, click para seleccionar, preview, barra de progreso
  - Estados: idle, uploading, success, error
  - Props: `accept`, `maxSizeMB`, `onUpload`
- [ ] **3.2** Manejo de errores: archivo grande, tipo no permitido, red, límite

### FASE 4 — Checkout: Subida de Comprobante (🔴)

- [ ] **4.1** Modificar `Checkout.tsx` - en pantalla de éxito post-confirmPayment:
  - Seccion "Subir comprobante de pago" con FileUploader
  - Texto instructivo con datos bancarios
  - Estado: "Recibido - Pendiente de verificacion" tras subir exitosamente
  - Si rechazado: mostrar motivo + re-subir

### FASE 5 — Customer Portal: Estados y Acciones (🔴)

- [ ] **5.1** Modificar `CustomerPortal.tsx`:
  - Tabla: Fecha | Producto | Monto | Estado (badge color) | Accion
  - Mapa de estados con colores
  - `pending_payment`: FileUploader + datos bancarios
  - `awaiting_validation`: preview del comprobante
  - `rejected`: mostrar motivo + "Subir Nuevo"
  - `paid`: "Descargar" (enlace ya generado)
  - `delivered`: descarga + licencia + contador de descargas restantes

### FASE 6 — Admin: Pestaña de Comprobantes (🔴)

- [ ] **6.1** Pestaña `receipts` en `Admin.tsx`:
  - Tabla: Fecha | Cliente | Email | Producto | Monto | Comprobante | Estado | Accion
  - Filtro por defecto: `status = pending`
  - Preview thumbnail clickeable en modal
- [ ] **6.2** Boton "Aprobar": confirmacion, llama a Edge Function, refresh
- [ ] **6.3** Boton "Rechazar": modal con textarea (motivo), llama a Edge Function
- [ ] **6.4** Cards: Pendientes | Aprobados hoy | Rechazados

### FASE 7 — Automatizacion de Entrega (🔴)

- [ ] **7.1** Modificar `digitalDeliveryService.ts`:
  - `processDelivery(orderId)` - orquesta: consulta items, genera enlaces/licencias, crea delivery, status delivered
  - `generateDownloadLink(orderId, email, filePath)` - token con file_storage_path real
  - `generateLicenseKey(productCode)` - formato: `CGT-{productCode}-{randomHex8}`
  - Asegurar idempotencia (verificar duplicados)
- [ ] **7.2** Integrar `processDelivery` en el flujo de aprobacion (Fase 6)
- [ ] **7.3** Refactorizar `CustomerPortal.tsx`: mostrar enlace ya generado, no generar a demanda

### FASE 8 — Edge Functions en Supabase (🔴)

- [ ] **8.1** Configurar entorno Supabase CLI local
  - `supabase init`, `supabase link --project-ref`
- [ ] **8.2** `supabase/functions/process_receipt/index.ts` - webhook en INSERT payment_proofs
  - Generar thumbnail, actualizar orden a awaiting_validation, notificar admin
- [ ] **8.3** `supabase/functions/approve_payment/index.ts` - HTTP POST
  - Aprobar: actualizar payment_proofs + order a paid, invocar process_delivery
  - Rechazar: actualizar payment_proofs + order a rejected, email al cliente
- [ ] **8.4** `supabase/functions/process_delivery/index.ts` - internal invoke
  - Generar download_links, product_licenses, product_deliveries, email
- [ ] **8.5** `supabase/functions/serve_download/index.ts` - HTTP GET
  - Validar token, signed URL de Storage (60s), redirect 302, contador descargas
- [ ] **8.6** `supabase/functions/cleanup_job/index.ts` - cron diario
  - Eliminar enlaces expirados, auto-rechazar ordenes >7d, limpiar storage
- [ ] **8.7** Desplegar todas las funciones: `supabase functions deploy`
- [ ] **8.8** Configurar Database Webhook: INSERT en `payment_proofs` -> `process_receipt`
- [ ] **8.9** Configurar cron job para `cleanup_job` (diario 00:00 UTC)

### FASE 9 — Sistema de Notificaciones (🟡)

- [ ] **9.1** Actualizar `emailService.ts` con nuevas plantillas:
  - `sendReceiptReceived(email, orderId, name)`
  - `sendPaymentApproved(email, orderId, downloadLink)`
  - `sendPaymentRejected(email, orderId, reason)`
  - `sendDeliveryReady(email, orderId, downloadLink, licenseKey?)`
  - `sendAdminNewReceipt(adminEmail, customerName, orderId, amount)`
- [ ] **9.2** Plantillas HTML con: logo, contacto real, numero de orden, enlace, licencia

### FASE 10 — Supabase Storage: Archivos de Productos (🟡)

- [ ] **10.1** Subir archivos a `product_files/{product_code}/`
- [ ] **10.2** Registrar `file_storage_path` en `constructionData.ts` o DB
- [ ] **10.3** Firmar URLs con expiracion corta (60s) en `serve_download`

### FASE 11 — Frontend: Servicio Admin (🟡)

- [ ] **11.1** Crear `src/lib/receiptAdminService.ts`:
  - `getPendingReceipts(filters?)`, `approveReceipt(proofId)`, `rejectReceipt(proofId, reason)`, `getReceiptStats()`
- [ ] **11.2** Llamar a Edge Function `approve_payment` desde Admin con `supabase.functions.invoke()`

### FASE 12 — Seguridad y Rate Limiting (🔴)

- [ ] **12.1** Server-side validation en Edge Functions: MIME real (magic bytes), tamano
- [ ] **12.2** Rate limit: max 5 subidas por order_id en 1 hora (control en Edge Function)
- [ ] **12.3** Rate limit descargas: max 5 por token, token expira en 7 dias
- [ ] **12.4** Verificar que `customer_email` de `payment_proofs` coincida con `constructora_orders.customer_email`
- [ ] **12.5** Audit trail: `reviewed_by`, `reviewed_at`, `downloaded_at`, `downloads_count`

### FASE 13 — Frontend: Mejoras UX (🟢)

- [ ] **13.1** Notificaciones en tiempo real para admin (Supabase Realtime o polling 30s)
- [ ] **13.2** Modales de confirmacion antes de aprobar/rechazar
- [ ] **13.3** Estados vacios: "No hay comprobantes pendientes" con icono
- [ ] **13.4** Loading states en operaciones asincronas
- [ ] **13.5** Toast notifications para feedback de acciones

### FASE 14 — Testing (🔴)

- [ ] **14.1** Tests unitarios: `receiptService`, `digitalDeliveryService`, `generateLicenseKey`
- [ ] **14.2** Tests integracion: flujo completo checkout->subir->aprobar->entregar->descargar
- [ ] **14.3** Tests Edge Functions: `serve_download` (token valido/expirado/agotado)
- [ ] **14.4** Playwright E2E: checkout, subir comprobante, aprobar, verificar entrega

### FASE 15 — Monitoreo y Operaciones (🟢)

- [ ] **15.1** Logs estructurados en Edge Functions (JSON)
- [ ] **15.2** Alertas: comprobante >48h pendiente, errores en Edge Functions
- [ ] **15.3** Metricas en Supabase Dashboard: subidas/dia, aprobaciones/dia, descargas/dia

### FASE 16 — Limpieza y Deuda Tecnica (🟢)

- [ ] **16.1** Eliminar archivos no usados: `functions/stripe-webhook/`, `functions/create-payment-intent/`, `test_*.mjs`, `check_*.mjs`, `console-errors*.log`
- [ ] **16.2** Actualizar `.gitignore`: `*.mjs`, `*.log`, `session-*.md`
- [ ] **16.3** Eliminar referencias a Stripe muertas en `Checkout.tsx` y `Admin.tsx`
- [ ] **16.4** Refactorizar `digitalDeliveryService.ts`: eliminar metodos no utilizados
