# TRABAJO PRÁCTICO INTEGRADOR
**Entrega del proyecto: del relevamiento al diseño del sistema**
**PARTE B — Diseño del sistema**

*(Nota: De acuerdo a lo solicitado, se han omitido los diagramas gráficos en esta entrega. Se incluyen los marcadores donde deberán insertarse posteriormente).*

---

## B.1. Arquitectura del sistema

### Estilo arquitectónico adoptado
El proyecto **Gestor de Rotisería (RotiAdmin & RotiExpress)** utiliza una arquitectura **Cliente-Servidor** con un enfoque **Backend-as-a-Service (BaaS)** y procesamiento basado en **Componentes de Servidor y Cliente (Server & Client Components)**. 

**Justificación:**
- **Separación de responsabilidades:** El frontend (Next.js) se encarga exclusivamente de la presentación, enrutamiento y estado de la interfaz de usuario, delegando la persistencia de datos, autenticación y reglas de negocio de seguridad (RLS) al BaaS (Supabase).
- **Multi-Tenant Nativo:** La arquitectura permite manejar múltiples restaurantes en una sola base de datos (PostgreSQL), utilizando Row Level Security (RLS) para asegurar que cada "inquilino" acceda únicamente a sus propios datos, reduciendo costos de infraestructura.
- **Tiempo real (Realtime):** Para el módulo de comandas en cocina (KDS), es vital contar con actualizaciones instantáneas sin recargar la página. Supabase Realtime (WebSockets) integrado en esta arquitectura lo resuelve de forma eficiente.
- **Rendimiento:** El uso de Next.js App Router permite renderizar partes de la aplicación en el servidor (SSR) y otras en el cliente (CSR), optimizando el SEO para la tienda pública y la interactividad para el panel administrativo.

### Diagramas de arquitectura
- *[Aquí se insertará el Diagrama de Componentes UML]*
- *[Aquí se insertará el Diagrama de Despliegue UML]*

### Stack tecnológico
- **Frontend / Framework:** Next.js 16 (App Router) y React 19.
  - *Justificación:* Ofrece la mejor experiencia de desarrollo para aplicaciones SPA complejas con necesidades de renderizado híbrido (SSR/CSR) y ruteo basado en sistema de archivos.
- **Lenguaje:** TypeScript.
  - *Justificación:* Previene errores en tiempo de desarrollo aportando tipado estático, fundamental para manejar la estructura de datos que viaja desde y hacia la base de datos.
- **Estilos:** Tailwind CSS v4.
  - *Justificación:* Permite un desarrollo ágil de la interfaz basada en un diseño moderno ("glassmorphism"), asegurando consistencia y adaptabilidad a dispositivos móviles (Mobile First).
- **Gestión de estado global:** Zustand.
  - *Justificación:* Ligero, rápido y sin boilerplate, ideal para manejar el estado del carrito de compras y la persistencia temporal en el e-commerce.
- **Motor de Base de Datos y Backend:** Supabase (PostgreSQL).
  - *Justificación:* Proveedor robusto que consolida base de datos relacional, sistema de autenticación (GoTrue), WebSockets (Realtime) y seguridad a nivel de filas (RLS), acortando los tiempos de desarrollo de la API.

---

## B.2. Diseño de datos

- *[Aquí se insertará el Diagrama Entidad-Relación (DER)]*

### Modelo lógico relacional (3FN)

- **restaurants** (<u>id</u>, name, subdomain, created_at)
- **profiles** (<u>id</u>, *restaurant_id*, full_name, role, phone, address, created_at)
  - *FK: id -> auth.users(id)*
  - *FK: restaurant_id -> restaurants(id)*
- **products** (<u>id</u>, *restaurant_id*, code, name, description, price, category, is_available, ingredients, image_url, created_at)
  - *FK: restaurant_id -> restaurants(id)*
- **orders** (<u>id</u>, *restaurant_id*, *customer_id*, guest_name, guest_phone, guest_address, delivery_type, status, total_amount, notes, payment_method, payment_status, created_at)
  - *FK: restaurant_id -> restaurants(id)*
  - *FK: customer_id -> profiles(id)*
- **order_items** (<u>id</u>, *order_id*, *product_id*, quantity, unit_price, created_at)
  - *FK: order_id -> orders(id)*
  - *FK: product_id -> products(id)*
- **inventory_items** (<u>id</u>, *restaurant_id*, name, quantity_available, unit, min_stock, created_at)
  - *FK: restaurant_id -> restaurants(id)*
- **inventory_movements** (<u>id</u>, *item_id*, quantity_change, movement_type, created_at)
  - *FK: item_id -> inventory_items(id)*

### Diccionario de datos

**Tabla: restaurants**
| Campo | Tipo de dato | Longitud/Formato | Restricciones | Descripción |
|---|---|---|---|---|
| id | UUID | 36 chars | PK, DEFAULT gen_random_uuid() | Identificador único del restaurante |
| name | TEXT | Variable | NOT NULL | Nombre comercial del restaurante |
| subdomain | TEXT | Variable | UNIQUE | Subdominio asignado al local |
| created_at | TIMESTAMP | - | NOT NULL, DEFAULT now() | Fecha de registro |

**Tabla: profiles**
| Campo | Tipo de dato | Longitud/Formato | Restricciones | Descripción |
|---|---|---|---|---|
| id | UUID | 36 chars | PK, FK (auth.users) | Identificador vinculado a Auth |
| restaurant_id | UUID | 36 chars | FK, NOT NULL | Restaurante al que pertenece |
| full_name | TEXT | Variable | NOT NULL | Nombre completo del usuario |
| role | ENUM | 'admin','seller', 'cook','customer' | NOT NULL, DEFAULT 'customer' | Rol dentro del sistema |
| phone | TEXT | Variable | - | Teléfono de contacto |
| address | TEXT | Variable | - | Dirección física |
| created_at | TIMESTAMP | - | NOT NULL, DEFAULT now() | Fecha de creación del perfil |

**Tabla: products**
| Campo | Tipo de dato | Longitud/Formato | Restricciones | Descripción |
|---|---|---|---|---|
| id | UUID | 36 chars | PK, DEFAULT gen_random_uuid() | Identificador del producto |
| restaurant_id | UUID | 36 chars | FK, NOT NULL | Restaurante dueño del producto |
| code | TEXT | Variable | NOT NULL | Código interno del producto |
| name | TEXT | Variable | NOT NULL | Nombre del producto |
| description | TEXT | Variable | - | Descripción comercial |
| price | NUMERIC | (10,2) | NOT NULL | Precio de venta |
| category | TEXT | Variable | NOT NULL | Categoría (Ej: Empanadas) |
| is_available | BOOLEAN | - | DEFAULT true | Estado de disponibilidad |
| ingredients | TEXT[] | Array | - | Lista de ingredientes |
| image_url | TEXT | Variable | - | URL de la imagen del producto |
| created_at | TIMESTAMP | - | NOT NULL, DEFAULT now() | Fecha de alta |
*(Restricción: UNIQUE(restaurant_id, code))*

**Tabla: orders**
| Campo | Tipo de dato | Longitud/Formato | Restricciones | Descripción |
|---|---|---|---|---|
| id | UUID | 36 chars | PK, DEFAULT gen_random_uuid() | Identificador del pedido |
| restaurant_id | UUID | 36 chars | FK, NOT NULL | Restaurante que recibe el pedido |
| customer_id | UUID | 36 chars | FK, NULLABLE | Cliente registrado (NULL si es guest) |
| guest_name | TEXT | Variable | - | Nombre si compra sin cuenta |
| guest_phone | TEXT | Variable | - | Teléfono si compra sin cuenta |
| delivery_type | ENUM | local, delivery, dine_in | NOT NULL | Modalidad de entrega |
| status | ENUM | pending...completed | NOT NULL, DEFAULT 'pending' | Estado del pedido en cocina |
| total_amount | NUMERIC | (10,2) | NOT NULL | Total monetario |
| notes | TEXT | Variable | - | Observaciones del cliente |
| created_at | TIMESTAMP | - | NOT NULL, DEFAULT now() | Fecha y hora del pedido |

**Tabla: order_items**
| Campo | Tipo de dato | Longitud/Formato | Restricciones | Descripción |
|---|---|---|---|---|
| id | UUID | 36 chars | PK, DEFAULT gen_random_uuid() | ID de la línea de detalle |
| order_id | UUID | 36 chars | FK, NOT NULL | Pedido al que pertenece |
| product_id | UUID | 36 chars | FK, NOT NULL | Producto comprado |
| quantity | INTEGER | - | NOT NULL, CHECK (quantity > 0) | Cantidad de unidades |
| unit_price | NUMERIC | (10,2) | NOT NULL | Precio unitario al momento de compra|

**Tabla: inventory_items**
| Campo | Tipo de dato | Longitud/Formato | Restricciones | Descripción |
|---|---|---|---|---|
| id | UUID | 36 chars | PK, DEFAULT gen_random_uuid() | ID del insumo |
| restaurant_id | UUID | 36 chars | FK, NOT NULL | Restaurante dueño del stock |
| name | TEXT | Variable | NOT NULL | Nombre del insumo |
| quantity_available | NUMERIC | (10,2) | NOT NULL, DEFAULT 0 | Stock actual disponible |
| unit | TEXT | Variable | NOT NULL | Unidad de medida (kg, lt, un) |
| min_stock | NUMERIC | (10,2) | NOT NULL, DEFAULT 0 | Punto de pedido/reposición |

*(El Script DDL se encuentra al final del documento en la sección Anexos).*

---

## B.3. Diseño de clases

- *[Aquí se insertará el Diagrama de Clases de diseño]*

### Organización de las clases en capas (Arquitectura Frontend)
Dado que es una aplicación Next.js y React, las "clases" se ven reflejadas como módulos y funciones/componentes organizados en las siguientes capas lógicas:

1. **Capa de Presentación (UI Components):**
   - Carpeta: `src/app/` y subcarpetas (`(ecommerce)`, `admin`).
   - Contiene Componentes React responsables de renderizar la interfaz. Separados en Client Components (`'use client'`) para interactividad y Server Components para carga inicial de datos.
2. **Capa de Gestión de Estado:**
   - Carpeta: `src/store/`
   - Ej: `useCartStore.ts`. Encargada de mantener la consistencia temporal en memoria (ej. el carrito de compras) y aislar la lógica compleja de UI.
3. **Capa de Servicios / API (Data Access):**
   - Carpeta: `src/lib/`
   - Ej: `api.ts`, `supabase.ts`. Contiene funciones asíncronas para comunicarse con Supabase (CRUD, Suscripciones en tiempo real).
4. **Capa de Tipos y Modelos (Domain):**
   - Tipos de TypeScript que mapean las entidades del diccionario de datos (Products, Orders, Profiles) para asegurar consistencia en todo el pipeline.

---

## B.4. Diseño dinámico

- *[Aquí se insertarán los Diagramas de Secuencia]*
- *[Aquí se insertará el Diagrama de Estados]*

---

## B.5. Diseño de la interfaz de usuario

### Mapa de navegación del sistema por tipo de usuario

**1. Usuario Público / Cliente (Guest o Autenticado)**
- `/` (Catálogo / Home)
  - ➔ `/carrito` (Checkout)
  - ➔ `/seguimiento` (Estado de su pedido)

**2. Usuario Administrador / Personal**
- `/login` (Acceso)
  - ➔ `/admin` (Dashboard Gerencial)
    - ➔ `/admin/pos` (Punto de Venta)
    - ➔ `/admin/cocina` (Comandera KDS - Realtime)
    - ➔ `/admin/inventario` (Control de Stock)
    - ➔ `/admin/configuracion` (Ajustes del local)

- *[Aquí se insertarán los Mockups]*

### Criterios de usabilidad y accesibilidad aplicados
- **Consistencia Visual:** Uso de variables CSS globales y componentes estandarizados mediante Tailwind, garantizando los mismos colores (estado crítico en rojo, confirmaciones en verde) y bordes redondeados (glassmorphism) en todo el sistema.
- **Feedback Constante:** Mensajes de carga (spinners), notificaciones (toasts) tras guardar un cambio en inventario y alertas visuales cuando el stock baja del umbral (`min_stock`).
- **Prevención de errores:** Deshabilitación de botones tras ser clickeados (ej. evitar doble compra) y validaciones de formulario claras antes del envío.
- **Diseño Adaptable (Responsive):** E-commerce optimizado primordialmente para móviles (Mobile First) dado que el 90% de los clientes compra desde su smartphone; mientras que el módulo de cocina (KDS) y POS priorizan uso en tablets y pantallas de escritorio.
- **Accesibilidad:** Uso de iconos contrastantes (Lucide React) acompañados de texto legible (fuente moderna), y soporte de navegación básica sin sobrecargar visualmente al usuario.

---

## B.6. Diseño de la API

Dado el uso de Supabase (Backend-as-a-Service), la API está gestionada por el SDK y PostgREST de forma automática. Sin embargo, a nivel de capa de servicio (`lib/api.ts`), los endpoints consumidos lógicamente se resumen en:

| Método | Entidad / Ruta (Supabase) | Descripción | Datos de entrada (JSON) | Código de estado |
|---|---|---|---|---|
| GET | `/rest/v1/products` | Obtener catálogo del restaurante | `?restaurant_id=eq.UUID` | 200 OK |
| POST | `/rest/v1/orders` | Registrar nuevo pedido (Checkout) | `{ restaurant_id, delivery_type, total_amount, ... }` | 201 Created |
| POST | `/rest/v1/order_items`| Detalle del pedido registrado | Array de `{ order_id, product_id, quantity }` | 201 Created |
| PATCH| `/rest/v1/orders` | Actualizar estado en cocina | `?id=eq.UUID` con payload `{ status: 'ready' }` | 204 No Content |
| GET | `/rest/v1/inventory_items`| Consultar stock y umbrales | `?restaurant_id=eq.UUID` | 200 OK |

### Estrategia de autenticación y autorización prevista
- **Autenticación:** Gestionada a través de Supabase Auth (JWT). El panel de control (`/admin/*`) se protege verificando la sesión activa del usuario.
- **Autorización (Multi-Tenant Segura):** Implementada a nivel de base de datos usando **Row Level Security (RLS)**. Cada consulta a las tablas (ej. `orders` o `products`) adjunta automáticamente el token JWT del usuario; las políticas RLS validan que el `restaurant_id` del registro coincida con el `restaurant_id` asociado al perfil del usuario autenticado, previniendo fugas de datos entre distintos negocios. Los usuarios públicos (anónimos) solo tienen permisos limitados de lectura (catálogo) y escritura (órdenes).

---

## B.7. Matriz de trazabilidad

| ID RF | Requerimiento Funcional | CU (Caso de Uso) | Pantalla (Mockup) | Tablas / Clases |
| :--- | :--- | :--- | :--- | :--- |
| RF-01 | Visualizar catálogo de productos | CU-04 | P-01 (Home `/`) | `products`, `restaurants` / ProductCard |
| RF-02 | Agregar productos al carrito | CU-05 | P-02 (`/carrito`) | Zustand Store / useCartStore |
| RF-03 | Registrar Pedido en Mostrador | CU-01 | P-03 (`/admin/pos`) | `orders`, `order_items` / CheckoutForm |
| RF-04 | Seguimiento de orden en vivo | CU-06 | P-04 (`/seguimiento`) | `orders` / TimelineComponent |
| RF-05 | Iniciar sesión como administrador | CU-07 | P-05 (`/login`) | `auth.users`, `profiles` / LoginForm |
| RF-06 | Cambiar Estado de Comanda en Cocina| CU-02 | P-06 (`/admin/cocina`) | `orders` / BoardColumn |
| RF-07 | Control y actualización de inventario | CU-08 | P-07 (`/admin/inventario`) | `inventory_items`, `movements` / StockTable |
| RF-08 | Registrar Arqueo y Cierre de Caja | CU-03 | P-08 (`/admin`) | `orders`, `order_items` / DashboardCharts |

---

## B.8. Conclusiones

**Reflexión del grupo:**
Las decisiones de diseño tomadas, como el enfoque Backend-as-a-Service con Supabase y la arquitectura basada en Next.js, permiten reducir significativamente el esfuerzo de desarrollo en la capa backend, delegando la seguridad de los datos al motor PostgreSQL mediante RLS. Esta decisión mitiga el riesgo más importante de un sistema Multi-Tenant: la filtración accidental de datos entre comercios. 
**Riesgos para la etapa de construcción:**
- Dependencia alta de las suscripciones por WebSockets (Realtime) de Supabase; si hay fallas de red en la rotisería, la cocina no recibirá los pedidos. Será necesario implementar manejo de reintentos o "polling" de contingencia.
- Curva de aprendizaje técnica respecto al App Router de Next.js y el equilibrio correcto entre Client Components y Server Components para no afectar el rendimiento.

---

## B.9. Referencias y anexos

**Referencias (APA 7.ª edición)**
- Supabase (2024). *Supabase Documentation: Database, Auth, Realtime*. Recuperado de https://supabase.com/docs
- Vercel (2024). *Next.js 14 Documentation: Routing, Rendering & Architecture*. Recuperado de https://nextjs.org/docs

**Anexo 1: Declaración de uso de IA**
Se utilizaron modelos de lenguaje (LLM) como apoyo para formatear la estructura del documento, redactar justificaciones técnicas basadas en las especificaciones del repositorio y generar diccionarios de datos sintácticamente correctos alineados al código SQL provisto. Las decisiones de diseño (como el uso de RLS y Zustand) provienen del análisis propio basado en el relevamiento original.

**Anexo 2: Script DDL**

```sql
-- Create custom enums
CREATE TYPE user_role AS ENUM ('admin', 'seller', 'cook', 'customer');
CREATE TYPE delivery_type AS ENUM ('local_pickup', 'delivery', 'dine_in');
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'ready', 'delivering', 'completed', 'cancelled');
CREATE TYPE inventory_movement_type AS ENUM ('in', 'out', 'loss');

-- Restaurants (Tenants)
CREATE TABLE public.restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  ingredients TEXT[],
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(restaurant_id, code)
);

-- Orders
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_phone TEXT,
  guest_address TEXT,
  delivery_type delivery_type NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(10,2) NOT NULL,
  notes TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Order Items
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inventory Items
CREATE TABLE public.inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity_available NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  min_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inventory Movements
CREATE TABLE public.inventory_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  quantity_change NUMERIC(10,2) NOT NULL,
  movement_type inventory_movement_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```
