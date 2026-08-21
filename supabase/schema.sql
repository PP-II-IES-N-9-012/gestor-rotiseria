-- Create custom enums
CREATE TYPE user_role AS ENUM ('admin', 'seller', 'cook', 'customer');
CREATE TYPE delivery_type AS ENUM ('local_pickup', 'delivery', 'dine_in');
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'ready', 'delivering', 'completed', 'cancelled');
CREATE TYPE inventory_movement_type AS ENUM ('in', 'out', 'loss');

-- Profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  ingredients TEXT[],
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Orders
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Null for guests
  guest_name TEXT, -- Fallback for guests without an account
  guest_phone TEXT,
  guest_address TEXT,
  delivery_type delivery_type NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(10,2) NOT NULL,
  notes TEXT,
  payment_method TEXT, -- e.g., 'cash', 'mercadopago'
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid'
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
  name TEXT NOT NULL,
  quantity_available NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL, -- e.g., 'kg', 'litros', 'unidades'
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

-- Seed Initial Data
INSERT INTO public.products (code, name, description, price, category, is_available) VALUES
('EMP-CAR', 'Empanada de Carne', 'Carne cortada a cuchillo con cebolla, huevo duro y aceitunas.', 1500, 'Empanadas', true),
('EMP-JYQ', 'Empanada de Jamón y Queso', 'Clásica con abundante jamón y queso muzzarella.', 1400, 'Empanadas', true),
('PIZ-MUZ', 'Pizza Muzzarella', 'Salsa de tomate, queso muzzarella, orégano y aceitunas.', 8500, 'Pizzas', true),
('PIZ-ESP', 'Pizza Especial', 'Muzzarella, jamón, morrones asados y aceitunas.', 10500, 'Pizzas', true),
('MIN-MIL', 'Milanesa con Papas Fritas', 'Milanesa de ternera acompañada de papas fritas crujientes.', 9500, 'Minutas', true);

INSERT INTO public.inventory_items (name, quantity_available, unit, min_stock) VALUES
('Carne Picada', 20.5, 'kg', 5),
('Muzzarella', 15.0, 'kg', 3),
('Harina', 50.0, 'kg', 10),
('Jamón Cocido', 5.0, 'kg', 2);
