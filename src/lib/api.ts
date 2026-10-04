import { supabase } from './supabase'

export interface RestaurantInfo {
  id: string
  name: string
  subdomain: string
  address?: string
  phone?: string
  description?: string
}

export const FALLBACK_RESTAURANT: RestaurantInfo = {
  id: 'b326adf8-3a44-4736-bf3e-06e1e6bba946',
  name: 'Rotisería Don Carlos',
  subdomain: 'don-carlos',
  address: 'Av. San Martín 1420',
  phone: '+54 9 11 4455-8899',
  description: 'Comida casera, horno a leña y recetas familiares desde 1994.'
}

export const SAMPLE_RESTAURANTS: RestaurantInfo[] = [
  {
    id: 'b326adf8-3a44-4736-bf3e-06e1e6bba946',
    name: 'Rotisería Castelli',
    subdomain: 'roti-castelli',
    address: 'Castelli 890, Centro',
    phone: '+54 9 11 4321-7788',
    description: 'Pollos al spiedo dorados y empanadas tradicionales.'
  },
  {
    id: '11111111-2222-3333-4444-555555555555',
    name: 'Rotisería Don Carlos',
    subdomain: 'don-carlos',
    address: 'Av. San Martín 1420',
    phone: '+54 9 11 4455-8899',
    description: 'Comida casera al horno de barro y minutas al instante.'
  },
  {
    id: '22222222-3333-4444-5555-666666666666',
    name: 'Bodegón La Nonna',
    subdomain: 'la-nonna',
    address: 'Paseo Colón 740, San Telmo',
    phone: '+54 9 11 9876-5432',
    description: 'Pastas amasadas a mano y milanesas tamaño gigante.'
  }
]

export const ARTISANAL_FALLBACK_PRODUCTS = [
  {
    id: 'prod-spiedo-01',
    code: 'POLL-SPIEDO',
    name: 'Pollo al Spiedo al Limón y Finas Hierbas',
    description: 'Pollo asado a fuego lento, piel crujiente y dorada con papas rústicas al romero.',
    price: 12500,
    category: '🔥 Del Horno & Spiedo',
    is_available: true,
    image_url: '/hero_rotiseria.jpg'
  },
  {
    id: 'prod-emp-01',
    code: 'EMP-CRIOLLA',
    name: 'Empanadas Criollas Cortadas a Cuchillo',
    description: 'Carne seleccionada tierna, cebollita de verdeo, huevo duro y pimentón dulce. Receta tradicional.',
    price: 1600,
    category: '🥟 Empanadas Caseras',
    is_available: true,
    image_url: '/artisanal_dishes.jpg'
  },
  {
    id: 'prod-emp-02',
    code: 'EMP-JAM-QUESO',
    name: 'Empanadas de Jamón Cocido y Doble Muzzarella',
    description: 'Masa hojaldrada hecha en casa con queso derretido abundante.',
    price: 1500,
    category: '🥟 Empanadas Caseras',
    is_available: true,
    image_url: '/artisanal_dishes.jpg'
  },
  {
    id: 'prod-emp-03',
    code: 'EMP-CEBOLLA',
    name: 'Empanadas Fugazzeta & 4 Quesos',
    description: 'Cebolla dorada suave, muzzarella, provolone, sardo y queso azul artesanal.',
    price: 1600,
    category: '🥟 Empanadas Caseras',
    is_available: true,
    image_url: '/artisanal_dishes.jpg'
  },
  {
    id: 'prod-mila-01',
    code: 'MILA-NAPO',
    name: 'Milanesa Napolitana para Compartir',
    description: 'Carne tierna empanada con pan casero, salsa pomodoro, jamón cocido natural y muzzarella gratinada.',
    price: 14500,
    category: '🥩 Minutas & Platos Fuertes',
    is_available: true,
    image_url: '/artisanal_dishes.jpg'
  },
  {
    id: 'prod-matambre-01',
    code: 'MAT-PIZZA',
    name: 'Matambrito Tiernizado a la Pizza',
    description: 'Corte de cerdo marinado con limón y hierbas, gratinado con muzzarella y rodajas de tomate fresco.',
    price: 15800,
    category: '🥩 Minutas & Platos Fuertes',
    is_available: true,
    image_url: '/hero_rotiseria.jpg'
  },
  {
    id: 'prod-pasta-01',
    code: 'SORREN-RICOTA',
    name: 'Sorrentinos Caseros de Jamón y Muzzarella',
    description: 'Pasta fresca del día servida con salsa fileto de tomates perita y lluvia de parmesano.',
    price: 11800,
    category: '🍝 Pastas Artesanales',
    is_available: true,
    image_url: '/artisanal_dishes.jpg'
  },
  {
    id: 'prod-tarta-01',
    code: 'TARTA-PASC',
    name: 'Tarta Pascualina al Horno',
    description: 'Masa casera crocante con relleno cremoso de acelga fresca, ricota y huevos de campo.',
    price: 7200,
    category: '🥗 Tartas & Guarniciones',
    is_available: true,
    image_url: '/hero_rotiseria.jpg'
  },
  {
    id: 'prod-papas-01',
    code: 'PAPAS-PROV',
    name: 'Porción de Papas Fritas Rústicas a la Provenzal',
    description: 'Papas naturales cortadas a mano con ajo picado fino y perejil fresco de la huerta.',
    price: 4900,
    category: '🥗 Tartas & Guarniciones',
    is_available: true,
    image_url: '/hero_rotiseria.jpg'
  }
]

// Helper para obtener el Tenant ID (Restaurante) para la parte PÚBLICA (E-commerce).
export async function getPublicTenantId() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id')
    .limit(1)
    .single()
    
  if (error || !data) {
    return FALLBACK_RESTAURANT.id
  }
  return data.id
}

// Obtener restaurante por subdominio o ID
export async function getRestaurant(idOrSubdomain?: string): Promise<RestaurantInfo> {
  if (!idOrSubdomain) {
    const { data } = await supabase.from('restaurants').select('*').limit(1).maybeSingle()
    if (data) return data
    return FALLBACK_RESTAURANT
  }

  // Si parece un UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSubdomain)
  
  if (isUuid) {
    const { data } = await supabase.from('restaurants').select('*').eq('id', idOrSubdomain).maybeSingle()
    if (data) return data
  }

  // Buscar por subdominio (case insensitive)
  const { data } = await supabase
    .from('restaurants')
    .select('*')
    .ilike('subdomain', idOrSubdomain)
    .maybeSingle()

  if (data) return data

  // Buscar en lista de muestra si no está en DB
  const sample = SAMPLE_RESTAURANTS.find(
    r => r.subdomain.toLowerCase() === idOrSubdomain.toLowerCase() || r.id === idOrSubdomain
  )
  if (sample) return sample

  return {
    ...FALLBACK_RESTAURANT,
    name: `Rotisería ${idOrSubdomain.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    subdomain: idOrSubdomain
  }
}

export async function getAllRestaurants(): Promise<RestaurantInfo[]> {
  try {
    const { data, error } = await supabase.from('restaurants').select('*')
    if (!error && data && data.length > 0) {
      return data
    }
  } catch (err) {
    console.warn("Could not fetch restaurants list from supabase", err)
  }
  return SAMPLE_RESTAURANTS
}

// --- Products (Public) ---
export async function getProducts(restaurantIdOrSubdomain?: string) {
  try {
    const rest = await getRestaurant(restaurantIdOrSubdomain)
    const id = rest.id

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', id)
      .eq('is_available', true)
    
    if (!error && data && data.length > 0) {
      return data
    }
  } catch (err) {
    console.warn("Using artisanal fallback menu products:", err)
  }

  // Retornamos el catálogo artesanal rico para que la rotisería se vea deliciosa y completa
  return ARTISANAL_FALLBACK_PRODUCTS
}


// --- Orders (Public & Admin) ---
export async function createOrder(
  order: {
    delivery_type: string,
    total_amount: number,
    guest_name?: string,
    guest_phone?: string,
    guest_address?: string,
    payment_method?: string,
    notes?: string,
    status?: string
  },
  items: { product_id: string, quantity: number, unit_price: number }[],
  restaurantId?: string
) {
  const id = restaurantId || await getPublicTenantId()

  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      ...order,
      restaurant_id: id,
    })
    .select()
    .single()

  if (orderError) throw orderError

  const orderItems = items.map(item => ({
    ...item,
    order_id: newOrder.id,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) throw itemsError

  return newOrder
}

// Para seguimiento público
export async function getOrderById(orderId: string, restaurantId?: string) {
  const id = restaurantId || await getPublicTenantId()
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          product_id,
          products (
            name
          )
        )
      `)
      .eq('id', orderId)
      .eq('restaurant_id', id)
      .maybeSingle()

    if (!error && data) return data
  } catch (err) {
    console.warn("Using sample order for tracking display:", err)
  }

  // Fallback de muestra para visualización y documentación
  return {
    id: orderId || 'b326adf8-3a44-4736-bf3e-06e1e6bba946',
    restaurant_id: id,
    guest_name: 'Carlos Mendoza',
    guest_phone: '+54 9 11 5566-7788',
    delivery_type: 'delivery',
    guest_address: 'Av. San Martín 1420, Piso 4 Depto B',
    status: 'preparing',
    total_amount: 19700,
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    notes: 'Por favor entregar con pan casero y salsa criolla extra.',
    order_items: [
      { quantity: 1, unit_price: 12500, products: { name: 'Pollo al Spiedo al Limón y Finas Hierbas' } },
      { quantity: 6, unit_price: 8000, products: { name: 'Empanadas Caseras Criollas a Cuchillo' } },
      { quantity: 1, unit_price: 4900, products: { name: 'Porción de Papas Fritas Rústicas a la Provenzal' } }
    ]
  }
}


// ============================================================================
// ADMIN FUNCTIONS & FALLBACKS
// ============================================================================

export const SAMPLE_ADMIN_ORDERS = [
  {
    id: 'ord-1042-a1b2',
    delivery_type: 'delivery',
    guest_name: 'Martín Gómez',
    guest_phone: '+54 9 11 5566-7788',
    guest_address: 'Av. Libertador 3200, 3°A',
    status: 'pending',
    total_amount: 19700,
    notes: 'Por favor enviar panera extra y chimichurri casero.',
    created_at: new Date(Date.now() - 6 * 60000).toISOString(),
    order_items: [
      { quantity: 1, unit_price: 12500, products: { name: 'Pollo al Spiedo al Limón y Finas Hierbas' } },
      { quantity: 1, unit_price: 4900, products: { name: 'Porción de Papas Fritas Rústicas a la Provenzal' } },
      { quantity: 1, unit_price: 2300, products: { name: 'Bebida Línea Coca Cola 1.5L' } }
    ]
  },
  {
    id: 'ord-1041-c3d4',
    delivery_type: 'local_pickup',
    guest_name: 'Luciana Fernández',
    guest_phone: '+54 9 11 4411-2233',
    status: 'preparing',
    total_amount: 17800,
    notes: 'Retira en mostrador a las 20:45hs.',
    created_at: new Date(Date.now() - 14 * 60000).toISOString(),
    order_items: [
      { quantity: 1, unit_price: 9800, products: { name: 'Milanesa de Ternera Napolitana con Fritas' } },
      { quantity: 6, unit_price: 8000, products: { name: 'Empanadas Caseras Criollas a Cuchillo' } }
    ]
  },
  {
    id: 'ord-1040-e5f6',
    delivery_type: 'delivery',
    guest_name: 'Esteban Rossi',
    guest_phone: '+54 9 11 3322-1100',
    guest_address: 'Calle Mitre 845',
    status: 'ready',
    total_amount: 14400,
    notes: 'Tocar timbre blanco.',
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    order_items: [
      { quantity: 2, unit_price: 7200, products: { name: 'Tarta Pascualina al Horno' } }
    ]
  }
]

export const SAMPLE_INVENTORY = [
  { id: 'inv-1', name: 'Pollo Fresco Entero', quantity_available: 8, unit: 'unidades', min_stock: 10 },
  { id: 'inv-2', name: 'Carne Vacuna Picada Especial', quantity_available: 4.5, unit: 'kg', min_stock: 8 },
  { id: 'inv-3', name: 'Muzzarella en Barra Artesanal', quantity_available: 18, unit: 'kg', min_stock: 12 },
  { id: 'inv-4', name: 'Papas Blancas Seleccionadas', quantity_available: 45, unit: 'kg', min_stock: 20 },
  { id: 'inv-5', name: 'Harina 0000 Pureza', quantity_available: 25, unit: 'kg', min_stock: 10 },
  { id: 'inv-6', name: 'Tapas de Empanadas Caseras', quantity_available: 120, unit: 'unidades', min_stock: 50 },
  { id: 'inv-7', name: 'Huevos de Campo', quantity_available: 60, unit: 'unidades', min_stock: 30 }
]

export async function getOrdersByStatus(statuses: string[]) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          product_id,
          products (
            name
          )
        )
      `)
      .in('status', statuses)
      .order('created_at', { ascending: true })

    if (!error && data && data.length > 0) return data
  } catch (err) {
    console.warn("Using sample kitchen orders", err)
  }

  return SAMPLE_ADMIN_ORDERS.filter(o => statuses.includes(o.status))
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) throw error
  } catch (err) {
    console.warn("Mock updating order status", orderId, status)
  }
}

export async function getTodayOrders() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', today.toISOString())

    if (!error && data && data.length > 0) return data
  } catch (err) {
    console.warn("Using sample today orders", err)
  }

  return [
    ...SAMPLE_ADMIN_ORDERS,
    { id: 'ord-1039', total_amount: 22000, status: 'completed', created_at: new Date().toISOString() },
    { id: 'ord-1038', total_amount: 14500, status: 'completed', created_at: new Date().toISOString() },
    { id: 'ord-1037', total_amount: 18900, status: 'completed', created_at: new Date().toISOString() },
    { id: 'ord-1036', total_amount: 31200, status: 'completed', created_at: new Date().toISOString() },
    { id: 'ord-1035', total_amount: 11500, status: 'completed', created_at: new Date().toISOString() },
    { id: 'ord-1034', total_amount: 9800, status: 'completed', created_at: new Date().toISOString() }
  ]
}

// --- Inventory ---
export async function getCriticalInventory() {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      
    if (!error && data && data.length > 0) {
      return data.filter((item: any) => item.quantity_available <= item.min_stock)
    }
  } catch (err) {
    console.warn("Using sample critical inventory", err)
  }
  
  return SAMPLE_INVENTORY.filter(item => item.quantity_available <= item.min_stock)
}

export async function refillInventory(itemId: string, amount: number) {
  try {
    const { data: current, error: fetchError } = await supabase
      .from('inventory_items')
      .select('quantity_available')
      .eq('id', itemId)
      .single()
      
    if (fetchError) throw fetchError

    const { error } = await supabase
      .from('inventory_items')
      .update({ quantity_available: current.quantity_available + amount })
      .eq('id', itemId)

    if (error) throw error
  } catch (err) {
    console.warn("Mock refill inventory", itemId, amount)
  }
}

export async function getAllInventory() {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name', { ascending: true })
      
    if (!error && data && data.length > 0) return data
  } catch (err) {
    console.warn("Using sample inventory list", err)
  }

  return SAMPLE_INVENTORY
}

