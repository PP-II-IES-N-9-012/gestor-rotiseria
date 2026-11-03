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
  font_style?: 'serif' | 'sans' | 'urban' | 'classic'
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

// Helper para fusionar branding personalizado (memoria + localStorage en cliente)
export function mergeBranding(rest: RestaurantInfo): RestaurantInfo {
  let merged: RestaurantInfo = { ...rest }
  if (typeof window !== 'undefined') {
    try {
      const bySub = rest.subdomain ? window.localStorage.getItem(`comandapp_branding_${rest.subdomain.toLowerCase()}`) : null
      const byId = rest.id ? window.localStorage.getItem(`comandapp_branding_${rest.id.toLowerCase()}`) : null
      const latest = window.localStorage.getItem('comandapp_branding_latest')
      if (latest) {
        const parsedLatest = JSON.parse(latest)
        if (parsedLatest && (parsedLatest.id === rest.id || parsedLatest.subdomain === rest.subdomain || !rest.subdomain)) {
          merged = { ...merged, ...parsedLatest }
        }
      }
      if (bySub) merged = { ...merged, ...JSON.parse(bySub) }
      if (byId) merged = { ...merged, ...JSON.parse(byId) }
    } catch {
      // Ignore localStorage parse errors
    }
  }
  const custom = inMemoryRestaurantBranding.get(rest.id) || (rest.subdomain ? inMemoryRestaurantBranding.get(rest.subdomain.toLowerCase()) : undefined)
  if (custom) {
    merged = { ...merged, ...custom }
  }
  return merged
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
  // 1. Guardar en respaldo en memoria y localStorage de inmediato para reactividad total
  const current = inMemoryRestaurantBranding.get(restaurantId) || {}
  const mergedData = { ...current, ...data, id: restaurantId }
  inMemoryRestaurantBranding.set(restaurantId, mergedData)
  if (data.subdomain) {
    inMemoryRestaurantBranding.set(data.subdomain.toLowerCase(), mergedData)
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(`comandapp_branding_${restaurantId.toLowerCase()}`, JSON.stringify(mergedData))
      if (data.subdomain) {
        window.localStorage.setItem(`comandapp_branding_${data.subdomain.toLowerCase()}`, JSON.stringify(mergedData))
      }
      window.localStorage.setItem('comandapp_branding_latest', JSON.stringify(mergedData))
    } catch (e) {
      console.warn('Could not save branding to localStorage:', e)
    }
  }

  // 2. Intentar persistir todos los campos soportados en Supabase
  const payload: Record<string, any> = { ...data }
  delete payload.id
  delete payload.subdomain // Subdominio es de solo lectura tras creación

  try {
    let attempts = 0
    while (Object.keys(payload).length > 0 && attempts < 15) {
      attempts++
      const { error } = await supabase
        .from('restaurants')
        .update(payload)
        .eq('id', restaurantId)

      if (!error) break

      // Si PostgREST indica que una columna aún no fue migrada en la tabla restaurants, la quitamos y reintentamos con el resto
      const match = error.message?.match(/Could not find the '([^']+)' column|column "([^"]+)" of relation/i)
      const missingCol = match?.[1] || match?.[2]
      if (missingCol && missingCol in payload) {
        delete payload[missingCol]
        continue
      }

      console.warn('Could not update all restaurant columns in DB:', error.message)
      const basicFields: Record<string, any> = {}
      if (data.name) basicFields.name = data.name
      if (data.description !== undefined) basicFields.description = data.description
      if (data.address !== undefined) basicFields.address = data.address
      if (data.phone !== undefined) basicFields.phone = data.phone
      if (Object.keys(basicFields).length > 0) {
        await supabase.from('restaurants').update(basicFields).eq('id', restaurantId)
      }
      break
    }
  } catch (err) {
    console.warn('DB update error for restaurant branding:', err)
  }

  invalidateCache('restaurant')
  invalidateCache('restaurant_strict')
  invalidateCache('all_restaurants')

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('comandapp-branding-updated', { detail: mergedData }))
  }

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

  const ingredientsMap = new Map<string, { inventory_item_id: string; quantity: number }[]>()

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

// Respaldo en memoria para órdenes e inventario creados en modo demo o con productos de muestra
const inMemoryCreatedOrders: any[] = []

function generateOrderUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function saveRecentOrderLocal(order: any) {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem('comandapp_recent_orders')
    const list: any[] = raw ? JSON.parse(raw) : []
    const filtered = list.filter((o) => o && o.id !== order.id)
    filtered.unshift(order)
    window.localStorage.setItem('comandapp_recent_orders', JSON.stringify(filtered.slice(0, 25)))
  } catch {
    // Ignore storage errors
  }
}

function getRecentOrderLocal(orderId: string): any | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('comandapp_recent_orders')
    if (!raw) return null
    const list: any[] = JSON.parse(raw)
    return list.find((o) => o && o.id === orderId) || null
  } catch {
    return null
  }
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
  items: { product_id: string; quantity: number; unit_price: number; product_name?: string }[],
  restaurantId?: string
) {
  const id = restaurantId || (await getPublicTenantId())
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  const uuidItems = items.filter((item) => uuidRegex.test(item.product_id))
  const nonUuidItems = items.filter((item) => !uuidRegex.test(item.product_id))

  let finalNotes = order.notes || ''
  if (nonUuidItems.length > 0) {
    const fallbackSummary = nonUuidItems
      .map((i) => {
        const found = ARTISANAL_FALLBACK_PRODUCTS.find((p) => p.id === i.product_id)
        return `${i.quantity}x ${i.product_name || found?.name || i.product_id}`
      })
      .join(', ')
    finalNotes = finalNotes ? `${finalNotes} | Ítems: ${fallbackSummary}` : `Ítems: ${fallbackSummary}`
  }

  const generatedId = generateOrderUuid()
  const nowIso = new Date().toISOString()
  let createdOrder: any = {
    id: generatedId,
    restaurant_id: id,
    ...order,
    notes: finalNotes || undefined,
    status: order.status || 'pending',
    created_at: nowIso
  }

  try {
    // Insertamos pasando el UUID generado sin encadenar .select().single()
    // para que no falle por RLS SELECT cuando el comprador es público (anónimo).
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        id: generatedId,
        ...order,
        status: order.status || 'pending',
        notes: finalNotes || undefined,
        restaurant_id: id
      })

    if (orderError) throw orderError

    if (uuidItems.length > 0) {
      const orderItems = uuidItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        order_id: generatedId
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
      if (itemsError) {
        console.warn('Warning inserting order_items:', itemsError.message)
      }
    }
  } catch (dbErr) {
    console.warn('Fallback order creation in memory:', dbErr)
  }

  // Guardar representación rica con nombres de productos para visualización inmediata en Cocina / Seguimiento / KPIs
  const enrichedOrder = {
    ...createdOrder,
    order_items: items.map((i) => {
      const found = ARTISANAL_FALLBACK_PRODUCTS.find((p) => p.id === i.product_id)
      return {
        quantity: i.quantity,
        product_id: i.product_id,
        unit_price: i.unit_price,
        products: {
          name: i.product_name || found?.name || 'Plato del Menú'
        }
      }
    })
  }

  inMemoryCreatedOrders.unshift(enrichedOrder)
  saveRecentOrderLocal(enrichedOrder)

  // Descontar automáticamente del inventario según las recetas de los productos
  if (uuidItems.length > 0) {
    try {
      await deductInventoryForItems(uuidItems, id)
    } catch (deductErr) {
      console.warn('Could not auto-deduct inventory for order:', deductErr)
    }
  }

  invalidateCache('orders')
  invalidateCache('today_orders')
  invalidateCache('orders_period')

  return enrichedOrder
}

// Para seguimiento público
export async function getOrderById(orderId: string, restaurantId?: string) {
  const cleanId = orderId.trim()
  const memMatch =
    inMemoryCreatedOrders.find((o) => o.id === cleanId) ||
    getRecentOrderLocal(cleanId)

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(cleanId)) {
    return memMatch || null
  }

  let builder = supabase
    .from('orders')
    .select(`
      *,
      order_items (
        quantity,
        unit_price,
        product_id,
        products (
          name
        )
      )
    `)
    .eq('id', cleanId)

  if (restaurantId) {
    builder = builder.eq('restaurant_id', restaurantId)
  }

  const query = builder.maybeSingle().then(({ data, error }) => {
    if (!error && data) {
      if ((!data.order_items || data.order_items.length === 0) && memMatch?.order_items) {
        return { ...data, order_items: memMatch.order_items }
      }
      return data
    }
    return null
  })

  // Solo usar orden de demostración si se consulta explícitamente el ID de ejemplo de la documentación
  const demoFallback =
    cleanId === FALLBACK_RESTAURANT.id
      ? {
          id: FALLBACK_RESTAURANT.id,
          restaurant_id: restaurantId || FALLBACK_RESTAURANT.id,
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
      : null

  const fallback = memMatch || demoFallback
  const result = await withTimeout(query, 4000, fallback)
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

  const memMatches = inMemoryCreatedOrders.filter(
    (o) => statuses.includes(o.status) && (!restaurantId || o.restaurant_id === restaurantId)
  )

  const query = builder
    .order('created_at', { ascending: true })
    .then(({ data, error }) => {
      if (!error && data && (data.length > 0 || restaurantId)) {
        const dbList = data.map((dbOrder: any) => {
          const mem = inMemoryCreatedOrders.find((m) => m.id === dbOrder.id)
          if (mem && (!dbOrder.order_items || dbOrder.order_items.length === 0)) {
            return { ...dbOrder, order_items: mem.order_items }
          }
          return dbOrder
        })
        const missingMem = memMatches.filter((m) => !dbList.some((d: any) => d.id === m.id))
        return [...missingMem, ...dbList]
      }
      return [...memMatches, ...SAMPLE_ADMIN_ORDERS.filter((o) => statuses.includes(o.status))]
    })

  const fallback = restaurantId
    ? memMatches
    : [...memMatches, ...SAMPLE_ADMIN_ORDERS.filter((o) => statuses.includes(o.status))]
  const result = await withTimeout(query, 4000, fallback)
  setCached(cacheKey, result, 5)
  return result
}

export async function updateOrderStatus(orderId: string, status: string) {
  const memOrder = inMemoryCreatedOrders.find((o) => o.id === orderId)
  if (memOrder) {
    memOrder.status = status
  }
  const localOrder = getRecentOrderLocal(orderId)
  if (localOrder) {
    saveRecentOrderLocal({ ...localOrder, status })
  }
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
  invalidateCache('orders_period')
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
      return data.filter((item: any) => Number(item.quantity_available) <= Number(item.min_stock))
    }
    return fallback
  })

  const result = await withTimeout(query, 1200, fallback)
  setCached(cacheKey, result, 20)
  return result
}

export async function refillInventory(itemId: string, amount: number) {
  const sampleIdx = SAMPLE_INVENTORY.findIndex((i) => i.id === itemId)
  if (sampleIdx !== -1) {
    SAMPLE_INVENTORY[sampleIdx].quantity_available = Number(SAMPLE_INVENTORY[sampleIdx].quantity_available) + Number(amount)
  }

  try {
    const { data: current, error: fetchError } = await supabase
      .from('inventory_items')
      .select('quantity_available')
      .eq('id', itemId)
      .single()

    if (fetchError) throw fetchError

    const { error } = await supabase
      .from('inventory_items')
      .update({ quantity_available: Number(current.quantity_available) + Number(amount) })
      .eq('id', itemId)

    if (error) throw error
  } catch (err) {
    console.warn('Mock refill inventory', itemId, amount)
  }
  invalidateCache('critical_inventory')
  invalidateCache('all_inventory')
}

export async function createInventoryItem(
  itemData: {
    name: string
    quantity_available: number
    unit: string
    min_stock: number
  },
  restaurantId?: string
) {
  const id = restaurantId || (await getPublicTenantId())

  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        restaurant_id: id,
        name: itemData.name.trim(),
        quantity_available: Number(itemData.quantity_available),
        unit: itemData.unit.trim(),
        min_stock: Number(itemData.min_stock)
      })
      .select()
      .single()

    if (error) throw error
    invalidateCache('critical_inventory')
    invalidateCache('all_inventory')
    return data
  } catch (err) {
    console.warn('Fallback createInventoryItem in memory:', err)
    const mockItem = {
      id: `inv-${Date.now()}`,
      restaurant_id: id,
      name: itemData.name.trim(),
      quantity_available: Number(itemData.quantity_available),
      unit: itemData.unit.trim(),
      min_stock: Number(itemData.min_stock)
    }
    SAMPLE_INVENTORY.push(mockItem)
    invalidateCache('critical_inventory')
    invalidateCache('all_inventory')
    return mockItem
  }
}

export async function updateInventoryItem(
  itemId: string,
  itemData: {
    name: string
    quantity_available: number
    unit: string
    min_stock: number
  },
  restaurantId?: string
) {
  const sampleIdx = SAMPLE_INVENTORY.findIndex((i) => i.id === itemId)
  if (sampleIdx !== -1) {
    SAMPLE_INVENTORY[sampleIdx] = {
      ...SAMPLE_INVENTORY[sampleIdx],
      name: itemData.name.trim(),
      quantity_available: Number(itemData.quantity_available),
      unit: itemData.unit.trim(),
      min_stock: Number(itemData.min_stock)
    }
  }

  let builder = supabase
    .from('inventory_items')
    .update({
      name: itemData.name.trim(),
      quantity_available: Number(itemData.quantity_available),
      unit: itemData.unit.trim(),
      min_stock: Number(itemData.min_stock)
    })
    .eq('id', itemId)

  if (restaurantId) builder = builder.eq('restaurant_id', restaurantId)

  const { error } = await builder
  if (error && sampleIdx === -1) throw error

  invalidateCache('critical_inventory')
  invalidateCache('all_inventory')
}

export async function deleteInventoryItem(itemId: string, restaurantId?: string) {
  const sampleIdx = SAMPLE_INVENTORY.findIndex((i) => i.id === itemId)
  if (sampleIdx !== -1) {
    SAMPLE_INVENTORY.splice(sampleIdx, 1)
  }

  let builder = supabase.from('inventory_items').delete().eq('id', itemId)
  if (restaurantId) builder = builder.eq('restaurant_id', restaurantId)

  const { error } = await builder
  if (error && sampleIdx === -1) throw error

  invalidateCache('critical_inventory')
  invalidateCache('all_inventory')
  invalidateCache('admin_products')
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


// ============================================================================
// GERENCIA KPI & HISTORICAL ANALYTICS
// ============================================================================

export type TimePeriod = 'today' | 'week' | 'month' | 'all'

export interface HourlyOrDailyStat {
  label: string
  fullLabel?: string
  sales: number
  orders: number
}

export interface TopProductStat {
  name: string
  quantity: number
  revenue: number
}

export interface GerenciaStats {
  period: TimePeriod
  periodLabel: string
  totalSales: number
  totalOrders: number
  averageTicket: number
  completedOrders: number
  pendingOrPreparingOrders: number
  cashSales: number
  cashOrdersCount: number
  cardSales: number
  cardOrdersCount: number
  deliverySales: number
  deliveryOrdersCount: number
  pickupSales: number
  pickupOrdersCount: number
  chartData: HourlyOrDailyStat[]
  topProducts: TopProductStat[]
  orders: any[]
}

export const SAMPLE_HISTORICAL_ORDERS = [
  ...SAMPLE_ADMIN_ORDERS,
  {
    id: 'ord-hist-101',
    delivery_type: 'delivery',
    guest_name: 'Claudio Méndez',
    guest_phone: '+54 9 11 4545-1212',
    guest_address: 'San Martín 820',
    status: 'completed',
    payment_method: 'card',
    total_amount: 27000,
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000 - 3 * 3600 * 1000).toISOString(),
    order_items: [
      { quantity: 2, unit_price: 12500, products: { name: 'Pollo al Spiedo al Limón y Finas Hierbas' } },
      { quantity: 1, unit_price: 2000, products: { name: 'Gaseosa 1.5L' } }
    ]
  },
  {
    id: 'ord-hist-102',
    delivery_type: 'local_pickup',
    guest_name: 'María Eugenia Sosa',
    guest_phone: '+54 9 11 3434-7878',
    guest_address: '',
    status: 'completed',
    payment_method: 'cash',
    total_amount: 19200,
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000 - 5 * 3600 * 1000).toISOString(),
    order_items: [
      { quantity: 12, unit_price: 1600, products: { name: 'Empanadas Criollas Cortadas a Cuchillo' } }
    ]
  },
  {
    id: 'ord-hist-103',
    delivery_type: 'delivery',
    guest_name: 'Facundo Álvarez',
    guest_phone: '+54 9 11 8899-0011',
    guest_address: 'Corrientes 3450',
    status: 'completed',
    payment_method: 'card',
    total_amount: 32600,
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000 - 2 * 3600 * 1000).toISOString(),
    order_items: [
      { quantity: 2, unit_price: 14500, products: { name: 'Milanesa de Ternera Napolitana con Fritas' } },
      { quantity: 3, unit_price: 1200, products: { name: 'Empanadas Caseras' } }
    ]
  },
  {
    id: 'ord-hist-104',
    delivery_type: 'local_pickup',
    guest_name: 'Patricia Luna',
    guest_phone: '+54 9 11 2233-1122',
    guest_address: '',
    status: 'completed',
    payment_method: 'cash',
    total_amount: 21600,
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000 - 4 * 3600 * 1000).toISOString(),
    order_items: [
      { quantity: 3, unit_price: 7200, products: { name: 'Tarta Pascualina al Horno' } }
    ]
  },
  {
    id: 'ord-hist-105',
    delivery_type: 'delivery',
    guest_name: 'Joaquín Benítez',
    guest_phone: '+54 9 11 9988-7766',
    guest_address: 'Las Heras 770',
    status: 'completed',
    payment_method: 'mercadopago',
    total_amount: 35400,
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000 - 6 * 3600 * 1000).toISOString(),
    order_items: [
      { quantity: 3, unit_price: 11800, products: { name: 'Sorrentinos Caseros de Jamón y Muzzarella' } }
    ]
  },
  {
    id: 'ord-hist-106',
    delivery_type: 'delivery',
    guest_name: 'Santiago Morales',
    guest_phone: '+54 9 11 5544-3322',
    guest_address: 'Pellegrini 1024',
    status: 'completed',
    payment_method: 'card',
    total_amount: 29800,
    created_at: new Date(Date.now() - 6 * 24 * 3600 * 1000 - 1 * 3600 * 1000).toISOString(),
    order_items: [
      { quantity: 2, unit_price: 12500, products: { name: 'Pollo al Spiedo al Limón y Finas Hierbas' } },
      { quantity: 1, unit_price: 4800, products: { name: 'Papas Rústicas' } }
    ]
  },
  {
    id: 'ord-hist-107',
    delivery_type: 'local_pickup',
    guest_name: 'Carolina Varela',
    guest_phone: '+54 9 11 7766-5544',
    guest_address: '',
    status: 'completed',
    payment_method: 'cash',
    total_amount: 24000,
    created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000 - 2 * 3600 * 1000).toISOString(),
    order_items: [
      { quantity: 15, unit_price: 1600, products: { name: 'Empanadas Criollas Cortadas a Cuchillo' } }
    ]
  },
  {
    id: 'ord-hist-108',
    delivery_type: 'delivery',
    guest_name: 'Ignacio Rivas',
    guest_phone: '+54 9 11 3344-5566',
    guest_address: 'Alsina 450',
    status: 'completed',
    payment_method: 'card',
    total_amount: 43500,
    created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000 - 4 * 3600 * 1000).toISOString(),
    order_items: [
      { quantity: 3, unit_price: 14500, products: { name: 'Milanesa de Ternera Napolitana con Fritas' } }
    ]
  },
  {
    id: 'ord-hist-109',
    delivery_type: 'delivery',
    guest_name: 'Gonzalo Fuentes',
    guest_phone: '+54 9 11 9911-2233',
    guest_address: 'Av. Colón 1800',
    status: 'completed',
    payment_method: 'cash',
    total_amount: 37500,
    created_at: new Date(Date.now() - 18 * 24 * 3600 * 1000 - 3 * 3600 * 1000).toISOString(),
    order_items: [
      { quantity: 3, unit_price: 12500, products: { name: 'Pollo al Spiedo al Limón y Finas Hierbas' } }
    ]
  },
  {
    id: 'ord-hist-110',
    delivery_type: 'local_pickup',
    guest_name: 'Daniela Torres',
    guest_phone: '+54 9 11 6655-4433',
    guest_address: '',
    status: 'completed',
    payment_method: 'mercadopago',
    total_amount: 28800,
    created_at: new Date(Date.now() - 24 * 24 * 3600 * 1000 - 5 * 3600 * 1000).toISOString(),
    order_items: [
      { quantity: 4, unit_price: 7200, products: { name: 'Tarta Pascualina al Horno' } }
    ]
  }
]

export async function getOrdersByPeriod(
  restaurantId?: string,
  period: TimePeriod = 'today'
): Promise<any[]> {
  const cacheKey = `orders_period:${restaurantId || 'all'}:${period}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached

  let startDate: Date | null = null
  const now = new Date()

  if (period === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  } else if (period === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    startDate.setHours(0, 0, 0, 0)
  } else if (period === 'month') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    startDate.setHours(0, 0, 0, 0)
  }

  let builder = supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        quantity,
        unit_price,
        product_id,
        products (
          name
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (restaurantId) builder = builder.eq('restaurant_id', restaurantId)
  if (startDate) builder = builder.gte('created_at', startDate.toISOString())

  const fallback = SAMPLE_HISTORICAL_ORDERS.filter((o) => {
    if (!startDate) return true
    return new Date(o.created_at) >= startDate
  })

  const query = builder.then(({ data, error }) => {
    if (!error && data && (data.length > 0 || restaurantId)) {
      return data
    }
    return restaurantId ? [] : fallback
  })

  const result = await withTimeout(query, 1400, restaurantId ? [] : fallback)
  setCached(cacheKey, result, 15)
  return result
}

export async function getGerenciaStats(
  restaurantId?: string,
  period: TimePeriod = 'today'
): Promise<GerenciaStats> {
  const orders = await getOrdersByPeriod(restaurantId, period)

  const totalSales = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
  const totalOrders = orders.length
  const averageTicket = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0
  const completedOrders = orders.filter((o) => o.status === 'completed').length
  const pendingOrPreparingOrders = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
  ).length

  // Métodos de Pago
  let cashSales = 0
  let cashOrdersCount = 0
  let cardSales = 0
  let cardOrdersCount = 0

  // Tipos de Entrega
  let deliverySales = 0
  let deliveryOrdersCount = 0
  let pickupSales = 0
  let pickupOrdersCount = 0

  for (const o of orders) {
    const amt = Number(o.total_amount) || 0
    const pm = (o.payment_method || '').toLowerCase()
    if (pm === 'cash' || pm === 'efectivo') {
      cashSales += amt
      cashOrdersCount++
    } else {
      cardSales += amt
      cardOrdersCount++
    }

    if (o.delivery_type === 'delivery') {
      deliverySales += amt
      deliveryOrdersCount++
    } else {
      pickupSales += amt
      pickupOrdersCount++
    }
  }

  // Generación de Datos Gráficos según el período
  let chartData: HourlyOrDailyStat[] = []

  if (period === 'today') {
    // Horas de la jornada: 10:00 a 24:00 en bloques de 2 horas
    const slots = [
      { start: 10, end: 12, label: '10:00 - 12:00' },
      { start: 12, end: 14, label: '12:00 - 14:00' },
      { start: 14, end: 16, label: '14:00 - 16:00' },
      { start: 16, end: 18, label: '16:00 - 18:00' },
      { start: 18, end: 20, label: '18:00 - 20:00' },
      { start: 20, end: 22, label: '20:00 - 22:00' },
      { start: 22, end: 24, label: '22:00 - 24:00' },
    ]

    chartData = slots.map((slot) => {
      let sales = 0
      let count = 0
      for (const o of orders) {
        const d = new Date(o.created_at)
        const hour = d.getHours()
        if (hour >= slot.start && hour < slot.end) {
          sales += Number(o.total_amount) || 0
          count++
        }
      }
      return {
        label: `${slot.start}:00`,
        fullLabel: slot.label,
        sales,
        orders: count,
      }
    })
  } else if (period === 'week') {
    // Últimos 7 días con nombres de días (ej: Lun 28, Mar 29, etc.)
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

      let sales = 0
      let count = 0
      for (const o of orders) {
        const od = new Date(o.created_at)
        if (od >= dayStart && od <= dayEnd) {
          sales += Number(o.total_amount) || 0
          count++
        }
      }

      const dayName = dayNames[d.getDay()]
      const dateNum = d.getDate()
      return {
        label: `${dayName} ${dateNum}`,
        fullLabel: `${dayName} ${dateNum}/${d.getMonth() + 1}`,
        sales,
        orders: count,
      }
    })
  } else if (period === 'month') {
    // 4 semanas del mes
    chartData = [
      { label: 'Sem 1', fullLabel: 'Días 1 al 7', sales: 0, orders: 0 },
      { label: 'Sem 2', fullLabel: 'Días 8 al 14', sales: 0, orders: 0 },
      { label: 'Sem 3', fullLabel: 'Días 15 al 21', sales: 0, orders: 0 },
      { label: 'Sem 4', fullLabel: 'Días 22 al 30', sales: 0, orders: 0 },
    ]

    const now = new Date()
    for (const o of orders) {
      const od = new Date(o.created_at)
      const daysDiff = Math.floor((now.getTime() - od.getTime()) / (24 * 60 * 60 * 1000))
      const amt = Number(o.total_amount) || 0

      if (daysDiff <= 7) {
        chartData[3].sales += amt
        chartData[3].orders++
      } else if (daysDiff <= 14) {
        chartData[2].sales += amt
        chartData[2].orders++
      } else if (daysDiff <= 21) {
        chartData[1].sales += amt
        chartData[1].orders++
      } else if (daysDiff <= 30) {
        chartData[0].sales += amt
        chartData[0].orders++
      }
    }
  } else {
    // Histórico por trimestres / meses
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (5 - i))
      return {
        month: d.getMonth(),
        year: d.getFullYear(),
        label: `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`,
        sales: 0,
        orders: 0
      }
    })

    for (const o of orders) {
      const od = new Date(o.created_at)
      const match = last6Months.find(m => m.month === od.getMonth() && m.year === od.getFullYear())
      if (match) {
        match.sales += Number(o.total_amount) || 0
        match.orders++
      }
    }

    chartData = last6Months.map(m => ({
      label: m.label,
      fullLabel: m.label,
      sales: m.sales,
      orders: m.orders
    }))
  }

  // Top Platos Vendidos en el período
  const prodMap = new Map<string, { name: string; quantity: number; revenue: number }>()
  for (const o of orders) {
    if (o.order_items && Array.isArray(o.order_items)) {
      for (const item of o.order_items) {
        const name = item.products?.name || 'Plato del Catálogo'
        const qty = Number(item.quantity) || 1
        const price = Number(item.unit_price) || 0
        const current = prodMap.get(name) || { name, quantity: 0, revenue: 0 }
        current.quantity += qty
        current.revenue += qty * price
        prodMap.set(name, current)
      }
    }
  }

  const topProducts = Array.from(prodMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  const periodLabelMap: Record<TimePeriod, string> = {
    today: 'Jornada de Hoy (En vivo)',
    week: 'Esta Semana (Últimos 7 días)',
    month: 'Este Mes (Últimos 30 días)',
    all: 'Historial General Consolidado',
  }

  return {
    period,
    periodLabel: periodLabelMap[period],
    totalSales,
    totalOrders,
    averageTicket,
    completedOrders,
    pendingOrPreparingOrders,
    cashSales,
    cashOrdersCount,
    cardSales,
    cardOrdersCount,
    deliverySales,
    deliveryOrdersCount,
    pickupSales,
    pickupOrdersCount,
    chartData,
    topProducts,
    orders,
  }
}

// --- Insumos CRUD Completo ---

export async function saveInventoryItem(
  itemData: {
    id?: string
    name: string
    quantity_available: number
    unit: string
    min_stock: number
  },
  restaurantId: string
) {
  try {
    if (itemData.id) {
      const { error } = await supabase
        .from('inventory_items')
        .update({
          name: itemData.name.trim(),
          quantity_available: Number(itemData.quantity_available),
          unit: itemData.unit.trim(),
          min_stock: Number(itemData.min_stock),
        })
        .eq('id', itemData.id)
        .eq('restaurant_id', restaurantId)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('inventory_items')
        .insert({
          restaurant_id: restaurantId,
          name: itemData.name.trim(),
          quantity_available: Number(itemData.quantity_available),
          unit: itemData.unit.trim(),
          min_stock: Number(itemData.min_stock),
        })

      if (error) throw error
    }
  } catch (err) {
    console.warn('Error saving inventory item, using in-memory update:', err)
    // Actualizar en SAMPLE_INVENTORY si estamos en fallback
    if (itemData.id) {
      const existing = SAMPLE_INVENTORY.find((i) => i.id === itemData.id)
      if (existing) {
        existing.name = itemData.name
        existing.quantity_available = Number(itemData.quantity_available)
        existing.unit = itemData.unit
        existing.min_stock = Number(itemData.min_stock)
      }
    } else {
      SAMPLE_INVENTORY.push({
        id: `inv-${Date.now()}`,
        name: itemData.name,
        quantity_available: Number(itemData.quantity_available),
        unit: itemData.unit,
        min_stock: Number(itemData.min_stock),
      })
    }
  }

  invalidateCache('all_inventory')
  invalidateCache('critical_inventory')
}
