# Arquitectura de Pago, Recepcion de Comprobantes y Entrega Digital

> Version: 1.0 | Fecha: 2026-06-21 | Rol: Arquitecto de Sistemas / Administrador de Plataforma

---

## 1. Estado Actual

| Aspecto | Situacion Actual |
|---------|-----------------|
| Pago | Solo transferencia bancaria manual. Stripe esbozado pero no integrado. |
| Comprobantes | Cliente envia por WhatsApp/email fuera del sistema. Sin registro. |
| Verificacion | Admin revisa manualmente su bandeja, cambia estado pending_payment a paid a mano. |
| Entrega | No automatizada. CustomerPortal genera enlace de descarga despues del cambio a paid. |
| Licencias | Funciones generateLicense/validateLicense/activateLicense existen en codigo pero nunca se invocan. |
| Storage | Productos en CloudFront externo. Sin Supabase Storage. Sin subida de archivos de usuarios. |

---

## 2. Flujo de Negocio Objetivo

```
CLIENTE                              SISTEMA                                 ADMIN
──────────────────────────────────────────────────────────────────────────────────────

   ├─ 1. Checkout confirmPayment()
   │   → constructora_orders.status = 'pending_payment'
   │
   ├─ 2. Sube comprobante (PDF/JPG/PNG max 10MB)
   │   → Supabase Storage bucket: payment_receipts
   │   → INSERT payment_proofs.status = 'pending'
   │   → UPDATE order.status = 'awaiting_validation'
   │                                    ├── 3. Notifica admin (email + panel badge)
   │                                    │
   │                                    │◄── 4. Admin revisa (pestana "Comprobantes")
   │                                    │
   │                                    │◄── 5. Aprueba / Rechaza
   │               ┌────────────────────┤
   │               │ APRUEBA:           │
   │               │   payment_proofs → 'approved'
   │               │   order.status → 'paid'
   │               │   process_delivery:
   │               │     - download_link generado
   │               │     - product_license generado (si software)
   │               │     - product_delivery registrado
   │               │     - email notificacion
   │               │     - order.status → 'delivered'
   │               │
   │               │ RECHAZA:
   │               │   payment_proofs → 'rejected' + rejection_reason
   │               │   order.status → 'rejected'
   │               │   notifica al cliente (puede re-subir)
   │               └────────────────────┤
   │
   ├─ 6. Recibe email con enlace de descarga
   ├─ 7. GET /api/download/{token} → Edge Function → signed URL → redirect
   └─ 8. Activa licencia (si software)
```

---

## 3. Arquitectura del Sistema

### 3.1 Nuevos Componentes

| Componente | Tipo | Proposito |
|-----------|------|-----------|
| payment_proofs | Tabla SQL | Registro de cada comprobante subido por cliente |
| payment_receipts | Bucket Storage | Archivos de comprobantes (ordenados por order_id) |
| product_files | Bucket Storage | Archivos reales de productos digitales (privado) |
| receiptService.ts | Servicio Frontend | Upload + consulta de comprobantes |
| FileUploader.tsx | Componente UI | Drag & drop, preview, validacion |
| process_receipt | Edge Function (webhook) | Thumbnail + notificacion admin al recibir comprobante |
| approve_payment | Edge Function (HTTP) | Admin aprueba/rechaza + dispara entrega |
| process_delivery | Edge Function (internal) | Orquesta generacion de enlaces, licencias, email |
| serve_download | Edge Function (HTTP) | Sirve archivos con validacion de token |
| cleanup_job | Edge Function (cron) | Tareas de limpieza programadas |

### 3.2 Tabla: payment_proofs

```sql
CREATE TABLE public.payment_proofs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES public.constructora_orders(id) ON DELETE CASCADE,
    customer_email  TEXT NOT NULL,
    file_path       TEXT NOT NULL,
    file_type       TEXT NOT NULL,
    file_size       INTEGER NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_proofs_order ON payment_proofs(order_id);
CREATE INDEX idx_payment_proofs_status ON payment_proofs(status);
CREATE INDEX idx_payment_proofs_email ON payment_proofs(customer_email);
```

### 3.3 constructora_orders — Nuevos estados

```sql
ALTER TABLE public.constructora_orders
  DROP CONSTRAINT IF EXISTS constructora_orders_status_check;

ALTER TABLE public.constructora_orders
  ADD CONSTRAINT constructora_orders_status_check
  CHECK (status IN (
    'pending_payment',     -- esperando pago
    'awaiting_validation', -- comprobante subido, admin revisa
    'paid',                -- pago confirmado
    'rejected',            -- comprobante rechazado
    'delivered',           -- producto entregado
    'cancelled',           -- cancelado
    'failed',              -- pago fallido
    'refunded'             -- reembolsado
  ));
```

### 3.4 download_links — Columnas nuevas

```sql
ALTER TABLE public.download_links
  ADD COLUMN IF NOT EXISTS file_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS downloaded_at TIMESTAMPTZ;
```

### 3.5 Supabase Storage — Buckets

```
Bucket: payment_receipts (publico con RLS)
  /{order_id}/{uuid}_original.{ext}
  /{order_id}/{uuid}_thumbnail.webp
  RLS: INSERT solo dueno de orden, SELECT dueno/admin, DELETE service_role

Bucket: product_files (privado — solo service_role)
  /{product_code}/{version}/{filename}
  Sin acceso publico. Solo Edge Function con service_role.
```

---

## 4. Edge Functions

### 4.1 process_receipt (Database Webhook on INSERT payment_proofs)
1. Verificar archivo en Storage
2. Generar thumbnail 300px (sharp)
3. Upload thumbnail
4. UPDATE order SET status = 'awaiting_validation'
5. Notificar admin por email

### 4.2 approve_payment (HTTP POST /api/approve-payment)
**Approve:**
1. UPDATE payment_proofs SET status = 'approved', reviewed_by, reviewed_at
2. UPDATE constructora_orders SET status = 'paid'
3. Invocar process_delivery(order_id)

**Reject:**
1. UPDATE payment_proofs SET status = 'rejected', rejection_reason
2. UPDATE constructora_orders SET status = 'rejected'
3. Email al cliente con motivo

### 4.3 process_delivery (Internal invoke)
1. Consultar orden e items
2. Por cada item:
   - Software: generar license_key + download_link
   - Diseno: generar download_link
   - Servicio: notificar admin
3. INSERT product_deliveries
4. UPDATE order SET status = 'delivered'
5. Email con enlace + licencia

### 4.4 serve_download (GET /api/download/{token})
1. Buscar token en download_links
2. Validar: existe (404), no expirado (410), descargas disponibles (410)
3. Incrementar downloads_count + downloaded_at
4. Generar signed URL (60s expiracion)
5. Redirect 302 a signed URL

### 4.5 cleanup_job (Cron diario 00:00 UTC)
1. DELETE download_links expirados (>30d)
2. Auto-cancelar orders pending_payment >7d
3. Auto-cancelar orders awaiting_validation >7d
4. Limpiar archivos huerfanos en storage

---

## 5. Estimacion de Esfuerzo

| Fase | Descripcion | Arch mod | Arch new | Dias |
|------|------------|:-------:|:--------:|:----:|
| F1 | Base de Datos e Infraestructura | 0 | 1 | 0.5 |
| F2 | Servicio receiptService.ts | 0 | 1 | 0.5 |
| F3 | Componente FileUploader.tsx | 0 | 1 | 1 |
| F4 | Subida en Checkout.tsx | 1 | 0 | 0.5 |
| F5 | Customer Portal estados/acciones | 1 | 0 | 2 |
| F6 | Admin pestana Comprobantes | 1 | 0 | 2 |
| F7 | Automatizacion entrega digital | 1 | 0 | 1 |
| F8 | Edge Functions (5 funciones) | 0 | 5 | 3 |
| F9 | Notificaciones email | 1 | 0 | 0.5 |
| F10 | Storage archivos productos | 0 | 0 (config) | 0.5 |
| F11 | Servicio admin receiptAdminService | 0 | 1 | 0.5 |
| F12 | Seguridad y rate limiting | 0 | 0 (config) | 1 |
| F13 | Mejoras UX frontend | 2 | 0 | 1 |
| F14 | Testing (unit, integ, e2e) | 0 | 2-3 | 2 |
| F15 | Monitoreo y operaciones | 0 | 0 (config) | 0.5 |
| F16 | Limpieza deuda tecnica | 2 | 0 | 0.5 |
| **Total** | | **9** | **11-12** | **~16 days** |

---

## 6. Roadmap Priorizado

### MVP (Semanas 1-2)
| Dia | Actividades |
|-----|------------|
| 1 | F1 infraestructura SQL + Storage buckets |
| 2-3 | F2 receiptService + F3 FileUploader + F4 Checkout upload |
| 4-6 | F5 Customer Portal estados + F6 Admin comprobantes |
| 7-8 | F7 automatizacion entrega digitalDeliveryService |
| 9-11 | F8 Edge Functions (5 funciones) |
| 12 | F9 plantillas email + F10 Storage productos |
| 13-14 | F11 servicio admin + F12 seguridad rate limiting |
| 15-16 | F13 UX + F14 testing + F15 monitoreo + F16 limpieza |

### Post-MVP
- Integracion pasarela de pago real (Stripe/PayPal)
- Notificaciones push en tiempo real (WebSockets)
- Dashboard de metricas de ventas y entregas
- API publica para consulta de estados de pedido
- Escaneo antivirus en comprobantes subidos
- Compresion automatica de imagenes
- Multi-tenant (varias empresas)
