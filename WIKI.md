# 📚 Wiki y Manual Operativo — Gestor de Rotisería

Bienvenido a la documentación oficial y guía de uso del **Gestor de Rotisería (RotiAdmin & RotiExpress)**. En esta wiki encontrarás los manuales operativos para cada función del sistema, así como la guía técnica detallada para dar de alta nuevos negocios en una arquitectura multi-inquilino (*multi-tenant*).

---

## 📑 Índice de Contenidos

1. [Visión General del Sistema y Roles](#1-visión-general-del-sistema-y-roles)
2. [Guía de Uso: Tienda Online (RotiExpress - E-Commerce)](#2-guía-de-uso-tienda-online-rotiexpress---e-commerce)
   - [2.1 Navegación y Catálogo](#21-navegación-y-catálogo)
   - [2.2 Gestión del Carrito](#22-gestión-del-carrito)
   - [2.3 Checkout y Realización del Pedido](#23-checkout-y-realización-del-pedido)
   - [2.4 Seguimiento en Tiempo Real](#24-seguimiento-en-tiempo-real)
3. [Guía de Uso: Panel de Administración (RotiAdmin)](#3-guía-de-uso-panel-de-administración-rotiadmin)
   - [3.1 Inicio de Sesión](#31-inicio-de-sesión)
   - [3.2 Dashboard Gerencial y KPIs](#32-dashboard-gerencial-y-kpis)
   - [3.3 Punto de Venta (POS / Mostrador)](#33-punto-de-venta-pos--mostrador)
   - [3.4 Comandera de Cocina en Vivo (KDS)](#34-comandera-de-cocina-en-vivo-kds)
   - [3.5 Control de Inventario y Alertas](#35-control-de-inventario-y-alertas)
   - [3.6 Configuración del Local](#36-configuración-del-local)
4. [🏢 GUÍA MAESTRA: Cómo crear un nuevo negocio para un nuevo cliente (Multi-Tenant)](#4--guía-maestra-cómo-crear-un-nuevo-negocio-para-un-nuevo-cliente-multi-tenant)
   - [4.1 Comprensión del Modelo de Datos](#41-comprensión-del-modelo-de-datos)
   - [4.2 Paso 1: Crear el Usuario en Supabase Auth](#42-paso-1-crear-el-usuario-en-supabase-auth)
   - [4.3 Paso 2: Registrar el Nuevo Restaurante](#43-paso-2-registrar-el-nuevo-restaurante)
   - [4.4 Paso 3: Asignar el Perfil de Administrador al Usuario](#44-paso-3-asignar-el-perfil-de-administrador-al-usuario)
   - [4.5 Paso 4: Carga del Menú Inicial (Productos)](#45-paso-4-carga-del-menú-inicial-productos)
   - [4.6 Paso 5: Carga del Inventario Inicial (Insumos)](#46-paso-5-carga-del-inventario-inicial-insumos)
   - [4.7 📋 Script SQL Unificado (Plantilla "Copiar y Pegar")](#47--script-sql-unificado-plantilla-copiar-y-pegar)
   - [4.8 Verificación de Aislamiento y Acceso](#48-verificación-de-aislamiento-y-acceso)
   - [4.9 Subdominios y Despliegue en Producción](#49-subdominios-y-despliegue-en-producción)
5. [Flujo Operativo de Punta a Punta (Ciclo de Vida de una Orden)](#5-flujo-operativo-de-punta-a-punta-ciclo-de-vida-de-una-orden)
6. [Preguntas Frecuentes y Resolución de Problemas](#6-preguntas-frecuentes-y-resolución-de-problemas)

---

## 1. Visión General del Sistema y Roles

El sistema opera bajo dos grandes entornos:
- **Portal Público (RotiExpress):** La cara visible hacia los comensales. No requiere inicio de sesión para comprar o consultar pedidos.
- **Panel Privado (RotiAdmin):** El sistema operativo interno para gerentes, cajeros y personal de cocina.

### Roles de Usuario en la Base de Datos (`user_role`):
* `admin`: Acceso total a todas las secciones de su rotisería (KPIs, POS, Cocina, Inventario y Configuración).
* `seller`: Orientado al operador de mostrador y cobro (Punto de Venta).
* `cook`: Orientado a la pantalla de cocina (KDS) para marcar pedidos en preparación y terminados.
* `customer`: Perfil de comensal registrado (opcional para clientes frecuentes).

---

## 2. Guía de Uso: Tienda Online (RotiExpress - E-Commerce)

### 2.1 Navegación y Catálogo
* **URL:** `/`
* La página de inicio agrupa automáticamente las comidas por **Categorías** (por ejemplo: *Empanadas*, *Pizzas*, *Minutas*).
* Cada tarjeta muestra:
  - Imagen del plato.
  - Nombre y descripción de ingredientes.
  - Precio unitario destacado.
  - Botón **"Agregar"**.

### 2.2 Gestión del Carrito
* En la barra superior (navbar), el icono de bolsa/carrito muestra la cantidad total de artículos seleccionados en tiempo real.
* Al hacer clic en el carrito se accede a `/carrito`.
* Dentro del carrito se puede:
  - Incrementar o reducir la cantidad de cada producto mediante los botones `+` y `-`.
  - Quitar un producto usando el botón del bote de basura.
  - Observar el desglose del total a abonar.

### 2.3 Checkout y Realización del Pedido
En la columna derecha de `/carrito`, el cliente completa el formulario rápido sin necesidad de registro previo:
1. **Nombre Completo:** Para identificar la comanda en cocina y la entrega.
2. **Teléfono:** Para coordinar el envío o avisar demoras.
3. **Modalidad de Entrega:**
   - *Envío a Domicilio (Delivery):* Despliega el campo obligatorio de **Dirección de Entrega**.
   - *Retiro en Local (Take Away):* El costo de envío se establece como gratuito.
4. **Método de Pago:**
   - *Efectivo:* Se abona contra entrega o al retirar.
   - *MercadoPago:* Modalidad digital.
5. Al pulsar **"Confirmar Pedido"**, se genera la orden en la base de datos y se limpia el carrito.

### 2.4 Seguimiento en Tiempo Real
* **URL:** `/seguimiento`
* El cliente puede ingresar el código identificador de su pedido (UUID de la orden).
* La pantalla presenta:
  - Código y total del pedido.
  - **Línea de tiempo gráfica de 4 etapas:**
    1. 🟡 **Recibido (Pending):** La comanda ingresó al sistema y está en espera.
    2. 🔵 **En Preparación (Preparing):** El equipo de cocina está cocinando los alimentos.
    3. 🟢 **Listo para Entregar (Ready):** El pedido está listo para ser despachado o retirado.
    4. ⚪ **Completado (Completed):** La orden fue entregada y cobrada con éxito.
  - Lista detallada con el resumen de productos y cantidades de la orden.

---

## 3. Guía de Uso: Panel de Administración (RotiAdmin)

### 3.1 Inicio de Sesión
* **URL:** `/login`
* Ingreso mediante correo electrónico y contraseña registrados en Supabase Auth.
* El sistema valida automáticamente que el usuario tenga un comercio asignado en la tabla `profiles`. Si no lo tiene, deniega el acceso para evitar inconsistencias de inquilino.
* Una vez autenticado, redirige automáticamente a `/admin`.

### 3.2 Dashboard Gerencial y KPIs
* **URL:** `/admin`
* **Tarjetas de Estadísticas del Día:**
  - 💵 **Ventas de hoy:** Sumatoria en pesos de todas las órdenes del día actual.
  - 🛍️ **Pedidos Totales:** Conteo de comandas recibidas hoy.
  - 📈 **Ticket Promedio:** Promedio de gasto por comanda (`Ventas / Pedidos`).
  - ⚠️ **Insumos Críticos:** Conteo de materias primas cuya existencia está por debajo o igual al stock mínimo.
* **Alertas de Inventario:** Lista directa de insumos en alerta roja con un botón rápido **"Pedir"** para recargar 10 unidades inmediatamente.
* **Gráfica Horaria:** Estimación de los picos de pedidos en el almuerzo y la cena.

### 3.3 Punto de Venta (POS / Mostrador)
* **URL:** `/admin/pos`
* Diseñado para atender clientes de manera presencial o telefónica con máxima velocidad:
  - **Buscador Dinámico:** Escribe el nombre del plato y filtra al instante.
  - **Filtro por Categorías:** Botones desplegables para alternar entre Minutas, Pizzas, etc.
  - **Panel de Ticket Lateral:** Clic en cualquier producto lo añade al ticket con su subtotal.
  - **Medios de Pago:** Selección rápida entre *Efectivo* y *Tarjeta*.
  - **Confirmar Venta:** Crea la orden con estado `pending`, disparando la comanda en vivo a la pantalla de cocina.

### 3.4 Comandera de Cocina en Vivo (KDS)
* **URL:** `/admin/cocina`
* **Sincronización en tiempo real:** Utiliza canales WebSocket de Supabase para que cualquier nuevo pedido (desde la web o el POS) aparezca sin tener que refrescar la pantalla (`F5`).
* **Columnas de Gestión:**
  1. **Pendientes:** Muestra la hora del pedido, número de comanda, platos, cantidades y notas especiales (ej. *"Sin cebolla"*).
     - Botón: **"Comenzar Preparación"** ➔ Mueve la orden a *En Preparación*.
  2. **En Preparación:** Resaltada con indicador visual de tiempo.
     - Botón: **"Marcar Listo"** ➔ Notifica que el plato está cocinado y listo para entrega.
  3. **Listos (Recientes):** Historial visual de pedidos listos para empaquetar o entregar al repartidor.

### 3.5 Control de Inventario y Alertas
* **URL:** `/admin/inventario`
* Tabla con todos los insumos registrados para el restaurante:
  - Nombre del insumo (ej: *Carne Picada*, *Harina*, *Muzzarella*).
  - Stock Actual y Unidad de medida (`kg`, `litros`, `unidades`).
  - Stock Mínimo fijado como umbral de seguridad.
  - Estado: Etiqueta verde **"Normal"** o roja parpadeante **"Crítico"**.
* **Acciones:**
  - Botón **"+ Ingreso"**: Permite indicar la cantidad de kilos/unidades recibidas del proveedor para sumar al stock en el acto.

### 3.6 Configuración del Local
* **URL:** `/admin/configuracion`
* Permite modificar y actualizar los datos comerciales de la rotisería:
  - Nombre del local comercial.
  - Subdominio público asignado (para URLs personalizadas).
  - Teléfono de contacto de soporte.
  - Dirección física del establecimiento.
  - Descripción y propuesta gastronómica.

---

## 4. 🏢 GUÍA MAESTRA: Cómo crear un nuevo negocio para un nuevo cliente (Multi-Tenant)

Esta sección explica cómo dar de alta un **nuevo cliente (restaurante o rotisería)** en el sistema, asegurando que sus datos queden 100% aislados y protegidos mediante Row Level Security (RLS).

### 4.1 Comprensión del Modelo de Datos

El sistema multi-inquilino se compone de 4 niveles:

```mermaid
graph TD
    A[auth.users - Usuario de Supabase] -->|id| B(profiles - Perfil de Usuario)
    C[restaurants - Inquilino / Negocio] -->|restaurant_id| B
    C -->|restaurant_id| D[products - Menú del Negocio]
    C -->|restaurant_id| E[inventory_items - Insumos del Negocio]
    C -->|restaurant_id| F[orders - Pedidos del Negocio]
    F -->|order_id| G[order_items - Ítems del Pedido]
```

1. **`restaurants`**: Representa el negocio (nombre, subdominio único).
2. **`auth.users`**: Cuenta de inicio de sesión gestionada por Supabase Auth (correo y contraseña).
3. **`profiles`**: Conecta al usuario con su negocio asignado (`restaurant_id`) y su rol (`admin`).
4. **Tablas hijas (`products`, `inventory_items`, `orders`)**: Tienen una columna obligatoria `restaurant_id`.

---

### 4.2 Paso 1: Crear el Usuario en Supabase Auth

1. Ve a tu panel de **Supabase** ([https://supabase.com/dashboard](https://supabase.com/dashboard)).
2. Selecciona tu proyecto.
3. En el menú lateral izquierdo, haz clic en **Authentication** ➔ **Users**.
4. Haz clic en el botón superior derecho **"Add user"** ➔ **"Create user"**.
5. Ingresa los datos del nuevo cliente:
   - **User Email:** Por ejemplo `admin@doncarlos.com`.
   - **User Password:** Una contraseña segura provisoria o definitiva.
   - Marca la casilla **"Auto Confirm User?"** para que no requiera confirmación por email y pueda entrar de inmediato.
6. Haz clic en **"Create user"**.
7. En la lista de usuarios, busca el usuario recién creado y **copia su UUID** (User UID).  
   *Ejemplo: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`*.

---

### 4.3 Paso 2: Registrar el Nuevo Restaurante

En el menú lateral de Supabase, ve a **SQL Editor** y ejecuta la inserción del nuevo restaurante. Puedes asignarle un UUID nuevo generado automáticamente o uno específico:

```sql
INSERT INTO public.restaurants (name, subdomain) 
VALUES ('Rotisería Don Carlos', 'don-carlos')
RETURNING id;
```
> Copia el `id` (UUID) devuelto por la consulta. Será el `restaurant_id` del nuevo cliente.

---

### 4.4 Paso 3: Asignar el Perfil de Administrador al Usuario

Ahora enlazamos el usuario de Supabase Auth con su restaurante dentro de la tabla `profiles`:

```sql
INSERT INTO public.profiles (id, restaurant_id, full_name, role, phone, address)
VALUES (
  'AQUÍ_EL_UUID_DEL_USUARIO_AUTH',   -- El UUID copiado de Authentication > Users
  'AQUÍ_EL_UUID_DEL_RESTAURANTE',     -- El UUID devuelto en el Paso 2
  'Carlos Gómez',
  'admin',
  '+54 9 11 5555-4321',
  'Av. San Martín 789'
);
```

---

### 4.5 Paso 4: Carga del Menú Inicial (Productos)

Agrega los platos típicos que venderá este nuevo negocio, vinculados a su `restaurant_id`:

```sql
INSERT INTO public.products (restaurant_id, code, name, description, price, category, is_available)
VALUES 
('AQUÍ_EL_UUID_DEL_RESTAURANTE', 'POLL-ALSP', 'Pollo al Spiedo con Papas', 'Pollo asado a las brasas con guarnición de papas al horno.', 12000, 'Pollos', true),
('AQUÍ_EL_UUID_DEL_RESTAURANTE', 'TART-VERD', 'Tarta Pascualina', 'Masa casera con acelga, espinaca, huevo y queso parmesano.', 6500, 'Tartas', true),
('AQUÍ_EL_UUID_DEL_RESTAURANTE', 'EMP-CRI', 'Empanada Criolla', 'Carne suave, huevo picado y cebolla de verdeo.', 1400, 'Empanadas', true);
```

---

### 4.6 Paso 5: Carga del Inventario Inicial (Insumos)

Registra la materia prima que el local utilizará para sus preparaciones:

```sql
INSERT INTO public.inventory_items (restaurant_id, name, quantity_available, unit, min_stock)
VALUES 
('AQUÍ_EL_UUID_DEL_RESTAURANTE', 'Pollo Entero', 25.0, 'unidades', 5),
('AQUÍ_EL_UUID_DEL_RESTAURANTE', 'Papas', 80.0, 'kg', 20),
('AQUÍ_EL_UUID_DEL_RESTAURANTE', 'Acelga Fresca', 15.0, 'kg', 4),
('AQUÍ_EL_UUID_DEL_RESTAURANTE', 'Queso Parmesano', 8.0, 'kg', 2);
```

---

### 4.7 📋 Script SQL Unificado (Plantilla "Copiar y Pegar")

Para mayor comodidad y evitar errores manuales, puedes ejecutar el siguiente bloque SQL unificado en el **SQL Editor** de Supabase. Solo debes reemplazar el correo electrónico del usuario que ya creaste en Auth:

```sql
DO $$
DECLARE
  v_user_email TEXT := 'admin@doncarlos.com'; -- 👈 Cambiar por el email creado en Auth
  v_user_id UUID;
  v_restaurant_id UUID;
BEGIN
  -- 1. Obtener el ID del usuario creado en auth.users
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = v_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'El usuario con correo % no existe en auth.users. Créalo primero en Authentication > Users.', v_user_email;
  END IF;

  -- 2. Crear el nuevo negocio (Restaurante)
  INSERT INTO public.restaurants (name, subdomain)
  VALUES ('Rotisería Don Carlos', 'don-carlos')
  RETURNING id INTO v_restaurant_id;

  -- 3. Crear el perfil de Administrador vinculado al restaurante
  INSERT INTO public.profiles (id, restaurant_id, full_name, role, phone, address)
  VALUES (
    v_user_id,
    v_restaurant_id,
    'Carlos Gómez (Titular)',
    'admin',
    '+54 11 9999-8888',
    'Av. San Martín 789'
  );

  -- 4. Insertar productos de muestra para el nuevo negocio
  INSERT INTO public.products (restaurant_id, code, name, description, price, category, is_available)
  VALUES 
    (v_restaurant_id, 'POLL-01', 'Pollo al Spiedo Clásico', 'Dorado y jugoso con especias.', 11500, 'Pollos', true),
    (v_restaurant_id, 'PAP-01', 'Porción de Papas Fritas', 'Papas rústicas cortadas a mano.', 4200, 'Guarniciones', true),
    (v_restaurant_id, 'TART-01', 'Tarta de Jamón y Queso', 'Masa hojaldrada con doble queso.', 6800, 'Tartas', true);

  -- 5. Insertar inventario inicial para el nuevo negocio
  INSERT INTO public.inventory_items (restaurant_id, name, quantity_available, unit, min_stock)
  VALUES 
    (v_restaurant_id, 'Pollo Fresco', 30.0, 'unidades', 10),
    (v_restaurant_id, 'Bolsa de Papas', 120.0, 'kg', 30),
    (v_restaurant_id, 'Aceite de Girasol', 40.0, 'litros', 10);

  RAISE NOTICE '¡Negocio y Administrador creados exitosamente! Restaurant ID: %', v_restaurant_id;
END $$;
```

---

### 4.8 Verificación de Aislamiento y Acceso

Una vez ejecutado el script:
1. Abre una ventana de incógnito o cierra tu sesión actual.
2. Ingresa a `http://localhost:3000/login`.
3. Inicia sesión con el correo del nuevo cliente (`admin@doncarlos.com`) y su contraseña.
4. **Comprobación:**
   - En el Dashboard (`/admin`), los KPIs mostrarán las ventas y pedidos únicamente correspondientes a este nuevo local (empezará en $0 y 0 pedidos).
   - En el Punto de Venta (`/admin/pos`), el catálogo solo mostrará el pollo, papas y tarta de Don Carlos (no verá las empanadas o pizzas de otros locales).
   - En Inventario (`/admin/inventario`), solo verá sus bolsas de papas, pollos y aceite.
   - En Cocina (`/admin/cocina`), solo recibirá las comandas generadas para Don Carlos.
5. **Esto es posible gracias a las políticas RLS:**
   ```sql
   CREATE POLICY "Users can manage their products" 
   ON public.products FOR ALL 
   USING (restaurant_id = (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()));
   ```

---

### 4.9 Subdominios y Despliegue en Producción

Para que cada cliente tenga su propia tienda online pública:
* En `supabase/schema.sql`, cada restaurante posee una columna `subdomain` única (ej: `don-carlos`, `rotiseria-central`).
* En producción con Next.js y Vercel/Cloudflare, se configuran *Wildcard Subdomains* (ej: `don-carlos.tuplataforma.com`).
* En el archivo `src/lib/api.ts`, la función `getPublicTenantId()` puede leer el subdominio desde el encabezado `Host` de la petición HTTP y resolver el `restaurant_id` correspondiente de forma dinámica para renderizar el catálogo propio de ese cliente.

---

## 5. Flujo Operativo de Punta a Punta (Ciclo de Vida de una Orden)

A continuación se detalla cómo interactúan todos los módulos en una orden típica:

1. **Recepción del Pedido:**
   - **Opción A (Online):** El cliente entra al e-commerce, agrega productos a su carrito, completa datos de entrega y confirma.
   - **Opción B (Presencial):** El cajero toma el pedido en `/admin/pos` y presiona *Confirmar Venta*.
2. **Registro en Base de Datos:**
   - Se crea el registro en `orders` con estado inicial `pending`.
   - Se crean los ítems en `order_items` con sus precios congelados.
3. **Disparo en Cocina:**
   - La pantalla de cocina (`/admin/cocina`) detecta el nuevo pedido por WebSocket en tiempo real mediante `supabase.channel('kitchen-orders')`.
   - La comanda aparece con timbre/notificación visual en la columna **Pendientes**.
4. **Cocción:**
   - El cocinero presiona *Comenzar Preparación*. La orden pasa a `preparing`.
   - Si el comensal consulta en `/seguimiento`, verá que su barra de progreso avanza a *"En Preparación"*.
5. **Listo para Entrega:**
   - El cocinero presiona *Marcar Listo*. La orden pasa a `ready`.
   - En mostrador y en la pantalla del cliente se informa que el pedido ya puede ser retirado o entregado al repartidor de delivery.
6. **Cierre y Métricas:**
   - Al ser entregado, la orden pasa a `completed`.
   - El Dashboard (`/admin`) suma automáticamente el monto a las *Ventas de hoy* y actualiza el *Ticket Promedio*.

---

## 6. Preguntas Frecuentes y Resolución de Problemas

### ❓ Al iniciar sesión sale el error: *"No tienes un perfil de rotisería asignado"*
* **Causa:** El usuario fue creado en Supabase Auth (`auth.users`), pero aún no tiene su fila correspondiente en la tabla `public.profiles` con su `restaurant_id`.
* **Solución:** Ejecuta el Paso 3 o la plantilla del Paso 4.7 para insertar el registro en `profiles`.

### ❓ No se ven los productos en la tienda pública
* **Causa 1:** El producto tiene `is_available = false`. Cámbialo a `true` en la base de datos o panel.
* **Causa 2:** En desarrollo, `getPublicTenantId()` toma el primer restaurante registrado. Si agregaste un restaurante nuevo y quieres que sea el predeterminado en desarrollo, actualiza el fallback en `src/lib/api.ts` o define el ID en una variable de entorno.

### ❓ La cocina no se actualiza automáticamente al crear una orden
* **Causa:** La replicación en tiempo real no está activada para la tabla `orders`.
* **Solución:** En tu panel de Supabase ve a **Database** ➔ **Replication**, y activa la casilla para la tabla `public.orders`.

### ❓ ¿Cómo añadir un empleado de cocina sin darle acceso al dinero?
* Crea el usuario en Supabase Auth y en `public.profiles` asigna el campo `role = 'cook'`.
* Puedes limitar el acceso en la interfaz para que este usuario solo navegue en `/admin/cocina`.
