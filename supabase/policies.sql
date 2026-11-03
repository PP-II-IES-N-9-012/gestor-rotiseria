-- =================================================================================
-- POLITICAS DE SEGURIDAD (RLS) MULTI-TENANT CON CONTROL DE ROLES (RBAC)
-- Roles disponibles: 'admin', 'seller', 'cook', 'customer'
-- =================================================================================

-- 1. Funciones auxiliares de seguridad (SECURITY DEFINER para consultas eficientes)
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_restaurant_id()
RETURNS UUID AS $$
  SELECT restaurant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- 2. Asegurarnos que el RLS esté activado en todas las tablas
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;


-- 3. Eliminar políticas existentes para garantizar un despliegue limpio
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
DROP POLICY IF EXISTS "Public can read orders" ON public.orders;
DROP POLICY IF EXISTS "Users can manage their orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their orders" ON public.orders;
DROP POLICY IF EXISTS "Admins and sellers can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can read orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can read order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can read their order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can read order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins and sellers can manage order items" ON public.order_items;

DROP POLICY IF EXISTS "Users can manage their inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Staff can read inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory_items;

DROP POLICY IF EXISTS "Users can manage their inventory movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Staff can read inventory movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Admins can manage inventory movements" ON public.inventory_movements;


-- =================================================================================
-- RESTAURANTS
-- - Lectura pública (tienda online / e-commerce).
-- - Solo rol 'admin' puede editar configuración de su restaurante.
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
-- - Los administradores pueden ver todos los perfiles de su restaurante.
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
-- - Público puede ver catálogo disponible.
-- - Solo administradores pueden crear, modificar o eliminar productos.
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
-- - Público puede crear pedidos (tienda online).
-- - Staff (admin, seller, cook) puede ver pedidos de su restaurante.
-- - Staff (admin, seller, cook) puede actualizar estado del pedido.
-- - Solo admin puede eliminar órdenes.
-- =================================================================================
CREATE POLICY "Public can insert orders" 
ON public.orders FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can read orders" 
ON public.orders FOR SELECT 
USING (true);

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
-- - Público puede insertar items de pedido y consultarlos en seguimiento.
-- - Staff (admin, seller, cook) puede ver items de las comandas.
-- - Admin y seller pueden gestionar items (POS).
-- =================================================================================
CREATE POLICY "Public can insert order items" 
ON public.order_items FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can read order items" 
ON public.order_items FOR SELECT 
USING (true);

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
-- - Todo el personal (admin, seller, cook) puede consultar el stock (SELECT).
-- - Solo administradores pueden gestionar items y registrar movimientos de stock.
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
