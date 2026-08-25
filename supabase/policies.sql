-- =================================================================================
-- POLITICAS DE SEGURIDAD (RLS) PARA MULTI-TENANT
-- =================================================================================

-- 1. Asegurarnos que el RLS esté activado en todas las tablas
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes (por si se ejecuta este script más de una vez)
DROP POLICY IF EXISTS "Public can read restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Users can update their own restaurant" ON public.restaurants;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can read products" ON public.products;
DROP POLICY IF EXISTS "Users can manage their products" ON public.products;
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users can manage their orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can manage their order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can manage their inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can manage their inventory movements" ON public.inventory_movements;


-- =================================================================================
-- RESTAURANTS
-- Todo el mundo (público) puede ver la lista de restaurantes (para el e-commerce).
-- Solo los dueños de ese restaurante (según su perfil) pueden editarlo.
-- =================================================================================
CREATE POLICY "Public can read restaurants" 
ON public.restaurants FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own restaurant" 
ON public.restaurants FOR UPDATE 
USING (id = (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()));


-- =================================================================================
-- PROFILES
-- Los usuarios solo pueden ver y editar su propio perfil.
-- =================================================================================
CREATE POLICY "Users can read their own profile" 
ON public.profiles FOR SELECT 
USING (id = auth.uid());


-- =================================================================================
-- PRODUCTS
-- Públicos (anon) pueden leer productos para poder comprarlos.
-- Administradores solo pueden crear/editar/borrar productos de SU restaurante.
-- =================================================================================
CREATE POLICY "Public can read products" 
ON public.products FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their products" 
ON public.products FOR ALL 
USING (restaurant_id = (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()));


-- =================================================================================
-- ORDERS
-- Públicos (anon) pueden crear (INSERT) nuevas órdenes.
-- Administradores solo pueden ver y actualizar órdenes de SU restaurante.
-- =================================================================================
CREATE POLICY "Public can insert orders" 
ON public.orders FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can manage their orders" 
ON public.orders FOR SELECT 
USING (restaurant_id = (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their orders" 
ON public.orders FOR UPDATE 
USING (restaurant_id = (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()));


-- =================================================================================
-- ORDER ITEMS
-- Públicos (anon) pueden crear (INSERT) items de órdenes.
-- Administradores pueden leerlos basado en el restaurant de la orden madre.
-- =================================================================================
CREATE POLICY "Public can insert order items" 
ON public.order_items FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can read their order items" 
ON public.order_items FOR SELECT 
USING (
  order_id IN (
    SELECT id FROM public.orders 
    WHERE restaurant_id = (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid())
  )
);


-- =================================================================================
-- INVENTORY ITEMS
-- Solo los administradores pueden gestionar el inventario de su restaurante.
-- =================================================================================
CREATE POLICY "Users can manage their inventory" 
ON public.inventory_items FOR ALL 
USING (restaurant_id = (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()));


-- =================================================================================
-- INVENTORY MOVEMENTS
-- =================================================================================
CREATE POLICY "Users can manage their inventory movements" 
ON public.inventory_movements FOR ALL 
USING (
  item_id IN (
    SELECT id FROM public.inventory_items 
    WHERE restaurant_id = (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid())
  )
);
