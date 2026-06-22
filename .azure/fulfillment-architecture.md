# Diseno de Logistica Digital y Arquitectura de Comercio Electronico

## ConstructoraGT / Construsmart — Documento de Arquitectura de Fulfillment

---

## 1. Vision General del Sistema

### 1.1 Declaracion de Problema

El sistema actual tiene productos estaticos en codigo, fulfillment semi-automatico con brechas, y ninguna interfaz para que el administrador gestione productos o portfolio visual. No hay catalogo dinamico, no hay carrusel de proyectos, y las notificaciones post-compra estan ausentes.

### 1.2 Objetivo

Disenar un sistema de comercio digital donde:

1. El administrador pueda **crear, editar y publicar productos** sin tocar codigo
2. El administrador pueda **subir archivos de producto** (PDFs, Zips, imagenes) a un bucket de Storage
3. El **fulfillment sea automatico** al aprobar un pago: licencia + enlace de descarga + email
4. El cliente pueda **navegar un catalogo dinamico** con productos desde la base de datos
5. El cliente pueda **ver un portfolio visual** con carrusel de proyectos ejecutados
6. Todo el flujo **termine con una entrega digital verificable**

### 1.3 Principios de Diseno

- **Base de datos como fuente unica de verdad** para productos, no codigo estatico
- **Event-driven fulfillment**: cada cambio de estado dispara el siguiente paso
- **Idempotencia**: ningun trigger debe duplicar entregas si se ejecuta multiple veces
- **Observabilidad**: cada accion queda registrada con timestamp y responsable

---

## 2. Arquitectura de Datos

### 2.1 Nueva Tabla: `products`

```sql
CREATE TABLE public.products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            TEXT UNIQUE NOT NULL,          -- 'app-calculo', 'erp-completo'
    name            TEXT NOT NULL,                  -- 'App Calculo y Presupuesto'
    category        TEXT NOT NULL CHECK (category IN ('Software', 'Diseno', 'Servicio')),
    price           DECIMAL(10,2) NOT NULL,
    price_label     TEXT,                           -- 'Q1,495'
    description     TEXT NOT NULL,
    features        JSONB DEFAULT '[]',             -- ["Feature 1", "Feature 2"]
    image_url       TEXT,                            -- URL de imagen del producto
    badge           TEXT,                            -- 'Mas Vendido', 'Premium', NULL
    file_storage_path TEXT,                          -- Ruta en bucket product_files/
    is_active       BOOLEAN DEFAULT true,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_products_active ON products(is_active, sort_order);
```

### 2.2 Nueva Tabla: `portfolio_projects`

```sql
CREATE TABLE public.portfolio_projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    description     TEXT,
    category        TEXT,                            -- 'Construccion', 'Diseno', 'Topografia'
    location        TEXT,
    client_name     TEXT,
    completion_date DATE,
    is_featured     BOOLEAN DEFAULT false,
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.portfolio_images (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID REFERENCES public.portfolio_projects(id) ON DELETE CASCADE,
    image_url       TEXT NOT NULL,
    caption         TEXT,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_portfolio_images_project ON portfolio_images(project_id, sort_order);
```

### 2.3 Migracion de Datos

Los productos estaticos actuales en `constructionData.ts` deben migrarse a la tabla `products`:

```sql
INSERT INTO public.products (code, name, category, price, description, features, badge, sort_order) VALUES
('app-calculo', 'App Calculo y Presupuesto', 'Software', 1495, '...',
 '["Calculo de materiales","Presupuestos detallados","Base de datos de precios actualizados"]'::jsonb,
 'Mas Vendido', 1),
('erp-completo', 'ERP Completo para Constructoras', 'Software', 9995, '...',
 '["Modulo de inventario","Gestion de compras","Control de proyectos"]'::jsonb,
 'Premium', 2),
-- ... resto de productos
```

### 2.4 Tabla `constructora_orders` — Optimizacion

Agregar columna `product_id UUID REFERENCES products(id)` para relacion directa orden-producto:

```sql
ALTER TABLE public.constructora_orders
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id);
```

---

## 3. Flujo de Negocio Completo

### 3.1 User Journey — Cliente

```
DESCUBRIMIENTO                          CHECKOUT                        POST-COMPRA
─────────────────                       ───────                         ──────────

1. Landing Page                         5. Checkout                      8. Sube comprobante
   ├─ Hero + CTA                         ├─ Resumen del pedido             ├─ FileUploader
   ├─ Catalogo dinamico                  ├─ Datos bancarios               ├─ Validacion tipo/tamano
   │  (desde tabla products)             ├─ Confirma orden                ├─ Upload a Storage
   │                                     └─ Orden creada                  └─ Estado: awaiting_validation
2. Producto individual                                     status: pending_payment
   ├─ Descripcion                                                                          (espera admin)
   ├─ Features
   ├─ Precio                                                                             9. Recibe email
   └─ Boton "Adquirir"                                                                      "Producto listo"
                                                                                            ├─ Enlace descarga
3. Formulario de compra                                                                    └─ Licencia (si app)
   ├─ Nombre, Email, Telefono
   ├─ Codigo promocional (opcional)                                                    10. Descarga
   └─ Redirige a checkout                                                                   ├─ Token valido?
                                                                                            ├─ No expirado?
4. Portfolio / Servicios                                                                    ├─ Descargas < max?
   ├─ Carrusel de proyectos                                                                └─ Signed URL → archivo
   ├─ Categorias
   ├─ Testimonios                                                                      11. Activa licencia
   └─ Contacto                                                                            ├─ Ingresa license_key
                                                                                          └─ Device activation
```

### 3.2 User Journey — Administrador

```
GESTION DE PRODUCTOS                    GESTION DE PEDIDOS               FULFILLMENT
────────────────────                    ─────────────────                ──────────

1. Panel Admin                         4. Pestana Ventas                6. Revisa comprobante
   ├─ Dashboard                          ├─ Tabla de pedidos              ├─ Preview imagen
   ├─ Productos (NUEVO)                  ├─ Filtros por estado            ├─ Datos del cliente
   │  ├─ Lista productos                 ├─ Detalle del pedido            ├─ Monto
   │  ├─ Agregar producto                                                    ├─ Boton APROBAR
   │  │  ├─ Nombre, precio, categoria 5. Pestana Comprobantes              └─ Boton RECHAZAR
   │  │  ├─ Descripcion, features        ├─ Cards: Pendientes/Aprobados
   │  │  ├─ Imagen del producto          ├─ Tabla de comprobantes      7. Al APROBAR:
   │  │  └─ Archivo del producto         ├─ Preview imagen                ├─ payment_proofs → approved
   │  ├─ Editar producto                ├─ Boton Aprobar                  ├─ order → paid
   │  └─ Desactivar producto             └─ Boton Rechazar                ├─ FULFILLMENT:
   │                                                                        │  ├─ Generar licencia
2. Portfolio (NUEVO)                    6a. Formulario RECHAZAR            │  ├─ Generar download_link
   ├─ Lista proyectos                    ├─ Motivo del rechazo            │  ├─ delivery → delivered
   ├─ Agregar proyecto                   └─ Confirmar                     │  └─ Enviar EMAIL
   │  ├─ Titulo, descripcion, location                                     └─ order → delivered
   │  ├─ Categoria, cliente, fecha
   │  └─ Subir imagenes (multiples)   8. Al RECHAZAR:                  7. Verificar entrega
   ├─ Editar proyecto                    ├─ payment_proofs → rejected      ├─ Historial de entregas
   └─ Reordenar imagenes                 ├─ order → rejected               ├─ Enlaces activos
                                         ├─ Enviar EMAIL con motivo       └─ Licencias generadas
3. Archivos de producto                  └─ Cliente puede re-subir
   ├─ Subir archivo a product_files/
   ├─ Asignar a producto
   └─ Versionado (opcional)
```

### 3.3 Maquina de Estados de Orden

```
                  ┌──────────────────────────────────────────────────┐
                  │                                                  │
                  v                                                  │
         ┌───────────────┐                                           │
    ┌───>│ pending_payment│─── (cliente sube comprobante) ───┐      │
    │    └───────────────┘                                   │      │
    │                                                       v      │
    │                                              ┌──────────────────────┐
    │                                              │ awaiting_validation  │
    │                                              └──────────┬───────────┘
    │                                                         │
    │                                    ┌────────────────────┼────────────────────┐
    │                                    │                    │                    │
    │                                    v                    v                    v
    │                           ┌──────────────┐    ┌───────────────┐    ┌──────────────┐
    │                           │    paid      │    │   rejected    │    │  cancelled   │
    │                           └──────┬───────┘    └───────┬───────┘    └──────────────┘
    │                                  │                    │
    │                                  │ (auto)             │ (cliente re-subir)
    │                                  v                    v
    │                           ┌──────────────┐    ┌───────────────┐
    │                           │  delivered   │    │ pending_payment│──┘
    │                           └──────────────┘    └───────────────┘
    │                                  │
    │                                  │ (30d expira enlace)
    │                                  v
    │                           ┌──────────────┐
    │                           │   expired    │
    │                           └──────────────┘
    │
    └─────────────────────────────────────────────────────────────────────── (cliente no paga, 7d auto-cancel)
```

---

## 4. Automatizacion de Fulfillment

### 4.1 Trigger: Cliente sube comprobante

```
Evento: INSERT en payment_proofs
┌──────────────────────────────────────────────────────────────┐
│ Accion:                                                     │
│   1. Verificar que el archivo existe en Storage             │
│   2. Generar thumbnail (si es imagen)                       │
│   3. UPDATE constructora_orders SET status =                │
│      'awaiting_validation' WHERE id = order_id              │
│   4. Enviar email al admin: "Nuevo comprobante pendiente"   │
│   5. Enviar email al cliente: "Comprobante recibido"        │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Trigger: Admin aprueba comprobante

```
Evento: Admin hace click en "Aprobar" (via receiptAdminService)
┌──────────────────────────────────────────────────────────────┐
│ Accion:                                                     │
│   1. UPDATE payment_proofs SET status = 'approved',         │
│      reviewed_by = auth.uid(), reviewed_at = now()          │
│   2. UPDATE constructora_orders SET status = 'paid'         │
│   3. INICIAR FULFILLMENT:                                   │
│      a. Obtener product_id de la orden                      │
│      b. Buscar file_storage_path del producto               │
│         (de products.file_storage_path o mapeo por defecto) │
│      c. Generar token de descarga (UUID v4)                 │
│      d. INSERT en download_links:                           │
│           - token, order_id, product_id, customer_email     │
│           - file_storage_path, expires_at (7d)              │
│           - max_downloads (5), downloads_count (0)          │
│      e. Si categoria = 'Software':                          │
│           - Generar license_key: CGT-{code}-{hex8}          │
│           - INSERT en product_licenses                      │
│      f. INSERT en product_deliveries (status = 'delivered') │
│   4. UPDATE constructora_orders SET status = 'delivered'    │
│   5. Enviar EMAIL al cliente:                               │
│      "Pago confirmado - Tu producto esta listo"             │
│      ├─ Enlace de descarga: /download/{token}              │
│      ├─ Licencia (si aplica)                               │
│      └─ Instrucciones de activacion                         │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 Trigger: Admin rechaza comprobante

```
Evento: Admin hace click en "Rechazar" (via receiptAdminService)
┌──────────────────────────────────────────────────────────────┐
│ Accion:                                                     │
│   1. UPDATE payment_proofs SET status = 'rejected',         │
│      rejection_reason = motivo, reviewed_at = now()         │
│   2. UPDATE constructora_orders SET status = 'rejected'     │
│   3. Enviar EMAIL al cliente:                               │
│      "Tu comprobante fue rechazado"                         │
│      ├─ Motivo del rechazo                                  │
│      └─ Link para subir un nuevo comprobante                │
└──────────────────────────────────────────────────────────────┘
```

### 4.4 Trigger: Descarga de producto

```
Evento: GET /api/download/{token}
┌──────────────────────────────────────────────────────────────┐
│ Validaciones:                                               │
│   1. Token existe? → 404 si no                              │
│   2. Expires_at > now()? → 410 si expiro                   │
│   3. Downloads_count < max_downloads? → 410 si agotado     │
│                                                             │
│ Accion:                                                     │
│   4. UPDATE download_links SET downloads_count += 1,        │
│      downloaded_at = now()                                  │
│   5. Crear signed URL de Supabase Storage (60s expiracion)  │
│   6. HTTP 302 Redirect → signed URL                         │
└──────────────────────────────────────────────────────────────┘
```

### 4.5 Trigger Programado: Cleanup (Cron Diario)

```
Schedule: Todos los dias 00:00 UTC
┌──────────────────────────────────────────────────────────────┐
│ Accion:                                                     │
│   1. Cancelar ordenes pending_payment > 7 dias              │
│   2. Cancelar ordenes awaiting_validation > 7 dias          │
│   3. Eliminar download_links expirados > 30 dias            │
│   4. Enviar reminder a ordenes pending_payment > 48h        │
│      (recordatorio de pago)                                 │
│   5. Enviar reminder a ordenes awaiting_validation > 48h    │
│      (aviso al admin: comprobante sin revisar)              │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Diseno del Catalogo de Productos

### 5.1 Arquitectura Frontend

```typescript
// src/lib/productService.ts (NUEVO)
interface Product {
  id: string;
  code: string;
  name: string;
  category: 'Software' | 'Diseno' | 'Servicio';
  price: number;
  price_label: string;
  description: string;
  features: string[];
  image_url: string | null;
  badge: string | null;
  file_storage_path: string | null;
  is_active: boolean;
  sort_order: number;
}

class ProductService {
  async getActiveProducts(): Promise<Product[]>
  async getProductByCode(code: string): Promise<Product | null>
  async getProductsByCategory(category: string): Promise<Product[]>
}
```

### 5.2 Migracion desde Datos Estaticos

Fase 1: ProductsSection.tsx intenta cargar desde `productService.getActiveProducts()`
Fase 2: Si hay datos, usa DB; si no, fallback a `DIGITAL_PRODUCTS` estatico
Fase 3: Eliminar `DIGITAL_PRODUCTS` de `constructionData.ts`

### 5.3 Admin UI para Productos

Nueva pestana en Admin.tsx: `tab === 'products'`

```
┌─────────────────────────────────────────────────────────┐
│ Gestion de Productos                        [Agregar]   │
├─────────────────────────────────────────────────────────┤
│ [Filtro: Todos | Software | Diseno]                     │
├──────────┬──────────┬──────┬──────────┬────────┬───────┤
│ Producto │ Categ.   │Precio│ Archivo  │ Estado │ Accion│
├──────────┼──────────┼──────┼──────────┼────────┼───────┤
│ App Calc │ Software │Q1495 │ subido   │ Activo │ Editar│
│ ERP Comp │ Software │Q9995 │ pendiente│ Activo │ Editar│
│ Disenos  │ Diseno   │Q3500 │ subido   │ Inact. │ Editar│
└──────────┴──────────┴──────┴──────────┴────────┴───────┘
```

Formulario de producto:
- Nombre, Codigo, Categoria (select), Precio
- Descripcion (textarea), Features (lista dinamica +/-, similar a tags)
- Imagen URL (input text + preview)
- Badge (select: "Mas Vendido" / "Premium" / "Recomendado" / Ninguno)
- Archivo de producto (FileUploader → sube a `product_files/{code}/`)
- Activo (toggle)
- Orden (numero)

### 5.4 Actualizacion del `PRODUCT_FILE_MAP`

Reemplazar el mapeo estatico en `digitalDelivery.ts` con consulta a la base de datos:

```typescript
async function getProductStoragePath(productId: string): Promise<string | null> {
  const { data } = await supabase
    .from('products')
    .select('file_storage_path')
    .eq('id', productId)
    .single();
  return data?.file_storage_path || null;
}
```

O, como fallback durante la migracion, mantener el mapeo pero poblar desde `products.file_storage_path` primero.

---

## 6. Diseno del Portfolio / Carrusel de Proyectos

### 6.1 Componentes UI

```
src/components/
├── PortfolioSection.tsx      (NUEVO) - Seccion completa
├── PortfolioCarousel.tsx     (NUEVO) - Carrusel con embla-carousel
├── PortfolioCard.tsx         (NUEVO) - Tarjeta de proyecto
└── PortfolioModal.tsx        (NUEVO) - Modal con detalle + galeria
```

### 6.2 Comportamiento del Carrusel

```
┌─────────────────────────────────────────────────────────────┐
│  Portfolio / Proyectos Ejecutados                           │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │
│  │      │ │      │ │      │ │      │ │      │             │
│  │ Img  │ │ Img  │ │ Img  │ │ Img  │ │ Img  │  ←── drag  │
│  │      │ │      │ │      │ │      │ │      │     scroll  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘             │
│  ● ● ○ ○ ○   (dots de navegacion)                          │
│  [<]                    [>]                                 │
│                                                             │
│  Al hacer click: Modal con detalle completo                 │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Carrusel interno de imagenes del proyecto          │     │
│  │  Titulo, descripcion, ubicacion, cliente            │     │
│  │  Fecha de finalizacion                              │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Efectos Visuales

```css
/* Transicion suave entre slides */
.embla__slide {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* Efecto de profundidad: slide activo se escala, laterales se oscurecen */
.embla__slide:not(.is-selected) {
  opacity: 0.6;
  transform: scale(0.92);
}

/* Hover: elevacion con sombra */
.portfolio-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.12);
}

/* Imagen con overlay gradiente */
.portfolio-card img {
  mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
}
```

### 6.4 Admin UI para Portfolio

Nueva pestana en Admin.tsx: `tab === 'portfolio'`

```
┌─────────────────────────────────────────────────────────┐
│ Gestion de Portfolio                        [Agregar]   │
├─────────────────────────────────────────────────────────┤
│ Proyectos destacados (featured)                         │
├──────────┬──────────┬──────────┬──────────┬────────────┤
│ Titulo   │ Categ.   │ Cliente  │ Imagenes │  Accion    │
├──────────┼──────────┼──────────┼──────────┼────────────┤
│ Casa Hab │ Construc │ Juan P.  │ 5 fotos  │ Editar [x] │
│ Diseno   │ Diseno   │ Maria G. │ 3 fotos  │ Editar [x] │
└──────────┴──────────┴──────────┴──────────┴────────────┘
```

Formulario de proyecto:
- Titulo, Descripcion, Categoria (select)
- Ubicacion, Cliente, Fecha de finalizacion
- Destacado (toggle), Orden
- Galeria de imagenes:
  - Subir multiples archivos (multi-file upload)
  - Reordenar con drag & drop
  - Eliminar individual
  - Caption por imagen

---

## 7. Sistema de Notificaciones por Email

### 7.1 Nuevas Plantillas en `emailService.ts`

```typescript
// NOTA: Las funciones sendReceiptReceived, sendPaymentApproved,
// sendPaymentRejected, sendDeliveryReady, sendAdminNewReceipt
// deben ser IMPLEMENTADAS (estan en el diseno pero no en codigo)

sendReceiptReceived(customerEmail: string, orderId: string, customerName: string): Promise<void>
  Asunto: "Hemos recibido tu comprobante de pago - Construsmart"
  Template: Logo + "Gracias {name}, hemos recibido tu comprobante"
            + Orden #{orderId}
            + "Lo revisaremos en 24h habiles"

sendPaymentApproved(customerEmail: string, orderId: string, downloadLink: string): Promise<void>
  Asunto: "Pago confirmado - Tu producto esta listo"
  Template: Logo + "!Pago aprobado!"
            + Boton "Descargar Producto" (link al portal)
            + Orden #{orderId}

sendPaymentRejected(customerEmail: string, orderId: string, reason: string): Promise<void>
  Asunto: "Comprobante rechazado - Construsmart"
  Template: Logo + "Tu comprobante fue rechazado por: {reason}"
            + Boton "Subir Nuevo Comprobante" (link al portal)
            + Contacto: salazaroliveros@gmail.com / WhatsApp +502 4060 1526

sendDeliveryReady(customerEmail: string, orderId: string, downloadLink: string, licenseKey?: string): Promise<void>
  Asunto: "Tu producto digital esta listo para descargar"
  Template: Logo + "!Tu pedido esta completo!"
            + Boton "Descargar" (enlace directo)
            + Si licenseKey: "Tu licencia: {licenseKey}"
            + "El enlace expira en 7 dias"

sendAdminNewReceipt(adminEmail: string, customerName: string, orderId: string, amount: number): Promise<void>
  Asunto: "[Admin] Nuevo comprobante pendiente - #{orderId}"
  Template: "Cliente: {name}" + "Orden: {orderId}" + "Monto: {amount}"
            + "Revisar en el panel administrativo"
```

### 7.2 Puntos de Integracion

| Punto del flujo | Accion | Email |
|----------------|--------|-------|
| Cliente sube comprobante | `receiptService.uploadReceipt()` success | `sendReceiptReceived` (cliente) + `sendAdminNewReceipt` (admin) |
| Admin aprueba | `receiptAdminService.approveReceipt()` success | `sendPaymentApproved` + `sendDeliveryReady` |
| Admin rechaza | `receiptAdminService.rejectReceipt()` success | `sendPaymentRejected` |
| Cron: 48h pending_payment | `cleanup_job` | Recordatorio de pago |
| Cron: 48h awaiting_validation | `cleanup_job` | Aviso admin |

---

## 8. Flujo Tecnico Detallado

### 8.1 Flujo Completo: Compra → Entrega

```
PASO 1: CHECKOUT
────────────
Cliente en ProductsSection.tsx
├── Click "Adquirir" → modal con form
├── sessionStorage.setItem('checkout_item', { product, customer })
└── navigate('/checkout')

PASO 2: CONFIRMAR ORDEN
────────────
Checkout.tsx: confirmPayment()
├── For each item in items:
│   INSERT INTO constructora_orders
│   (customer_name, customer_email, customer_phone,
│    item_type='producto_digital', item_name, item_category,
│    amount, currency='GTQ', status='pending_payment',
│    notes, product_id)
├── fetch Famous.ai CRM
├── sessionStorage.clear()
└── Mostrar pantalla de exito con FileUploader

PASO 3: SUBIR COMPROBANTE
────────────
FileUploader.tsx → receiptService.uploadReceipt(orderId, file)
├── Validar tipo (PNG/JPG/WebP/PDF)
├── Validar tamano (max 10MB)
├── Contar subidas previas (max 5)
├── Upload file → Supabase Storage bucket: payment_receipts
│   path: {orderId}/{uuid}_original.{ext}
├── INSERT INTO payment_proofs
│   (order_id, customer_email, file_path, file_type,
│    file_size, status='pending')
├── UPDATE constructora_orders SET status='awaiting_validation'
└── Enviar emails:
    ├── sendReceiptReceived (cliente)
    └── sendAdminNewReceipt (admin)

PASO 4: ADMIN REVISA
────────────
Admin.tsx: Pestana 'receipts'
├── Tabla de comprobantes con status='pending'
├── Preview del comprobante (signed URL)
├── Datos del cliente y orden
├── Boton APROBAR → receiptAdminService.approveReceipt(proofId)
└── Boton RECHAZAR → receiptAdminService.rejectReceipt(proofId, reason)

PASO 5: FULFILLMENT (APROBAR)
────────────
receiptAdminService.approveReceipt(proofId)
├── UPDATE payment_proofs SET status='approved', reviewed_at=now()
├── UPDATE constructora_orders SET status='paid'
│   WHERE id = (SELECT order_id FROM payment_proofs WHERE id=proofId)
├── CALL digitalDeliveryService.processOrderDelivery(orderId)
│   ├── GET constructora_orders WHERE id = orderId
│   ├── GET products.file_storage_path WHERE id = order.product_id
│   ├── IF item_category = 'Software':
│   │   ├── license_key = generateLicenseKey()
│   │   └── INSERT INTO product_licenses (...)
│   ├── token = generateToken()
│   ├── INSERT INTO download_links
│   │   (order_id, token, expires_at=7d, max_downloads=5,
│   │    file_storage_path, downloads_count=0)
│   ├── INSERT INTO product_deliveries
│   │   (order_id, product_id, customer_email,
│   │    delivery_status='delivered', download_link)
│   └── UPDATE constructora_orders SET status='delivered'
├── Enviar emails:
│   ├── sendPaymentApproved (cliente)
│   └── sendDeliveryReady (cliente)

PASO 6: CLIENTE DESCARGA
────────────
CustomerPortal.tsx
├── GET constructora_orders WHERE customer_email = auth.email()
├── Show order with status='delivered'
├── Boton "Descargar"
└── GET /api/download/{token}
    ├── Validate token in download_links
    ├── Validate expiry and download count
    ├── UPDATE downloads_count++
    ├── Create signed URL from product_files bucket (60s)
    └── HTTP 302 Redirect
```

### 8.2 Diagrama de Secuencia (Tecnico)

```
CLIENTE NAV          CHECKOUT           SUPABASE         ADMIN          API/VERCEL
    │                   │                  │               │               │
    │─ compra ─────────>│                  │               │               │
    │                   │─ INSERT order ──>│               │               │
    │                   │  (pending_payment)│              │               │
    │                   │<── order_id ─────│               │               │
    │                   │                  │               │               │
    │─ upload receipt ─>│                  │               │               │
    │                   │─ upload file ───>│ (Storage)     │               │
    │                   │─ INSERT proof ──>│               │               │
    │                   │  (pending)       │               │               │
    │                   │─ UPDATE order ──>│               │               │
    │                   │  (awaiting_val)  │               │               │
    │                   │                  │               │               │
    │<── "En revision" ─│                  │               │               │
    │                                        │─ load ─────>│               │
    │                                        │  receipts    │               │
    │                                        │<── list ─────│               │
    │                                        │              │               │
    │                                        │              │─ approve ────│─ approve API
    │                                        │              │  proof_id    │
    │                                        │<── UPDATE ───│              │─ UPDATE proof
    │                                        │  proof=approved           │─ UPDATE order=paid
    │                                        │              │              │─ gen license
    │                                        │<── INSERT ───│              │─ gen download
    │                                        │  licenses    │              │─ INSERT delivery
    │                                        │<── INSERT ───│              │─ UPDATE order=delivered
    │                                        │  deliveries  │              │
    │                                        │              │              │─ send email ──> CLIENTE
    │                                        │              │              │
    │<── email "Producto listo" ─────────────┘              │               │
    │                                        │              │               │
    │─ portal ─────────────────────────────────────────────>│               │
    │<── show download ─────────────────────────────────────│               │
    │                                                        │               │
    │─ /download/token ────────────────────────────────────────────────────>│
    │                                                                       │─ validate token
    │                                                                       │─ signed URL
    │<── 302 redirect ──────────────────────────────────────────────────────│
    │─ signed URL ─────────────────────────>│ (Storage)                     │
    │<── file ──────────────────────────────│                               │
```

---

## 9. Implementacion de Notificaciones

### 9.1 Integracion en `receiptAdminService.ts`

```typescript
// Al APROBAR:
const { error: emailError } = await emailService.sendPaymentApproved(
  proof.customer_email,
  orderId,
  `${import.meta.env.VITE_APP_URL}/portal`
);

// Al RECHAZAR:
await emailService.sendPaymentRejected(
  proof.customer_email,
  orderId,
  reason
);
```

### 9.2 Integracion en `receiptService.ts`

```typescript
// Despues de upload exitoso:
await emailService.sendReceiptReceived(customerEmail, orderId, customerName);

// Notificar admin:
await emailService.sendAdminNewReceipt(
  import.meta.env.VITE_ADMIN_EMAIL,
  customerName,
  orderId,
  amount
);
```

### 9.3 Implementacion de las Funciones en `emailService.ts`

Cada funcion debe construir un HTML template y llamar al edge function `send-email`. El formato base:

```typescript
async sendPaymentApproved(email: string, orderId: string, portalLink: string): Promise<void> {
  const html = `
    <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a2332; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0;">Construsmart</h1>
      </div>
      <div style="padding: 24px;">
        <h2>!Pago confirmado!</h2>
        <p>Tu pago para la orden #${orderId.slice(0, 8)} ha sido aprobado.</p>
        <p>Tu producto esta listo para descargar.</p>
        <a href="${portalLink}"
           style="display: inline-block; background: #f97316; color: white;
                  padding: 12px 24px; text-decoration: none; border-radius: 8px;
                  font-weight: bold;">
          Ir a mis pedidos
        </a>
        <p style="margin-top: 24px; color: #666; font-size: 12px;">
          Si tienes dudas, contactanos a salazaroliveros@gmail.com
        </p>
      </div>
    </div>
  `;
  // Llamar al edge function send-email
  await this.sendEmailRaw(email, 'Pago confirmado - Tu producto esta listo', html);
}
```

---

## 10. Plan de Migracion por Fases

### FASE A: Productos Dinamicos (Semana 1)

| # | Tarea | Archivos | Dependencias |
|---|-------|----------|-------------|
| A1 | Crear tabla `products` y migrar datos | SQL | — |
| A2 | Crear `ProductService` (desde DB) | `src/lib/productService.ts` | A1 |
| A3 | Modificar `ProductsSection` para usar DB | `src/components/ProductsSection.tsx` | A2 |
| A4 | Actualizar `PRODUCT_FILE_MAP` a consulta DB | `src/lib/digitalDelivery.ts` | A1 |
| A5 | Pestana Admin: Gestion de Productos | `src/pages/Admin.tsx` | A1-A4 |
| A6 | Subir archivos de productos a Storage | Supabase Dashboard | — |

### FASE B: Portfolio y Carrusel (Semana 1-2)

| # | Tarea | Archivos | Dependencias |
|---|-------|----------|-------------|
| B1 | Crear tablas `portfolio_projects` + `portfolio_images` | SQL | — |
| B2 | Crear `PortfolioService` | `src/lib/portfolioService.ts` | B1 |
| B3 | Crear `PortfolioSection` con carrusel | `src/components/PortfolioSection.tsx` | B2 |
| B4 | Crear `PortfolioCarousel` (embla-carousel) | `src/components/PortfolioCarousel.tsx` | B3 |
| B5 | Crear `PortfolioModal` (detalle + galeria) | `src/components/PortfolioModal.tsx` | B3 |
| B6 | Integrar PortfolioSection en Index | `src/pages/Index.tsx` | B3-B5 |
| B7 | Pestana Admin: Gestion de Portfolio | `src/pages/Admin.tsx` | B1 |
| B8 | Subir imagenes de proyectos a Storage | Admin UI (B7) | — |

### FASE C: Notificaciones Completas (Semana 2)

| # | Tarea | Archivos | Dependencias |
|---|-------|----------|-------------|
| C1 | Implementar `sendReceiptReceived` | `src/lib/emailService.ts` | — |
| C2 | Implementar `sendPaymentApproved` | `src/lib/emailService.ts` | — |
| C3 | Implementar `sendPaymentRejected` | `src/lib/emailService.ts` | — |
| C4 | Implementar `sendDeliveryReady` | `src/lib/emailService.ts` | — |
| C5 | Implementar `sendAdminNewReceipt` | `src/lib/emailService.ts` | — |
| C6 | Integrar notificaciones en `receiptService` | `src/lib/receiptService.ts` | C1, C5 |
| C7 | Integrar notificaciones en `receiptAdminService` | `src/lib/receiptAdminService.ts` | C2-C4 |

### FASE D: Consolidacion y Testing (Semana 2-3)

| # | Tarea | Archivos | Dependencias |
|---|-------|----------|-------------|
| D1 | Unificar logica de fulfillment (eliminar duplicados) | `digitalDelivery.ts`, `api/approve-payment.ts` | — |
| D2 | Implementar cron cleanup | Vercel Cron / Supabase Cron | — |
| D3 | Tests E2E: flujo completo compra-entrega | Playwright | A-F |
| D4 | Eliminar `DIGITAL_PRODUCTS` estatico de `constructionData.ts` | `src/lib/constructionData.ts` | A3 |
| D5 | Eliminar referencias a Stripe no utilizadas | Varios | — |
| D6 | Agregar `*.mjs`, `*.log` a `.gitignore` | `.gitignore` | — |

---

## 11. Estimacion de Esfuerzo

| Fase | Archivos nuevos | Archivos modificados | Dias |
|------|:---------------:|:--------------------:|:----:|
| A: Productos Dinamicos | 2 | 3 | 4 |
| B: Portfolio y Carrusel | 5 | 2 | 4 |
| C: Notificaciones | 0 | 2 | 1 |
| D: Consolidacion | 0 | 4 | 2 |
| **Total** | **7** | **11** | **~11 dias** |

---

## 12. Metricas de Exito

| Metrica | Objetivo | Como medir |
|---------|----------|-----------|
| Tiempo entre pago y entrega | < 5 min (despues de aprobacion admin) | `delivered_at - paid_at` en DB |
| Tasa de comprobantes aprobados | > 80% | `payment_proofs.status` conteo |
| Tiempo de revision admin | < 4h habiles | `reviewed_at - created_at` |
| Descargas exitosas | > 95% | `download_links.downloads_count > 0` |
| Rotura de enlaces por expiracion | 0% (se regeneran) | `download_links.expires_at` monitoreo |
| Productos publicados sin archivo | 0 | `products.file_storage_path IS NULL` |
