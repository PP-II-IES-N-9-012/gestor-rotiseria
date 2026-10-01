# 🥘 ComandApp — Software Gastronómico Artesanal & Multi-Tenant

Sistema SaaS integral y **Multi-Tenant** diseñado para rotiserías, casas de empanadas, pizzerías y bodegones tradicionales. Con una estética cálida, rústica y *"hecho en casa"*, **ComandApp** elimina las libretas de papel y las comisiones abusivas del 35% de las apps de delivery tradicionales, otorgando a cada negocio su propia tienda online con subdominio, comandera de cocina en tiempo real y punto de venta ultra ágil.

---

## 📑 Tabla de Contenidos

- [Visión General & Propuesta de Valor](#-visión-general--propuesta-de-valor)
- [Características Principales](#-características-principales)
  - [Landing Page Institucional & Ventas (`/`)](#-landing-page-institucional--ventas-)
  - [Tienda Online por Subdominio](#-tienda-online-para-comensales-con-subdominio-propio)
  - [Panel Administrativo y de Cocina](#-panel-de-cocina-y-administración-comandadmin)
- [Arquitectura Multi-Tenant & Subdominios](#-arquitectura-multi-tenant--subdominios)
- [Identidad Visual: Rústica & Hecho en Casa](#-identidad-visual-rústica--hecho-en-casa)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos Previos](#-requisitos-previos)
- [Guía de Instalación y Ejecución Local](#-guía-de-instalación-y-ejecución-local)
- [Rutas y URLs de la Aplicación](#-rutas-y-urls-de-la-aplicación)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Scripts Disponibles](#-scripts-disponibles)
- [📖 Wiki y Guía de Uso del Sistema](#-wiki-y-guía-de-uso-del-sistema)

---

## 💡 Visión General & Propuesta de Valor

* ⚡ **0% Comisiones por Pedido:** Todo lo que vendes es 100% de tu negocio gastronómico.
* 🌐 **Subdominio Personalizado:** Cada cliente dispone de su propia URL (ej. `don-carlos.comandapp.com`).
* 👨‍🍳 **Comandera KDS en Vivo:** La cocina recibe los pedidos en pantalla táctil al instante sin papel ni gritos.
* 🥘 **Cercanía & Sabor Casero:** Diseño cálido, rústico y apetitoso, alejado del software corporativo frío.

---

## ✨ Características Principales

### 🚀 Landing Page Institucional & Ventas (`/`)
* **Página de Aterrizaje Base:** Ubicada en la dirección raíz (`/`), vende ComandApp a nuevos locales gastronómicos.
* **Demostrador Interactivo de Módulos:** Pestañas en vivo para alternar entre la Tienda con Subdominio, Comandera de Cocina (KDS), Punto de Venta (POS) y Control de Inventario.
* **Simulador de Subdominios:** El cliente introduce el nombre de su local y comprueba en vivo su URL (`https://[negocio].comandapp.com`) con enlace directo para probar la tienda.
* **Precios & Planes:** Tarifa plana mensual sin letra chica ni comisiones por orden.
* **Testimonios Reales:** Casos de rotiserías tradicionales que aumentaron su rentabilidad.
* **Preguntas Frecuentes (FAQ):** Dudas sobre hardware, celulares y puesta en marcha.

### 🛒 Tienda Online para Comensales (Con Subdominio Propio)
* **Catálogo Artesanal Categorizado:** Spiedo y horno a leña, empanadas caseras a cuchillo, pastas frescas, minutas y tartas.
* **Detalle del Comercio:** Nombre del local, subdominio oficial, dirección física, teléfono y demora estimada de cocina.
* **Carrito y Checkout sin Registro Forzoso:** Modalidades de *Envío a Domicilio (Delivery)* o *Retiro en Local (Take Away)*, notas especiales para el cocinero y pagos en Efectivo o MercadoPago.
* **Seguimiento de Comanda en Tiempo Real (`/seguimiento`):** Línea de tiempo visual con etapas de cocción (*Recibido* ➔ *Marchando en el Fuego* ➔ *¡Listo para Entregar!* ➔ *Completado*).

### 🖥️ Panel de Cocina y Administración (ComandAdmin)
* **Dashboard Gerencial (KPIs en Vivo):** 
  - Ventas totales del día en pesos.
  - Pedidos totales de la jornada.
  - Ticket promedio por comanda.
  - Insumos críticos con botón de recarga rápida (+10 unidades).
* **Punto de Venta de Mostrador (POS / Caja):**
  - Buscador rápido y filtros por categoría de platos.
  - Creación ultra rápida de tickets para clientes presenciales o telefónicos.
  - Envío automático de la comanda a la pantalla de cocina al confirmar.
* **Comandera de Cocina en Vivo (KDS):**
  - Sincronización instantánea mediante WebSockets de Supabase (sin recargar la pantalla).
  - Columnas operativas: *Pendientes*, *En Marcha* y *Listos*.
  - Indicación de tiempo transcurrido y notas especiales (ej. *"Sin cebolla"*).
* **Control de Inventario & Alertas de Stock:**
  - Control de materias primas (pollos, carne picada, papas, harina, muzzarella).
  - Alerta roja parpadeante cuando las existencias tocan el umbral de seguridad (`min_stock`).
* **Configuración del Local:**
  - Modificación de nombre comercial, subdominio público, dirección y datos de contacto.

---

## 🏢 Arquitectura Multi-Tenant & Subdominios

ComandApp utiliza un modelo multi-inquilino robusto y transparente:

1. **Detección Automática de Subdominio ([`src/proxy.ts`](src/proxy.ts)):**
   - El proxy / middleware analiza el encabezado `Host` de la petición HTTP.
   - Si un usuario visita `don-carlos.comandapp.com` (o `don-carlos.localhost:3000`), el sistema reescribe internamente la ruta hacia `/tienda/don-carlos`.
   - Si se visita el dominio base (`comandapp.com` o `localhost:3000`), se renderiza la **Landing Page** corporativa.
   - En desarrollo, también se permite acceso directo vía `/tienda/[subdominio]` o parámetro `?negocio=[subdominio]`.
2. **Aislamiento en Base de Datos por Row Level Security (RLS):**
   - Cada restaurante tiene su identificador único en la tabla `restaurants`.
   - Las tablas de datos (`products`, `orders`, `inventory_items`) se encuentran segregadas por `restaurant_id`.
   - Mediante políticas PostgreSQL RLS, cada dueño y cocinero solo tiene acceso a la información de su local.

---

## 🪵 Identidad Visual: Rústica & "Hecho en Casa"

El frontend fue completamente renovado para brindar calidez y cercanía:
* **Paleta de Colores:** Fondo carbón cálido (`#151210`), terracota brasa (`#d34e2c`), corteza dorada (`#e59324`) y acentos de madera/pergamino.
* **Tipografía:** Encabezados en tipografía serif clásica (*Playfair Display*) combinada con *Outfit* e *Inter*.
* **Micro-interacciones:** Tarjetas estilo pizarra de bodegón, distintivos artesanales y botón interactivo con confirmación animada *"¡En la comanda!"*.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Framework Web** | [Next.js 16](https://nextjs.org) (App Router, Server Components & Proxy) |
| **Librería UI** | [React 19](https://react.dev) |
| **Lenguaje** | [TypeScript](https://www.typescriptlang.org) |
| **Estilos & Diseño** | [Tailwind CSS v4](https://tailwindcss.com) (Paleta rústica, glassmorphism cálido) |
| **Tipografía** | Google Fonts (*Playfair Display*, *Outfit*, *Inter*) |
| **Iconografía** | [Lucide React](https://lucide.dev) |
| **Gestión de Estado** | [Zustand](https://github.com/pmndrs/zustand) |
| **Base de Datos & Auth** | [Supabase](https://supabase.com) (PostgreSQL, RLS, WebSockets Realtime) |

---

## 📋 Requisitos Previos

* **Node.js**: Versión 18.18.0 o superior (recomendado Node.js 20 LTS o 22 LTS).
* **Gestor de paquetes**: `npm`, `yarn`, `pnpm` o `bun`.
* **Cuenta de Supabase**: Para alojar la base de datos PostgreSQL y la autenticación.

---

## 🚀 Guía de Instalación y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/gestor-rotiseria.git
cd gestor-rotiseria
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configuración de Variables de Entorno
Copia la plantilla `.env.example` a `.env.local`:

**En Windows (PowerShell):**
```powershell
Copy-Item .env.example .env.local
```

**En Linux / macOS:**
```bash
cp .env.example .env.local
```

Configura tus credenciales de Supabase en `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-clave-anon-publica-aqui"
```

### 4. Configurar la Base de Datos en Supabase
1. Ingresa a tu panel de **Supabase** y ve a **SQL Editor**.
2. Ejecuta el archivo [`supabase/schema.sql`](supabase/schema.sql) para crear las tablas y datos iniciales.
3. Ejecuta el archivo [`supabase/policies.sql`](supabase/policies.sql) para activar las políticas Row Level Security (RLS).
4. En **Database** > **Replication**, activa la replicación para la tabla `public.orders` para sincronizar la cocina en tiempo real.

### 5. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```

Abre tu navegador e ingresa a:
👉 **[http://localhost:3000](http://localhost:3000)** (Landing Page de ComandApp)

---

## 🌐 Rutas y URLs de la Aplicación

| Ruta | Descripción | Rol de Acceso |
| :--- | :--- | :--- |
| `/` | **Landing Page de ComandApp** (Venta del servicio, simulador, planes) | Público |
| `/tienda` | Catálogo de tienda online general / demo | Comensales |
| `/tienda/[tenant]` | Catálogo online para el local específico según su subdominio | Comensales del local |
| `/carrito` | Carrito de comanda y checkout de entrega | Comensales |
| `/seguimiento` | Rastreo en vivo del estado de preparación de la orden | Comensales |
| `/login` | Acceso al panel administrativo y de cocina | Personal del local |
| `/admin` | Dashboard gerencial con métricas y caja del día | Administrador |
| `/admin/pos` | Terminal de Punto de Venta para mostrador y teléfono | Cajero / Ventas |
| `/admin/cocina` | Comandera de cocina en vivo (KDS) | Cocineros |
| `/admin/inventario` | Control de stock de materias primas y alertas | Administrador |
| `/admin/configuracion` | Configuración de datos del comercio y subdominio | Administrador |

---

## 📁 Estructura del Proyecto

```plaintext
gestor-rotiseria/
├── public/                 # Archivos estáticos, imágenes de platos y branding
├── src/
│   ├── app/
│   │   ├── (ecommerce)/    # Módulo de tienda online para comensales
│   │   │   ├── carrito/    # Carrito de comanda y checkout
│   │   │   ├── seguimiento/# Rastreo visual de pedidos
│   │   │   ├── tienda/     # Catálogo con soporte multi-tenant (/tienda/[tenant])
│   │   │   ├── components/ # Botón animado "Pedir al plato"
│   │   │   └── layout.tsx  # Cabecera rústica con comanda flotante
│   │   ├── admin/          # Panel administrativo privado de ComandApp
│   │   │   ├── cocina/     # Pantalla KDS en tiempo real para cocineros
│   │   │   ├── configuracion/# Ajustes de local y subdominio
│   │   │   ├── inventario/ # Grilla de insumos y alerta de stock
│   │   │   ├── pos/        # Punto de venta ágil de mostrador
│   │   │   ├── layout.tsx  # Sidebar con branding ComandApp
│   │   │   └── page.tsx    # Dashboard gerencial y KPIs
│   │   ├── login/          # Inicio de sesión al panel de cocina
│   │   ├── globals.css     # Paleta rústica (terracota, ámbar, carbón) y utilidades
│   │   ├── layout.tsx      # Layout raíz con tipografía Playfair y Outfit
│   │   └── page.tsx        # 🚀 Landing Page corporativa de ComandApp
│   ├── lib/
│   │   ├── api.ts          # Resolución de inquilinos, productos y órdenes
│   │   └── supabase.ts     # Cliente de conexión a Supabase
│   ├── store/
│   │   └── useCartStore.ts # Carrito persistente con Zustand
│   └── proxy.ts            # Proxy/Middleware de resolución de subdominios
├── supabase/
│   ├── schema.sql          # Estructura de base de datos relacional
│   └── policies.sql        # Políticas PostgreSQL RLS multi-tenant
├── package.json
└── WIKI.md                 # 📚 Manual operativo y guía de alta de clientes
```

---

## 📜 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo en `http://localhost:3000`.
- `npm run build`: Compila la aplicación para producción.
- `npm run start`: Inicia la aplicación en modo producción.
- `npm run lint`: Ejecuta el linter de código con ESLint.

---

## 📖 Wiki y Guía de Uso del Sistema

Para consultar el manual operativo detallado y la **guía paso a paso para crear un nuevo negocio con subdominio para un nuevo cliente**, consulta la documentación oficial en:

👉 **[WIKI.md](WIKI.md)**
