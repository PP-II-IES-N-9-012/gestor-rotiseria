# 🍽️ Gestor de Rotisería (RotiAdmin & RotiExpress)

Sistema SaaS integral y **Multi-Tenant** diseñado para rotiserías, casas de comidas preparadas y restaurantes. Proporciona una tienda en línea moderna para clientes (e-commerce y seguimiento en vivo) y un panel administrativo completo para la gestión operativa (Punto de Venta POS, comanderas en cocina en tiempo real, inventario y métricas gerenciales).

---

## 📑 Tabla de Contenidos

- [Características Principales](#-características-principales)
  - [E-Commerce y Clientes (RotiExpress)](#-tienda-online--clientes-rotiexpress)
  - [Panel Administrativo (RotiAdmin)](#-panel-administrativo-y-operativo-rotiadmin)
- [Arquitectura Multi-Tenant](#-arquitectura-multi-tenant-y-seguridad)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos Previos](#-requisitos-previos)
- [Guía de Instalación y Ejecución Local](#-guía-de-instalación-y-ejecución-local)
  - [1. Clonar el repositorio](#1-clonar-el-repositorio)
  - [2. Instalar dependencias](#2-instalar-dependencias)
  - [3. Configuración de Variables de Entorno](#3-configuración-de-variables-de-entorno)
  - [4. Configurar la Base de Datos en Supabase](#4-configurar-la-base-de-datos-en-supabase)
  - [5. Iniciar el Servidor de Desarrollo](#5-iniciar-el-servidor-de-desarrollo)
- [Rutas y URLs de la Aplicación](#-rutas-y-urls-de-la-aplicación)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Scripts Disponibles](#-scripts-disponibles)
- [📖 Wiki y Guía de Uso del Sistema](#-wiki-y-guía-de-uso-del-sistema)

---

## ✨ Características Principales

### 🛒 Tienda Online / Clientes (RotiExpress)
* **Catálogo Digital por Categorías:** Visualización interactiva de comidas preparadas (Empanadas, Pizzas, Minutas, etc.) con imágenes, descripciones y precios.
* **Carrito de Compras Reactivo:** Persistencia en tiempo real de productos seleccionados gestionada con Zustand.
* **Checkout para Clientes e Invitados:** Selección de modalidad (*Delivery* o *Retiro en Local*), datos de envío, notas especiales y método de pago (Efectivo o MercadoPago).
* **Seguimiento de Pedidos en Vivo:** Búsqueda mediante código de orden único con línea de tiempo visual del estado del pedido (*Recibido* ➔ *En Preparación* ➔ *Listo* ➔ *Completado*).

### 🖥️ Panel Administrativo y Operativo (RotiAdmin)
* **Dashboard Gerencial (KPIs en Vivo):** 
  - Ventas totales del día en pesos.
  - Cantidad total de órdenes registradas en la jornada.
  - Ticket promedio por cliente.
  - Alerta de insumos críticos con reposición en 1 clic.
  - Gráfica horaria de flujo de ventas.
* **Punto de Venta (POS / Mostrador):**
  - Buscador rápido y filtro instantáneo por categorías.
  - Confección ágil de tickets de venta para clientes presenciales o telefónicos.
  - Medios de pago integrados (Efectivo / Tarjeta).
  - Envío automático de la comanda a la cocina al confirmar.
* **Comandera de Cocina en Tiempo Real (KDS):**
  - Actualización en vivo sin recargar la página gracias a **Supabase Realtime**.
  - Tablero de 3 columnas de estados: *Pendientes*, *En Preparación* y *Listos*.
  - Vista clara de productos, cantidades e indicaciones/notas del cliente.
* **Control de Inventario:**
  - Registro de insumos (unidades, kg, litros).
  - Control de umbral mínimo de seguridad (`min_stock`) con flags visuales de estado crítico.
  - Carga rápida de stock (+ Ingreso).
* **Configuración del Negocio:**
  - Administración de nombre del local, subdominio asignado, teléfono, dirección y descripción comercial.

---

## 🏢 Arquitectura Multi-Tenant y Seguridad

El sistema está concebido para albergar **múltiples restaurantes (inquilinos/tenants)** de forma aislada y segura en una misma base de datos:

* Cada negocio cuenta con su propio registro en la tabla `restaurants` con un subdominio único.
* La seguridad está garantizada por **Row Level Security (RLS)** a nivel de base de datos PostgreSQL:
  - Los clientes públicos solo pueden leer restaurantes y productos disponibles, e insertar nuevos pedidos.
  - Los usuarios administradores solo pueden consultar, crear, modificar o eliminar registros vinculados al restaurante que tienen asignado en su `profiles`.
  - Es imposible que un comercio acceda accidentalmente a pedidos, productos o inventario de otro.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Framework Web** | [Next.js 16](https://nextjs.org) (App Router, Server & Client Components) |
| **Librería UI** | [React 19](https://react.dev) |
| **Lenguaje** | [TypeScript](https://www.typescriptlang.org) |
| **Estilos** | [Tailwind CSS v4](https://tailwindcss.com) (Estética moderna, glassmorphism, modo oscuro) |
| **Iconografía** | [Lucide React](https://lucide.dev) |
| **Gestión de Estado** | [Zustand](https://github.com/pmndrs/zustand) |
| **Base de Datos & Auth** | [Supabase](https://supabase.com) (PostgreSQL, Row Level Security, Realtime WebSockets, GoTrue Auth) |

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu computadora:

* **Node.js**: Versión 18.18.0 o superior (recomendado Node.js 20 LTS o 22 LTS).
* **Gestor de paquetes**: `npm` (incluido con Node), `yarn`, `pnpm` o `bun`.
* **Cuenta de Supabase**: Para alojar la base de datos PostgreSQL y el servicio de autenticación (puedes crear un proyecto gratuito en [supabase.com](https://supabase.com)).

---

## 🚀 Guía de Instalación y Ejecución Local

### 1. Clonar el repositorio
Abre una terminal y clona el proyecto en tu máquina:
```bash
git clone https://github.com/tu-usuario/gestor-rotiseria.git
cd gestor-rotiseria
```

### 2. Instalar dependencias
Instala los paquetes necesarios definidos en `package.json`:
```bash
npm install
```

### 3. Configuración de Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto. Puedes duplicar la plantilla provista `.env.example`:

**En Windows (PowerShell):**
```powershell
Copy-Item .env.example .env.local
```

**En Linux / macOS:**
```bash
cp .env.example .env.local
```

Abre `.env.local` y coloca las credenciales de tu proyecto de Supabase (las encuentras en **Project Settings** > **API** de tu panel de Supabase):

```env
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-clave-anon-publica-aqui"
```

### 4. Configurar la Base de Datos en Supabase
El repositorio incluye los esquemas SQL listos para crear las tablas y las políticas de seguridad:

1. Ve a tu proyecto en el panel de **Supabase**.
2. En el menú lateral, dirígete a **SQL Editor**.
3. Abre el archivo [`supabase/schema.sql`](supabase/schema.sql), copia su contenido, pégalo en el editor SQL y haz clic en **Run**.  
   *Esto creará los tipos enumerados, las tablas (`restaurants`, `profiles`, `products`, `orders`, `order_items`, `inventory_items`, `inventory_movements`), activará Row Level Security (RLS) e insertará datos iniciales de prueba (Rotisería Central).*
4. Abre el archivo [`supabase/policies.sql`](supabase/policies.sql), copia su contenido, pégalo en el editor SQL y haz clic en **Run**.  
   *Esto aplicará las políticas de seguridad que aíslan la información por negocio y permiten el acceso anónimo al e-commerce.*
5. *(Opcional)* Habilita la replicación en tiempo real para la tabla `orders`:
   - En Supabase, ve a **Database** > **Replication**.
   - Asegúrate de que la tabla `public.orders` tenga activada la opción **Source** para que el módulo de Cocina reciba pedidos al instante.

### 5. Iniciar el Servidor de Desarrollo
Ejecuta el servidor en modo desarrollo:
```bash
npm run dev
```

Abre tu navegador web e ingresa a:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🌐 Rutas y URLs de la Aplicación

| Ruta | Descripción | Rol de Acceso |
| :--- | :--- | :--- |
| `/` | Catálogo de comidas y portal de compra | Público / Clientes |
| `/carrito` | Carrito de compras y formulario de checkout | Público / Clientes |
| `/seguimiento` | Rastreo del estado de órdenes en tiempo real | Público / Clientes |
| `/login` | Inicio de sesión con correo y contraseña | Personal / Administradores |
| `/admin` | Dashboard de gerencia y KPIs de ventas | Administrador autenticado |
| `/admin/pos` | Terminal de Punto de Venta para mostrador | Personal / Ventas |
| `/admin/cocina` | Pantalla de cocina (KDS) en tiempo real | Personal de cocina |
| `/admin/inventario` | Gestión de insumos y alerta de existencias | Administrador |
| `/admin/configuracion` | Configuración de datos del negocio | Administrador |

---

## 📁 Estructura del Proyecto

```plaintext
gestor-rotiseria/
├── public/                 # Archivos estáticos e imágenes
├── src/
│   ├── app/
│   │   ├── (ecommerce)/    # Grupo de rutas para la tienda online pública
│   │   │   ├── carrito/    # Página del carrito de compras y checkout
│   │   │   ├── seguimiento/# Página de rastreo de pedidos por código
│   │   │   ├── components/ # Componentes exclusivos del e-commerce
│   │   │   ├── layout.tsx  # Layout con barra de navegación y carrito flotante
│   │   │   └── page.tsx    # Catálogo principal por categorías
│   │   ├── admin/          # Panel administrativo privado
│   │   │   ├── cocina/     # Pantalla KDS en vivo para cocineros
│   │   │   ├── configuracion/# Configuración de información del local
│   │   │   ├── inventario/ # Grilla de control de stock de insumos
│   │   │   ├── pos/        # Terminal de punto de venta rápida
│   │   │   ├── layout.tsx  # Sidebar de navegación con verificación de sesión
│   │   │   └── page.tsx    # Dashboard con métricas de ventas y KPIs
│   │   ├── login/          # Pantalla de acceso al panel administrativo
│   │   ├── globals.css     # Estilos globales, variables CSS y diseño glassmorphism
│   │   └── layout.tsx      # Layout raíz de Next.js
│   ├── lib/
│   │   ├── api.ts          # Funciones de consulta e inserción a Supabase
│   │   └── supabase.ts     # Inicialización del cliente @supabase/supabase-js
│   └── store/
│       └── useCartStore.ts # Store de Zustand para el carrito de compras
├── supabase/
│   ├── schema.sql          # Esquema de tablas, enums y datos semilla
│   └── policies.sql        # Políticas RLS (Row Level Security) multi-inquilino
├── .env.example            # Plantilla de variables de entorno requeridas
├── package.json            # Dependencias y scripts de npm
├── tsconfig.json           # Configuración de TypeScript
└── WIKI.md                 # 📚 Manual completo de uso y alta de negocios
```

---

## 📜 Scripts Disponibles

En la raíz del proyecto puedes ejecutar:

- `npm run dev`: Inicia el servidor de desarrollo en `http://localhost:3000`.
- `npm run build`: Compila la aplicación optimizada para producción.
- `npm run start`: Inicia el servidor de producción previamente compilado con `npm run build`.
- `npm run lint`: Ejecuta el análisis de código con ESLint para validar buenas prácticas.

---

## 📖 Wiki y Guía de Uso del Sistema

Para consultar el manual operativo detallado, las guías de cada rol y el **paso a paso para registrar un nuevo negocio o cliente en el sistema multi-tenant**, consulta la documentación oficial en:

👉 **[WIKI.md](WIKI.md)**

Entre otros temas, la Wiki incluye:
- 🏢 **Paso a paso para crear un nuevo negocio para un nuevo cliente** (con scripts SQL listos para copiar y pegar).
- 🛍️ Flujo de compra completo y seguimiento desde el lado del cliente.
- 🧑‍🍳 Operatoria en tiempo real entre el Punto de Venta (POS) y la Cocina (KDS).
- 📦 Gestión de insumos y prevención de quiebres de stock.
- 🛡️ Explicación técnica de la segregación de datos por Row Level Security (RLS).
