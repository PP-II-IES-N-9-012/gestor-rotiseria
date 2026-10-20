-- =================================================================================
-- MIGRACIÓN: Recetas de Productos y Consumo de Insumos del Inventario
-- =================================================================================

CREATE TABLE IF NOT EXISTS public.product_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  quantity NUMERIC(10,3) NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(product_id, inventory_item_id)
);

-- Habilitar RLS
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Public can view product ingredients" ON public.product_ingredients;
CREATE POLICY "Public can view product ingredients" 
ON public.product_ingredients FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can manage their product ingredients" ON public.product_ingredients;
CREATE POLICY "Users can manage their product ingredients" 
ON public.product_ingredients FOR ALL 
USING (restaurant_id = (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()));

-- Índices para optimizar consultas de inventario
CREATE INDEX IF NOT EXISTS idx_prod_ing_product ON public.product_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_prod_ing_item ON public.product_ingredients(inventory_item_id);
