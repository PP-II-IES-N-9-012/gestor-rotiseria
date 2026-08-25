import { supabase } from './supabase'

// Helper para obtener el Tenant ID (Restaurante) para la parte PÚBLICA (E-commerce).
// En producción, esto se sacaría del subdominio de la URL (ej: pepe.rotiseria.com -> "pepe").
// Por ahora, obtenemos el primer restaurante de la base de datos.
export async function getPublicTenantId() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id')
    .limit(1)
    .single()
    
  if (error) {
    console.warn("No se pudo obtener el restaurante público", error)
    // Fallback al ID que usamos en el script de semillas
    return '00000000-0000-0000-0000-000000000001'
  }
  return data.id
}

// --- Products (Public) ---
export async function getProducts(restaurantId?: string) {
  const id = restaurantId || await getPublicTenantId()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('restaurant_id', id)
    .eq('is_available', true)
  
  if (error) throw error
  return data
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
    notes?: string
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
    .single()

  if (error) throw error
  return data
}


// ============================================================================
// ADMIN FUNCTIONS
// Gracias a las políticas RLS (Row Level Security) en Supabase, no necesitamos 
// pasar el restaurant_id en estas consultas. Supabase filtrará automáticamente 
// los datos basándose en el usuario que inició sesión.
// ============================================================================

export async function getOrdersByStatus(statuses: string[]) {
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

  if (error) throw error
  return data
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) throw error
}

export async function getTodayOrders() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', today.toISOString())

  if (error) throw error
  return data
}

// --- Inventory ---
export async function getCriticalInventory() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    
  if (error) throw error
  
  return data.filter((item: any) => item.quantity_available <= item.min_stock)
}

export async function refillInventory(itemId: string, amount: number) {
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
}

export async function getAllInventory() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('name', { ascending: true })
    
  if (error) throw error
  return data
}
