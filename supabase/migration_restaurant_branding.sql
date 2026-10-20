-- =================================================================================
-- MIGRACIÓN COMPLETA: Personalización Profunda de Tienda (Branding, Colores, Logos, Banners, Temas y Redes)
-- Ejecutar en Supabase -> SQL Editor -> New Query -> Run
-- =================================================================================

-- 1. Agregar todas las columnas de personalización estética y de información
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_handle TEXT,
ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
ADD COLUMN IF NOT EXISTS opening_hours TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#e59324',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#d34e2c',
ADD COLUMN IF NOT EXISTS theme_style TEXT DEFAULT 'rustic',
ADD COLUMN IF NOT EXISTS font_style TEXT DEFAULT 'serif',
ADD COLUMN IF NOT EXISTS announcement_banner TEXT DEFAULT '🔥 Horno encendido y cocina despachando pedidos en vivo',
ADD COLUMN IF NOT EXISTS announcement_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS estimated_delivery_time TEXT DEFAULT '35-45 min',
ADD COLUMN IF NOT EXISTS highlight_tag_1 TEXT DEFAULT 'Horno a Leña & Fuego',
ADD COLUMN IF NOT EXISTS highlight_tag_2 TEXT DEFAULT '100% Casero',
ADD COLUMN IF NOT EXISTS highlight_tag_3 TEXT DEFAULT 'Atención Directa',
ADD COLUMN IF NOT EXISTS is_store_open BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS closed_message TEXT DEFAULT 'Horno cerrado por el momento. ¡Abrimos pronto!',
ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_cost TEXT DEFAULT 'A coordinar',
ADD COLUMN IF NOT EXISTS accepts_cash BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS accepts_transfer BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS transfer_alias TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS accepts_card BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS cash_discount_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS hero_cta_text TEXT DEFAULT 'Pedir al plato',
ADD COLUMN IF NOT EXISTS hero_overlay_opacity TEXT DEFAULT 'dark',
ADD COLUMN IF NOT EXISTS footer_custom_text TEXT DEFAULT 'Cocina tradicional, recetas familiares y entrega directa sin intermediarios.';

-- 2. Asegurar que las políticas RLS permitan actualizar estas columnas por parte del administrador
DROP POLICY IF EXISTS "Users can update their own restaurant" ON public.restaurants;
CREATE POLICY "Users can update their own restaurant" 
ON public.restaurants FOR UPDATE 
USING (id = (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()));

-- 3. Los clientes públicos pueden leer todas las columnas de la tienda
DROP POLICY IF EXISTS "Public can read restaurants" ON public.restaurants;
CREATE POLICY "Public can read restaurants" 
ON public.restaurants FOR SELECT 
USING (true);

-- 4. (Opcional pero Recomendado) Crear Bucket público de Storage para Logos y Banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-media', 'restaurant-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Permitir subida de imagenes en restaurant-media" ON storage.objects;
CREATE POLICY "Permitir subida de imagenes en restaurant-media" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'restaurant-media');

DROP POLICY IF EXISTS "Permitir lectura publica de restaurant-media" ON storage.objects;
CREATE POLICY "Permitir lectura publica de restaurant-media" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'restaurant-media');
