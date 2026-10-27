-- =================================================================================
-- MIGRACIÓN DE CONTROL DE ACCESO BASADO EN ROLES (RBAC) Y POLÍTICAS RLS
-- Roles: admin, seller, cook, customer
-- =================================================================================

-- 1. Funciones auxiliares de seguridad (SECURITY DEFINER para consultas rápidas y seguras)
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_restaurant_id()
RETURNS UUID AS $$
  SELECT restaurant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- 2. Asegurar RLS en todas las tablas
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;


-- 3. Limpiar políticas previas para evitar conflictos
DROP POLICY IF EXISTS "Public can read restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Users can update their own restaurant" ON public.restaurants;
DROP POLICY IF EXISTS "Admins can update their restaurant" ON public.restaurants;

DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles of their restaurant" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Public can read products" ON public.products;
DROP POLICY IF EXISTS "Users can manage their products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Staff can read products" ON public.products;

DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users can manage their orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their orders" ON public.orders;
DROP POLICY IF EXISTS "Admins and sellers can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can read orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can read their order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can read order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;

DROP POLICY IF EXISTS "Users can manage their inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Staff can read inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory_items;

DROP POLICY IF EXISTS "Users can manage their inventory movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Staff can read inventory movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Admins can manage inventory movements" ON public.inventory_movements;


-- =================================================================================
-- RESTAURANTS
-- - Lectura pública (tienda online / ecommerce).
-- - Solo rol 'admin' puede modificar ajustes del restaurante.
-- =================================================================================
CREATE POLICY "Public can read restaurants" 
ON public.restaurants FOR SELECT 
USING (true);

CREATE POLICY "Admins can update their restaurant" 
ON public.restaurants FOR UPDATE 
USING (
  id = public.get_auth_restaurant_id() 
  AND public.get_auth_role() = 'admin'
);


-- =================================================================================
-- PROFILES
-- - Los usuarios pueden leer y editar su propio perfil.
-- - Los administradores pueden ver todos los perfiles de su restaurante (para gestión de personal).
-- =================================================================================
CREATE POLICY "Users can read their own profile" 
ON public.profiles FOR SELECT 
USING (
  id = auth.uid() 
  OR (
    restaurant_id = public.get_auth_restaurant_id() 
    AND public.get_auth_role() = 'admin'
  )
);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (id = auth.uid());


-- =================================================================================
-- PRODUCTS
-- - Lectura pública (tienda online).
-- - Solo rol 'admin' puede crear, editar o eliminar productos.
-- =================================================================================
CREATE POLICY "Public can read products" 
ON public.products FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage products" 
ON public.products FOR ALL 
USING (
  restaurant_id = public.get_auth_restaurant_id() 
  AND public.get_auth_role() = 'admin'
);


-- =================================================================================
-- ORDERS
-- - Clientes anónimos/públicos o clientes pueden crear órdenes (e-commerce).
-- - Staff (admin, seller, cook) pueden leer órdenes de su restaurante.
-- - Staff (admin, seller, cook) pueden actualizar órdenes (ej. cocinero cambia a preparando/listo, vendedor/admin a pagado/completado).
-- - Admin y seller pueden insertar órdenes (POS).
-- - Solo admin puede eliminar órdenes.
-- =================================================================================
CREATE POLICY "Public can insert orders" 
ON public.orders FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Staff can read orders" 
ON public.orders FOR SELECT 
USING (
  restaurant_id = public.get_auth_restaurant_id() 
  AND public.get_auth_role() IN ('admin', 'seller', 'cook')
);

CREATE POLICY "Staff can update orders" 
ON public.orders FOR UPDATE 
USING (
  restaurant_id = public.get_auth_restaurant_id() 
  AND public.get_auth_role() IN ('admin', 'seller', 'cook')
);

CREATE POLICY "Admins can delete orders" 
ON public.orders FOR DELETE 
USING (
  restaurant_id = public.get_auth_restaurant_id() 
  AND public.get_auth_role() = 'admin'
);


-- =================================================================================
-- ORDER ITEMS
-- - Clientes anónimos/públicos pueden insertar items.
-- - Staff (admin, seller, cook) pueden leer items de las comandas de su restaurante.
-- - Admin y seller pueden crear items (POS).
-- - Admin puede gestionar completamente (ALL) los items.
-- =================================================================================
CREATE POLICY "Public can insert order items" 
ON public.order_items FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Staff can read order items" 
ON public.order_items FOR SELECT 
USING (
  order_id IN (
    SELECT id FROM public.orders 
    WHERE restaurant_id = public.get_auth_restaurant_id()
  )
  AND public.get_auth_role() IN ('admin', 'seller', 'cook')
);

CREATE POLICY "Admins and sellers can manage order items" 
ON public.order_items FOR ALL 
USING (
  order_id IN (
    SELECT id FROM public.orders 
    WHERE restaurant_id = public.get_auth_restaurant_id()
  )
  AND public.get_auth_role() IN ('admin', 'seller')
);


-- =================================================================================
-- INVENTORY ITEMS & MOVEMENTS
-- - Staff de cocina y ventas pueden ver el inventario (SELECT).
-- - Solo admin puede crear, modificar o eliminar items de inventario y registrar movimientos.
-- =================================================================================
CREATE POLICY "Staff can read inventory" 
ON public.inventory_items FOR SELECT 
USING (
  restaurant_id = public.get_auth_restaurant_id() 
  AND public.get_auth_role() IN ('admin', 'seller', 'cook')
);

CREATE POLICY "Admins can manage inventory" 
ON public.inventory_items FOR ALL 
USING (
  restaurant_id = public.get_auth_restaurant_id() 
  AND public.get_auth_role() = 'admin'
);

CREATE POLICY "Staff can read inventory movements" 
ON public.inventory_movements FOR SELECT 
USING (
  item_id IN (
    SELECT id FROM public.inventory_items 
    WHERE restaurant_id = public.get_auth_restaurant_id()
  )
  AND public.get_auth_role() IN ('admin', 'seller', 'cook')
);

CREATE POLICY "Admins can manage inventory movements" 
ON public.inventory_movements FOR ALL 
USING (
  item_id IN (
    SELECT id FROM public.inventory_items 
    WHERE restaurant_id = public.get_auth_restaurant_id()
  )
  AND public.get_auth_role() = 'admin'
);
