import { supabase } from './supabase'

export interface RestaurantInfo {
  id: string
  name: string
  subdomain: string
  address?: string
  phone?: string
  description?: string
  whatsapp_number?: string
  instagram_handle?: string
  facebook_url?: string
  tiktok_handle?: string
  google_maps_url?: string
  opening_hours?: string
  logo_url?: string
  banner_url?: string
  primary_color?: string
  secondary_color?: string
  theme_style?: 'rustic' | 'midnight' | 'bodegon' | 'espresso' | 'olive'
  font_style?: 'serif' | 'sans'
  announcement_banner?: string
  announcement_enabled?: boolean
  estimated_delivery_time?: string
  highlight_tag_1?: string
  highlight_tag_2?: string
  highlight_tag_3?: string

  // Nuevas opciones avanzadas de control
  is_store_open?: boolean
  closed_message?: string
  min_order_amount?: number
  delivery_cost?: string
  accepts_cash?: boolean
  accepts_transfer?: boolean
  transfer_alias?: string
  accepts_card?: boolean
  cash_discount_percentage?: number
  hero_cta_text?: string
  hero_overlay_opacity?: 'dark' | 'medium' | 'light'
  footer_custom_text?: string
}

// In-memory fallback for restaurant custom branding if Supabase table columns are pending migration
const inMemoryRestaurantBranding = new Map<string, Partial<RestaurantInfo>>()

export const FALLBACK_RESTAURANT: RestaurantInfo = {
  id: 'b326adf8-3a44-4736-bf3e-06e1e6bba946',
  name: 'Rotisería Don Carlos',
  subdomain: 'don-carlos',
  address: 'Av. San Martín 1420',
  phone: '+54 9 11 4455-8899',
  description: 'Comida casera, horno a leña y recetas familiares desde 1994.',
  whatsapp_number: '+54 9 11 4455-8899',
  instagram_handle: '@doncarlos.rotiseria',
  facebook_url: '',
  tiktok_handle: '',
  google_maps_url: '',
  opening_hours: 'Martes a Domingo: 19:30 a 23:45',
  logo_url: '',
  banner_url: '/hero_rotiseria.jpg',
  primary_color: '#e59324',
  secondary_color: '#d34e2c',
  theme_style: 'rustic',
  font_style: 'serif',
  announcement_banner: '🔥 Horno encendido y cocina despachando pedidos en vivo',
  announcement_enabled: true,
  estimated_delivery_time: '35-45 min',
  highlight_tag_1: 'Horno a Leña & Fuego',
  highlight_tag_2: '100% Casero',
  highlight_tag_3: 'Atención Directa',
  is_store_open: true,
  closed_message: 'Horno cerrado por el momento. ¡Abrimos pronto!',
  min_order_amount: 0,
  delivery_cost: 'A coordinar',
  accepts_cash: true,
  accepts_transfer: true,
  transfer_alias: 'doncarlos.rotiseria.mp',
  accepts_card: true,
  cash_discount_percentage: 10,
  hero_cta_text: 'Pedir al plato',
  hero_overlay_opacity: 'dark',
  footer_custom_text: 'Cocina tradicional, recetas familiares y entrega directa sin intermediarios.'
}

/**
 * Optimiza y comprime imágenes del lado del cliente en un canvas liviano
 */
export async function compressAndPrepareImage(
  file: File, 
  maxDimension = 800, 
  quality = 0.85
): Promise<string> {
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(e.target?.result as string)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        const format = file.type === 'image/png' ? 'image/png' : 'image/webp'
        resolve(canvas.toDataURL(format, quality))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Sube una imagen a Supabase Storage (o genera Data URL optimizado como fallback sin fallos)
 */
export async function uploadRestaurantMedia(
  file: File,
  type: 'logo' | 'banner' | 'product',
  restaurantId: string
): Promise<string> {
  const maxDim = type === 'logo' ? 512 : type === 'product' ? 900 : 1600
  const dataUrl = await compressAndPrepareImage(file, maxDim, 0.85)

  try {
    const ext = file.name.split('.').pop() || 'webp'
    const fileName = `${type}s/${restaurantId}-${Date.now()}.${ext}`
    
    const res = await fetch(dataUrl)
    const blob = await res.blob()

    const { data, error } = await supabase.storage
      .from('restaurant-media')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: true
      })

    if (!error && data) {
      const { data: publicData } = supabase.storage
        .from('restaurant-media')
        .getPublicUrl(data.path)
      if (publicData?.publicUrl) {
        return publicData.publicUrl
      }
    }
  } catch (storageErr) {
    console.info('Supabase storage fallback to inline data URL:', storageErr)
  }

  return dataUrl
}

export const SAMPLE_RESTAURANTS: RestaurantInfo[] = [
  {
    id: 'b326adf8-3a44-4736-bf3e-06e1e6bba946',
    name: 'Rotisería Castelli',
    subdomain: 'roti-castelli',
    address: 'Castelli 890, Centro',
    phone: '+54 9 11 4321-7788',
    description: 'Pollos al spiedo dorados y empanadas tradicionales.',
    whatsapp_number: '+54 9 11 4321-7788',
    instagram_handle: '@roticastelli',
    opening_hours: 'Lunes a Sábado: 11:30 a 14:30 y 19:30 a 23:30',
    logo_url: '',
    banner_url: '/hero_rotiseria.jpg',
    primary_color: '#e59324',
    secondary_color: '#d34e2c',
    estimated_delivery_time: '30-40 min',
    highlight_tag_1: 'Pollo al Spiedo',
    highlight_tag_2: 'Empanadas al Horno',
    highlight_tag_3: 'Envíos Rápidos'
  },
  {
    id: '11111111-2222-3333-4444-555555555555',
    name: 'Rotisería Don Carlos',
    subdomain: 'don-carlos',
    address: 'Av. San Martín 1420',
    phone: '+54 9 11 4455-8899',
    description: 'Comida casera al horno de barro y minutas al instante.',
    whatsapp_number: '+54 9 11 4455-8899',
    instagram_handle: '@doncarlos_ok',
    opening_hours: 'Martes a Domingo: 19:30 a 23:45',
    logo_url: '',
    banner_url: '/hero_rotiseria.jpg',
    primary_color: '#e59324',
    secondary_color: '#d34e2c',
    estimated_delivery_time: '35-45 min',
    highlight_tag_1: 'Horno a Leña & Fuego',
    highlight_tag_2: '100% Casero',
    highlight_tag_3: 'Atención Directa'
  },
  {
    id: '22222222-3333-4444-5555-666666666666',
    name: 'Bodegón La Nonna',
    subdomain: 'la-nonna',
    address: 'Paseo Colón 740, San Telmo',
    phone: '+54 9 11 9876-5432',
    description: 'Pastas amasadas a mano y milanesas tamaño gigante.',
    whatsapp_number: '+54 9 11 9876-5432',
    instagram_handle: '@bodegon_lanonna',
    opening_hours: 'Miércoles a Domingo: 12:00 a 15:30 y 20:00 a 00:00',
    logo_url: '',
    banner_url: '/artisanal_dishes.jpg',
    primary_color: '#dc2626',
    secondary_color: '#991b1b',
    estimated_delivery_time: '40-50 min',
    highlight_tag_1: 'Pastas Frescas Caseras',
    highlight_tag_2: 'Milanesas XL',
    highlight_tag_3: 'Tradición Italiana'
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

// ============================================================================
// PERFORMANCE OPTIMIZATION: In-Memory TTL Cache & Fast Timeout Helper
// ============================================================================

const memoryCache = new Map<string, { data: any; expires: number }>()

function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    memoryCache.delete(key)
    return null
  }
  return entry.data as T
}

function setCached(key: string, data: any, ttlSeconds = 45) {
  memoryCache.set(key, { data, expires: Date.now() + ttlSeconds * 1000 })
}

export function invalidateCache(keyPrefix?: string) {
  if (!keyPrefix) {
    memoryCache.clear()
    return
  }
  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(keyPrefix)) {
      memoryCache.delete(key)
    }
  }
}

/**
 * Executes a promise with an aggressive timeout.
 * If Supabase is slow, paused, or unreachable, it falls back instantly to local sample data.
 */
async function withTimeout<T>(promise: PromiseLike<T> | Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
  let timer: NodeJS.Timeout
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      resolve(fallbackValue)
    }, timeoutMs)
  })

  const wrappedPromise = Promise.resolve(promise)
    .then((result) => {
      clearTimeout(timer)
      return result
    })
    .catch((err) => {
      clearTimeout(timer)
      console.warn('API query error, using fallback:', err?.message || err)
      return fallbackValue
    })

  return Promise.race([wrappedPromise, timeoutPromise])
}

// Helper para obtener el Tenant ID (Restaurante) para la parte PÚBLICA (E-commerce).
export async function getPublicTenantId() {
  const cached = getCached<string>('public_tenant_id')
  if (cached) return cached

  const query = supabase
    .from('restaurants')
    .select('id')
    .limit(1)
    .single()
    .then(({ data, error }) => {
      if (error || !data) return FALLBACK_RESTAURANT.id
      return data.id
    })

  const tenantId = await withTimeout(query, 1200, FALLBACK_RESTAURANT.id)
  setCached('public_tenant_id', tenantId, 120)
  return tenantId
}

// Helper para fusionar branding personalizado
function mergeBranding(rest: RestaurantInfo): RestaurantInfo {
  const custom = inMemoryRestaurantBranding.get(rest.id) || inMemoryRestaurantBranding.get(rest.subdomain.toLowerCase())
  if (!custom) return rest
  return { ...rest, ...custom }
}

// Obtener restaurante por subdominio o ID
export async function getRestaurant(idOrSubdomain?: string): Promise<RestaurantInfo> {
  const cacheKey = `restaurant:${idOrSubdomain || 'default'}`
  const cached = getCached<RestaurantInfo>(cacheKey)
  if (cached) return mergeBranding(cached)

  // Quick match in sample restaurants
  const sampleMatch = SAMPLE_RESTAURANTS.find(
    r => (idOrSubdomain && r.subdomain.toLowerCase() === idOrSubdomain.toLowerCase()) || r.id === idOrSubdomain
  )

  if (!idOrSubdomain) {
    const query = supabase
      .from('restaurants')
      .select('*')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => data || FALLBACK_RESTAURANT)

    const result = await withTimeout(query, 1200, FALLBACK_RESTAURANT)
    const merged = mergeBranding(result)
    setCached(cacheKey, merged, 60)
    return merged
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSubdomain)
  
  const query = (async () => {
    if (isUuid) {
      const { data } = await supabase.from('restaurants').select('*').eq('id', idOrSubdomain).maybeSingle()
      if (data) return mergeBranding(data)
    }

    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .ilike('subdomain', idOrSubdomain)
      .maybeSingle()

    if (data) return mergeBranding(data)
    if (sampleMatch) return mergeBranding(sampleMatch)

    return mergeBranding({
      ...FALLBACK_RESTAURANT,
      name: `Rotisería ${idOrSubdomain.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
      subdomain: idOrSubdomain
    })
  })()

  const fallback = sampleMatch || {
    ...FALLBACK_RESTAURANT,
    name: `Rotisería ${idOrSubdomain.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    subdomain: idOrSubdomain
  }

  const result = await withTimeout(query, 1200, fallback)
  const merged = mergeBranding(result)
  setCached(cacheKey, merged, 60)
  return merged
}

/**
 * Busca un comercio por subdominio SIN inventar uno: devuelve null si no existe.
 */
export async function getRestaurantStrict(subdomain: string): Promise<RestaurantInfo | null> {
  const slug = subdomain.trim().toLowerCase()
  const cacheKey = `restaurant_strict:${slug}`
  const cached = getCached<RestaurantInfo | null>(cacheKey)
  if (cached !== null) return cached ? mergeBranding(cached) : null

  const sampleMatch = SAMPLE_RESTAURANTS.find(r => r.subdomain.toLowerCase() === slug) || null

  const query = Promise.resolve(
    supabase.from('restaurants').select('*').ilike('subdomain', slug).maybeSingle()
  ).then(({ data, error }) => {
    if (error) return sampleMatch ? mergeBranding(sampleMatch) : null
    const res = (data as RestaurantInfo | null) || sampleMatch
    return res ? mergeBranding(res) : null
  })

  const result = await withTimeout<RestaurantInfo | null>(query, 3000, sampleMatch)
  const merged = result ? mergeBranding(result) : null
  if (merged) setCached(cacheKey, merged, 60)
  return merged
}

// Guarda la configuración completa y branding de un restaurante
export async function updateRestaurantBranding(
  restaurantId: string, 
  data: Partial<RestaurantInfo>
) {
  // Guardar en respaldo en memoria de inmediato para reactividad total
  const current = inMemoryRestaurantBranding.get(restaurantId) || {}
  inMemoryRestaurantBranding.set(restaurantId, { ...current, ...data })

  try {
    const { error } = await supabase
      .from('restaurants')
      .update(data)
      .eq('id', restaurantId)

    if (error) {
      console.warn('Could not update all restaurant columns in DB (pending migration?):', error.message)
      // Si falló por columnas que aún no existen, intentamos actualizar solo los campos básicos
      const basicFields: any = {}
      if (data.name) basicFields.name = data.name
      if (data.description) basicFields.description = data.description
      if (data.address) basicFields.address = data.address
      if (data.phone) basicFields.phone = data.phone
      if (Object.keys(basicFields).length > 0) {
        await supabase.from('restaurants').update(basicFields).eq('id', restaurantId)
      }
    }
  } catch (err) {
    console.warn('DB update error for restaurant branding:', err)
  }

  invalidateCache('restaurant')
  invalidateCache('all_restaurants')
  return true
}

export async function getAllRestaurants(): Promise<RestaurantInfo[]> {
  const cached = getCached<RestaurantInfo[]>('all_restaurants')
  if (cached) return cached

  const query = supabase.from('restaurants').select('*').then(({ data, error }) => {
    if (!error && data && data.length > 0) return data
    return SAMPLE_RESTAURANTS
  })

  const result = await withTimeout(query, 1200, SAMPLE_RESTAURANTS)
  setCached('all_restaurants', result, 60)
  return result
}

// --- Products (Public) ---
export async function getProducts(restaurantIdOrSubdomain?: string) {
  const cacheKey = `products:${restaurantIdOrSubdomain || 'default'}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached

  const query = (async () => {
    let id = restaurantIdOrSubdomain
    const isUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    if (!isUuid) {
      const rest = await getRestaurant(restaurantIdOrSubdomain)
      id = rest.id
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', id)
      .eq('is_available', true)
    
    const isSample = SAMPLE_RESTAURANTS.some(r => r.id === id) || id === FALLBACK_RESTAURANT.id
    if (!error && data && (data.length > 0 || !isSample)) {
      return data
    }
    return ARTISANAL_FALLBACK_PRODUCTS
  })()

  const result = await withTimeout(query, 1200, ARTISANAL_FALLBACK_PRODUCTS)
  setCached(cacheKey, result, 60)
  return result
}

export interface ProductIngredientItem {
  id?: string
  product_id?: string
  inventory_item_id: string
  quantity: number
  inventory_items?: {
    id: string
    name: string
    unit: string
    quantity_available: number
  }
}

export interface ProductItem {
  id: string
  restaurant_id: string
  code: string
  name: string
  description?: string
  price: number
  category: string
  is_available: boolean
  image_url?: string
  ingredients?: string[]
  product_ingredients?: ProductIngredientItem[]
}

// In-memory fallback map for recipes when Supabase migration is not yet applied
const inMemoryRecipes = new Map<string, { inventory_item_id: string; quantity: number }[]>()

// --- Admin Product CRUD ---
export async function getAdminProducts(restaurantId?: string): Promise<ProductItem[]> {
  const cacheKey = `admin_products:${restaurantId || 'all'}`
  const cached = getCached<ProductItem[]>(cacheKey)
  if (cached) return cached

  let builder = supabase.from('products').select(`
    *,
    product_ingredients (
      id,
      product_id,
      inventory_item_id,
      quantity,
      inventory_items:inventory_item_id (
        id,
        name,
        unit,
        quantity_available
      )
    )
  `)

  if (restaurantId) builder = builder.eq('restaurant_id', restaurantId)

  const query = builder.order('name', { ascending: true }).then(async ({ data, error }) => {
    // Si la relación falla (por ejemplo tabla product_ingredients no existe aún en Supabase)
    if (error) {
      console.warn('Falling back to plain products query:', error.message)
      let plainBuilder = supabase.from('products').select('*')
      if (restaurantId) plainBuilder = plainBuilder.eq('restaurant_id', restaurantId)
      const { data: plainData } = await plainBuilder.order('name', { ascending: true })
      
      const list = plainData || (restaurantId ? [] : ARTISANAL_FALLBACK_PRODUCTS)
      return list.map((p: any) => ({
        ...p,
        product_ingredients: (inMemoryRecipes.get(p.id) || []).map(r => ({
          ...r,
          product_id: p.id
        }))
      }))
    }

    if (data && (data.length > 0 || restaurantId)) {
      return data.map((p: any) => {
        // Enlazar también si había en memoria
        const mem = inMemoryRecipes.get(p.id)
        if ((!p.product_ingredients || p.product_ingredients.length === 0) && mem) {
          return {
            ...p,
            product_ingredients: mem.map(r => ({ ...r, product_id: p.id }))
          }
        }
        return p
      })
    }
    return restaurantId ? [] : (ARTISANAL_FALLBACK_PRODUCTS as any[])
  })

  const fallback = restaurantId ? [] : (ARTISANAL_FALLBACK_PRODUCTS as any[])
  const result = await withTimeout(query, 1500, fallback)
  setCached(cacheKey, result, 30)
  return result
}

export async function saveProduct(
  productData: {
    id?: string
    name: string
    code?: string
    description?: string
    price: number
    category: string
    is_available?: boolean
    image_url?: string
  },
  recipe: { inventory_item_id: string; quantity: number }[],
  restaurantId: string
) {
  const code = productData.code?.trim() || 
    productData.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 10) + '-' + Math.floor(Math.random() * 900 + 100)

  let productId = productData.id

  if (productId) {
    // Actualizar producto existente
    const { error } = await supabase
      .from('products')
      .update({
        name: productData.name,
        code,
        description: productData.description || '',
        price: Number(productData.price),
        category: productData.category,
        is_available: productData.is_available ?? true,
        image_url: productData.image_url || ''
      })
      .eq('id', productId)
      .eq('restaurant_id', restaurantId)

    if (error) throw error
  } else {
    // Crear nuevo producto
    const { data: newProd, error } = await supabase
      .from('products')
      .insert({
        restaurant_id: restaurantId,
        name: productData.name,
        code,
        description: productData.description || '',
        price: Number(productData.price),
        category: productData.category,
        is_available: productData.is_available ?? true,
        image_url: productData.image_url || ''
      })
      .select()
      .single()

    if (error) throw error
    productId = newProd.id
  }

  // Guardar receta en memoria de respaldo
  if (productId) {
    inMemoryRecipes.set(productId, recipe)
  }

  // Guardar receta en la tabla product_ingredients si existe
  if (productId) {
    try {
      await supabase.from('product_ingredients').delete().eq('product_id', productId)

      if (recipe.length > 0) {
        const rows = recipe.map(r => ({
          restaurant_id: restaurantId,
          product_id: productId,
          inventory_item_id: r.inventory_item_id,
          quantity: Number(r.quantity)
        }))
        const { error: ingError } = await supabase.from('product_ingredients').insert(rows)
        if (ingError) {
          console.warn('Could not insert product_ingredients table (using in-memory fallback):', ingError.message)
        }
      }
    } catch (e) {
      console.warn('product_ingredients table error:', e)
    }
  }

  invalidateCache('products')
  invalidateCache('admin_products')
  return productId
}

export async function deleteProduct(productId: string, restaurantId?: string) {
  let builder = supabase.from('products').delete().eq('id', productId)
  if (restaurantId) builder = builder.eq('restaurant_id', restaurantId)

  const { error } = await builder
  if (error) throw error

  inMemoryRecipes.delete(productId)
  invalidateCache('products')
  invalidateCache('admin_products')
}

export async function toggleProductAvailability(productId: string, isAvailable: boolean) {
  const { error } = await supabase
    .from('products')
    .update({ is_available: isAvailable })
    .eq('id', productId)

  if (error) throw error
  invalidateCache('products')
  invalidateCache('admin_products')
}

// Descuenta automáticamente los insumos consumidos del inventario según la receta
export async function deductInventoryForItems(
  items: { product_id: string; quantity: number }[],
  restaurantId: string
) {
  if (!items || items.length === 0) return

  // 1. Obtener recetas de la base de datos o fallback
  const productIds = items.map(i => i.product_id)
  
  let ingredientsMap = new Map<string, { inventory_item_id: string; quantity: number }[]>()

  try {
    const { data: dbIngredients } = await supabase
      .from('product_ingredients')
      .select('product_id, inventory_item_id, quantity')
      .in('product_id', productIds)

    if (dbIngredients && dbIngredients.length > 0) {
      for (const ing of dbIngredients) {
        const list = ingredientsMap.get(ing.product_id) || []
        list.push({ inventory_item_id: ing.inventory_item_id, quantity: Number(ing.quantity) })
        ingredientsMap.set(ing.product_id, list)
      }
    }
  } catch (e) {
    console.warn('Error reading product_ingredients for deduction:', e)
  }

  // Complementar con inMemoryRecipes si no estaban en base
  for (const pid of productIds) {
    if (!ingredientsMap.has(pid) && inMemoryRecipes.has(pid)) {
      ingredientsMap.set(pid, inMemoryRecipes.get(pid)!)
    }
  }

  // 2. Calcular el total a descontar por cada item del inventario
  const totalDeductions = new Map<string, number>()
  for (const item of items) {
    const recipe = ingredientsMap.get(item.product_id)
    if (recipe) {
      for (const ing of recipe) {
        const current = totalDeductions.get(ing.inventory_item_id) || 0
        totalDeductions.set(ing.inventory_item_id, current + (Number(item.quantity) * Number(ing.quantity)))
      }
    }
  }

  // 3. Aplicar las deducciones al inventario
  for (const [inventoryItemId, deduction] of Array.from(totalDeductions.entries())) {
    try {
      const { data: currentItem } = await supabase
        .from('inventory_items')
        .select('quantity_available')
        .eq('id', inventoryItemId)
        .maybeSingle()

      if (currentItem) {
        const newQty = Math.max(0, Number(currentItem.quantity_available) - deduction)
        await supabase
          .from('inventory_items')
          .update({ quantity_available: newQty })
          .eq('id', inventoryItemId)

        // Registrar movimiento de salida
        await supabase.from('inventory_movements').insert({
          item_id: inventoryItemId,
          quantity_change: -deduction,
          movement_type: 'out'
        })
      }
    } catch (err) {
      console.warn('Error updating inventory item deduction:', inventoryItemId, err)
    }
  }

  invalidateCache('all_inventory')
  invalidateCache('critical_inventory')
}

// --- Orders (Public & Admin) ---
export async function createOrder(
  order: {
    delivery_type: string
    total_amount: number
    guest_name?: string
    guest_phone?: string
    guest_address?: string
    payment_method?: string
    notes?: string
    status?: string
  },
  items: { product_id: string; quantity: number; unit_price: number }[],
  restaurantId?: string
) {
  const id = restaurantId || (await getPublicTenantId())

  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      ...order,
      restaurant_id: id
    })
    .select()
    .single()

  if (orderError) throw orderError

  const orderItems = items.map((item) => ({
    ...item,
    order_id: newOrder.id
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

  if (itemsError) throw itemsError

  // Descontar automáticamente del inventario según las recetas de los productos
  try {
    await deductInventoryForItems(items, id)
  } catch (deductErr) {
    console.warn('Could not auto-deduct inventory for order:', deductErr)
  }

  invalidateCache('orders')
  invalidateCache('today_orders')

  return newOrder
}

// Para seguimiento público
export async function getOrderById(orderId: string, restaurantId?: string) {
  const id = restaurantId || (await getPublicTenantId())
  
  const query = supabase
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
    .then(({ data, error }) => {
      if (!error && data) return data
      return null
    })

  const fallback = {
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

  const result = await withTimeout(query, 1200, fallback)
  return result || fallback
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

export async function getOrdersByStatus(statuses: string[], restaurantId?: string) {
  const cacheKey = `orders:${restaurantId || 'all'}:${statuses.slice().sort().join(',')}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached

  let builder = supabase
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
  if (restaurantId) builder = builder.eq('restaurant_id', restaurantId)

  const query = builder
    .order('created_at', { ascending: true })
    .then(({ data, error }) => {
      if (!error && data && data.length > 0) return data
      return SAMPLE_ADMIN_ORDERS.filter((o) => statuses.includes(o.status))
    })

  const fallback = SAMPLE_ADMIN_ORDERS.filter((o) => statuses.includes(o.status))
  const result = await withTimeout(query, 1200, fallback)
  setCached(cacheKey, result, 10)
  return result
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) throw error
  } catch (err) {
    console.warn('Mock updating order status', orderId, status)
  }
  invalidateCache('orders')
  invalidateCache('today_orders')
}

export async function getTodayOrders(restaurantId?: string) {
  const cacheKey = `today_orders:${restaurantId || 'all'}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const fallback = [
    ...SAMPLE_ADMIN_ORDERS,
    { id: 'ord-1039', total_amount: 22000, status: 'completed', created_at: new Date().toISOString() },
    { id: 'ord-1038', total_amount: 14500, status: 'completed', created_at: new Date().toISOString() },
    { id: 'ord-1037', total_amount: 18900, status: 'completed', created_at: new Date().toISOString() },
    { id: 'ord-1036', total_amount: 31200, status: 'completed', created_at: new Date().toISOString() },
    { id: 'ord-1035', total_amount: 11500, status: 'completed', created_at: new Date().toISOString() },
    { id: 'ord-1034', total_amount: 9800, status: 'completed', created_at: new Date().toISOString() }
  ]

  let builder = supabase
    .from('orders')
    .select('*')
    .gte('created_at', today.toISOString())
  if (restaurantId) builder = builder.eq('restaurant_id', restaurantId)

  const query = builder.then(({ data, error }) => {
    if (!error && data && (data.length > 0 || restaurantId)) return data
    return restaurantId ? [] : fallback
  })

  const result = await withTimeout(query, 1200, restaurantId ? [] : fallback)
  setCached(cacheKey, result, 15)
  return result
}

// --- Inventory ---
export async function getCriticalInventory(restaurantId?: string) {
  const cacheKey = `critical_inventory:${restaurantId || 'all'}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached

  const fallback = restaurantId ? [] : SAMPLE_INVENTORY.filter((item) => item.quantity_available <= item.min_stock)

  let builder = supabase.from('inventory_items').select('*')
  if (restaurantId) builder = builder.eq('restaurant_id', restaurantId)

  const query = builder.then(({ data, error }) => {
    if (!error && data && (data.length > 0 || restaurantId)) {
      return data.filter((item: any) => item.quantity_available <= item.min_stock)
    }
    return fallback
  })

  const result = await withTimeout(query, 1200, fallback)
  setCached(cacheKey, result, 20)
  return result
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
    console.warn('Mock refill inventory', itemId, amount)
  }
  invalidateCache('critical_inventory')
  invalidateCache('all_inventory')
}

export async function getAllInventory(restaurantId?: string) {
  const cacheKey = `all_inventory:${restaurantId || 'all'}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached

  const fallback = restaurantId ? [] : SAMPLE_INVENTORY

  let builder = supabase.from('inventory_items').select('*')
  if (restaurantId) builder = builder.eq('restaurant_id', restaurantId)

  const query = builder
    .order('name', { ascending: true })
    .then(({ data, error }) => {
      if (!error && data && (data.length > 0 || restaurantId)) return data
      return fallback
    })

  const result = await withTimeout(query, 1200, fallback)
  setCached(cacheKey, result, 30)
  return result
}
