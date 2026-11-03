import { supabase } from './supabase'
import { emitRealtimeStoreEvent } from './realtime'

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

  // Horario automático de apertura y cierre por local
  auto_schedule_enabled?: boolean
  schedule_open_time?: string
  schedule_close_time?: string
  schedule_second_shift_enabled?: boolean
  schedule_open_time_2?: string
  schedule_close_time_2?: string
  schedule_days?: string

  // Control global de etiquetas de productos
  show_product_badges?: boolean
}

export interface StoreOpenStatus {
  isOpen: boolean
  reason: 'open' | 'manual_closed' | 'outside_hours' | 'closed_day'
  message: string
  scheduleSummary?: string
}

function parseTimeToMinutes(timeStr?: string, defaultMins = 0): number {
  if (!timeStr || !timeStr.includes(':')) return defaultMins
  const [hStr, mStr] = timeStr.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (isNaN(h) || isNaN(m)) return defaultMins
  return h * 60 + m
}

function isWithinShiftMinutes(nowMins: number, openMins: number, closeMins: number): boolean {
  if (openMins === closeMins) return true
  if (closeMins > openMins) {
    return nowMins >= openMins && nowMins < closeMins
  }
  // Cruza la medianoche (ej: 19:30 a 01:00)
  return nowMins >= openMins || nowMins < closeMins
}

/**
 * Evalúa si el restaurante se encuentra abierto en este instante,
 * combinando el interruptor manual y el horario automático propio de ese local.
 */
export function getStoreOpenStatus(restaurant?: RestaurantInfo | null): StoreOpenStatus {
  if (!restaurant) {
    return { isOpen: true, reason: 'open', message: '' }
  }

  const baseClosedMsg =
    restaurant.closed_message || 'El local se encuentra cerrado en este momento. ¡Volvemos pronto!'

  if (restaurant.is_store_open === false) {
    return {
      isOpen: false,
      reason: 'manual_closed',
      message: baseClosedMsg
    }
  }

  if (!restaurant.auto_schedule_enabled) {
    return { isOpen: true, reason: 'open', message: '' }
  }

  const now = new Date()
  const currentDay = now.getDay() // 0 = Domingo ... 6 = Sábado
  const prevDay = (currentDay + 6) % 7
  const nowMins = now.getHours() * 60 + now.getMinutes()

  const rawDays = (restaurant.schedule_days ?? '0,1,2,3,4,5,6').toString()
  const allowedDays = new Set(
    rawDays
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n))
  )

  const open1Str = restaurant.schedule_open_time || '19:30'
  const close1Str = restaurant.schedule_close_time || '23:45'
  const open1Mins = parseTimeToMinutes(open1Str, 19 * 60 + 30)
  const close1Mins = parseTimeToMinutes(close1Str, 23 * 60 + 45)

  const hasSecondShift = Boolean(restaurant.schedule_second_shift_enabled)
  const open2Str = restaurant.schedule_open_time_2 || '11:30'
  const close2Str = restaurant.schedule_close_time_2 || '14:30'
  const open2Mins = parseTimeToMinutes(open2Str, 11 * 60 + 30)
  const close2Mins = parseTimeToMinutes(close2Str, 14 * 60 + 30)

  const scheduleSummary = hasSecondShift
    ? `${open2Str} a ${close2Str} y ${open1Str} a ${close1Str} hs`
    : `${open1Str} a ${close1Str} hs`

  // Verificar si estamos en la madrugada de un turno nocturno iniciado el día anterior
  const inOvernightFromYesterday1 =
    close1Mins < open1Mins && nowMins < close1Mins && allowedDays.has(prevDay)
  const inOvernightFromYesterday2 =
    hasSecondShift && close2Mins < open2Mins && nowMins < close2Mins && allowedDays.has(prevDay)

  if (inOvernightFromYesterday1 || inOvernightFromYesterday2) {
    return { isOpen: true, reason: 'open', message: '', scheduleSummary }
  }

  if (!allowedDays.has(currentDay)) {
    return {
      isOpen: false,
      reason: 'closed_day',
      message: `${baseClosedMsg} (Hoy cerrado • Horario habitual: ${scheduleSummary})`,
      scheduleSummary
    }
  }

  const inShift1 =
    close1Mins < open1Mins
      ? nowMins >= open1Mins
      : isWithinShiftMinutes(nowMins, open1Mins, close1Mins)
  const inShift2 =
    hasSecondShift &&
    (close2Mins < open2Mins
      ? nowMins >= open2Mins
      : isWithinShiftMinutes(nowMins, open2Mins, close2Mins))

  if (inShift1 || inShift2) {
    return { isOpen: true, reason: 'open', message: '', scheduleSummary }
  }

  return {
    isOpen: false,
    reason: 'outside_hours',
    message: `${baseClosedMsg} (Horario de pedidos: ${scheduleSummary})`,
    scheduleSummary
  }
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

const SAMPLE_DEMO_KEYS = new Set([
  FALLBACK_RESTAURANT.id.toLowerCase(),
  '11111111-2222-3333-4444-555555555555',
  '22222222-3333-4444-5555-666666666666',
  'demo',
  'don-carlos',
  'la-nonna',
  'default'
])

export function isSampleRestaurantId(id?: string): boolean {
  if (!id) return true
  const clean = id.trim().toLowerCase()
  if (SAMPLE_DEMO_KEYS.has(clean)) return true
  if (clean.startsWith('preview-')) return true
  return false
}

export const SAMPLE_RESTAURANTS: RestaurantInfo[] = [
  {
    ...FALLBACK_RESTAURANT
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
    image_url: '/hero_rotiseria.jpg',
    badge: '🔥 Más pedido'
  },
  {
    id: 'prod-emp-01',
    code: 'EMP-CRIOLLA',
    name: 'Empanadas Criollas Cortadas a Cuchillo',
    description: 'Carne seleccionada tierna, cebollita de verdeo, huevo duro y pimentón dulce. Receta tradicional.',
    price: 1600,
    category: '🥟 Empanadas Caseras',
    is_available: true,
    image_url: '/artisanal_dishes.jpg',
    badge: '🔥 Más pedido'
  },
  {
    id: 'prod-emp-02',
    code: 'EMP-JAM-QUESO',
    name: 'Empanadas de Jamón Cocido y Doble Muzzarella',
    description: 'Masa hojaldrada hecha en casa con queso derretido abundante.',
    price: 1500,
    category: '🥟 Empanadas Caseras',
    is_available: true,
    image_url: '/artisanal_dishes.jpg',
    badge: ''
  },
  {
    id: 'prod-emp-03',
    code: 'EMP-CEBOLLA',
    name: 'Empanadas Fugazzeta & 4 Quesos',
    description: 'Cebolla dorada suave, muzzarella, provolone, sardo y queso azul artesanal.',
    price: 1600,
    category: '🥟 Empanadas Caseras',
    is_available: true,
    image_url: '/artisanal_dishes.jpg',
    badge: '✨ ¡Nuevo!'
  },
  {
    id: 'prod-mila-01',
    code: 'MILA-NAPO',
    name: 'Milanesa Napolitana para Compartir',
    description: 'Carne tierna empanada con pan casero, salsa pomodoro, jamón cocido natural y muzzarella gratinada.',
    price: 14500,
    category: '🥩 Minutas & Platos Fuertes',
    is_available: true,
    image_url: '/artisanal_dishes.jpg',
    badge: '⭐ Recomendado'
  },
  {
    id: 'prod-matambre-01',
    code: 'MAT-PIZZA',
    name: 'Matambrito Tiernizado a la Pizza',
    description: 'Corte de cerdo marinado con limón y hierbas, gratinado con muzzarella y rodajas de tomate fresco.',
    price: 15800,
    category: '🥩 Minutas & Platos Fuertes',
    is_available: true,
    image_url: '/hero_rotiseria.jpg',
    badge: '👑 Especialidad'
  },
  {
    id: 'prod-pasta-01',
    code: 'SORREN-RICOTA',
    name: 'Sorrentinos Caseros de Jamón y Muzzarella',
    description: 'Pasta fresca del día servida con salsa fileto de tomates perita y lluvia de parmesano.',
    price: 11800,
    category: '🍝 Pastas Artesanales',
    is_available: true,
    image_url: '/artisanal_dishes.jpg',
    badge: '🏷️ Oferta'
  },
  {
    id: 'prod-tarta-01',
    code: 'TARTA-PASC',
    name: 'Tarta Pascualina al Horno',
    description: 'Masa casera crocante con relleno cremoso de acelga fresca, ricota y huevos de campo.',
    price: 7200,
    category: '🥗 Tartas & Guarniciones',
    is_available: true,
    image_url: '/hero_rotiseria.jpg',
    badge: ''
  },
  {
    id: 'prod-papas-01',
    code: 'PAPAS-PROV',
    name: 'Porción de Papas Fritas Rústicas a la Provenzal',
    description: 'Papas naturales cortadas a mano con ajo picado fino y perejil fresco de la huerta.',
    price: 4900,
    category: '🥗 Tartas & Guarniciones',
    is_available: true,
    image_url: '/hero_rotiseria.jpg',
    badge: ''
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

// Helper para fusionar únicamente campos cuya columna aún no exista en Supabase (sin pisar datos reales de la BDD)
export function mergeBranding(rest: RestaurantInfo): RestaurantInfo {
  const merged: Record<string, any> = { ...rest }
  if (typeof window !== 'undefined') {
    try {
      // Limpiar llaves antiguas de localStorage que antes pisaban los datos compartidos de Supabase
      window.localStorage.removeItem('comandapp_branding_latest')
      if (rest.id) window.localStorage.removeItem(`comandapp_branding_${rest.id.toLowerCase()}`)
      if (rest.subdomain) window.localStorage.removeItem(`comandapp_branding_${rest.subdomain.toLowerCase()}`)

      // Solo aplicar respaldo local para columnas que aún sean undefined en la respuesta de Supabase
      const rawUnmigrated = rest.id
        ? window.localStorage.getItem(`comandapp_unmigrated_${rest.id.toLowerCase()}`)
        : null
      if (rawUnmigrated) {
        const unmigrated = JSON.parse(rawUnmigrated)
        for (const [k, v] of Object.entries(unmigrated)) {
          if (merged[k] === undefined) {
            merged[k] = v
          }
        }
      }
    } catch {
      // Ignore localStorage parse errors
    }
  }
  const isDemoRest = isSampleRestaurantId(rest.id) || isSampleRestaurantId(rest.subdomain)
  const custom = inMemoryRestaurantBranding.get(rest.id) || (rest.subdomain ? inMemoryRestaurantBranding.get(rest.subdomain.toLowerCase()) : undefined)
  if (custom) {
    for (const [k, v] of Object.entries(custom)) {
      if (isDemoRest || merged[k] === undefined) {
        merged[k] = v
      }
    }
  }
  return merged as RestaurantInfo
}

// Obtener restaurante por subdominio o ID
export async function getRestaurant(idOrSubdomain?: string): Promise<RestaurantInfo> {
  const raw = idOrSubdomain?.trim()
  const clean = raw?.toLowerCase()
  const cacheKey = `restaurant:${clean || 'default'}`
  const cached = getCached<RestaurantInfo>(cacheKey)
  if (cached) return mergeBranding(cached)

  if (!raw || !clean || clean === 'demo' || clean === 'default' || clean === 'don-carlos' || clean === FALLBACK_RESTAURANT.id.toLowerCase()) {
    const merged = mergeBranding(FALLBACK_RESTAURANT)
    setCached(cacheKey, merged, 30)
    return merged
  }

  if (clean.startsWith('preview-')) {
    const sub = clean.replace(/^preview-/, '') || 'tunegocio'
    const preview = mergeBranding({
      ...FALLBACK_RESTAURANT,
      id: `preview-${sub}`,
      name: `Rotisería ${sub.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
      subdomain: sub
    })
    setCached(cacheKey, preview, 30)
    return preview
  }

  // Quick match in sample restaurants
  const sampleMatch = SAMPLE_RESTAURANTS.find(
    r => r.subdomain.toLowerCase() === clean || r.id.toLowerCase() === clean
  )

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)

  // Si es un UUID de demostración conocido, devolver directo sin tocar Supabase
  if (isUuid && isSampleRestaurantId(raw)) {
    const merged = mergeBranding(sampleMatch || FALLBACK_RESTAURANT)
    setCached(cacheKey, merged, 30)
    return merged
  }

  const previewFallback: RestaurantInfo = sampleMatch || {
    ...FALLBACK_RESTAURANT,
    id: isUuid ? raw : `preview-${clean}`,
    name: `Rotisería ${raw.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    subdomain: clean
  }

  const query = (async () => {
    if (isUuid) {
      const { data } = await supabase.from('restaurants').select('*').eq('id', raw).maybeSingle()
      if (data) return mergeBranding(data)
    } else {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .ilike('subdomain', clean)
        .maybeSingle()

      if (data) return mergeBranding(data)
    }

    if (sampleMatch) return mergeBranding(sampleMatch)
    return mergeBranding(previewFallback)
  })()

  const result = await withTimeout(query, 8000, previewFallback)
  const merged = mergeBranding(result)
  setCached(cacheKey, merged, 15)
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

  const sampleMatch = SAMPLE_RESTAURANTS.find(r => r.subdomain.toLowerCase() === slug) || (slug === 'don-carlos' || slug === 'demo' ? FALLBACK_RESTAURANT : null)

  const query = Promise.resolve(
    supabase.from('restaurants').select('*').ilike('subdomain', slug).maybeSingle()
  ).then(({ data, error }) => {
    if (error) return sampleMatch ? mergeBranding(sampleMatch) : null
    const res = (data as RestaurantInfo | null) || sampleMatch
    return res ? mergeBranding(res) : null
  })

  const result = await withTimeout<RestaurantInfo | null>(query, 4000, sampleMatch)
  const merged = result ? mergeBranding(result) : null
  if (merged) setCached(cacheKey, merged, 15)
  return merged
}

// Guarda la configuración completa y branding de un restaurante en Supabase (fuente de verdad compartida)
export async function updateRestaurantBranding(
  restaurantId: string,
  data: Partial<RestaurantInfo>
) {
  const payload: Record<string, any> = { ...data }
  delete payload.id
  delete payload.subdomain // Subdominio es de solo lectura tras creación

  if (isSampleRestaurantId(restaurantId)) {
    const prev = inMemoryRestaurantBranding.get(restaurantId) || {}
    inMemoryRestaurantBranding.set(restaurantId, { ...prev, ...payload })
    invalidateCache('restaurant')
    invalidateCache('restaurant_strict')
    invalidateCache('all_restaurants')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('comandapp-branding-updated', { detail: { ...data, id: restaurantId } }))
    }
    return true
  }

  const unmigratedFields: Record<string, any> = {}

  try {
    let attempts = 0
    while (Object.keys(payload).length > 0 && attempts < 60) {
      attempts++
      const { error } = await supabase
        .from('restaurants')
        .update(payload)
        .eq('id', restaurantId)

      if (!error) break

      // Si PostgREST indica que una columna aún no fue migrada en la tabla restaurants, la separamos y reintentamos con el resto
      const match = error.message?.match(/Could not find the '([^']+)' column|column "([^"]+)" of relation/i)
      const missingCol = match?.[1] || match?.[2]
      if (missingCol && missingCol in payload) {
        unmigratedFields[missingCol] = payload[missingCol]
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

  // Guardar en memoria/localStorage ÚNICAMENTE las columnas que no existan aún en la tabla de Supabase
  if (Object.keys(unmigratedFields).length > 0) {
    const prev = inMemoryRestaurantBranding.get(restaurantId) || {}
    const nextUnmigrated = { ...prev, ...unmigratedFields }
    inMemoryRestaurantBranding.set(restaurantId, nextUnmigrated)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(`comandapp_unmigrated_${restaurantId.toLowerCase()}`, JSON.stringify(nextUnmigrated))
      } catch {}
    }
  } else {
    inMemoryRestaurantBranding.delete(restaurantId)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(`comandapp_unmigrated_${restaurantId.toLowerCase()}`)
      } catch {}
    }
  }

  invalidateCache('restaurant')
  invalidateCache('restaurant_strict')
  invalidateCache('all_restaurants')

  const mergedData = { ...data, id: restaurantId }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('comandapp-branding-updated', { detail: mergedData }))
  }
  void emitRealtimeStoreEvent({ type: 'store_config_update', restaurantId })

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

const inMemoryProductBadges = new Map<string, string>()

function getStoredProductBadge(productId: string): string | undefined {
  if (inMemoryProductBadges.has(productId)) {
    return inMemoryProductBadges.get(productId)
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('comandapp_product_badges')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && productId in parsed) {
          return parsed[productId]
        }
      }
    } catch {}
  }
  return undefined
}

function setStoredProductBadge(productId: string, badge: string) {
  inMemoryProductBadges.set(productId, badge)
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('comandapp_product_badges')
      const parsed = raw ? JSON.parse(raw) : {}
      parsed[productId] = badge
      window.localStorage.setItem('comandapp_product_badges', JSON.stringify(parsed))
    } catch {}
  }
}

function clearStoredProductBadge(productId: string) {
  inMemoryProductBadges.delete(productId)
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('comandapp_product_badges')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && productId in parsed) {
          delete parsed[productId]
          window.localStorage.setItem('comandapp_product_badges', JSON.stringify(parsed))
        }
      }
    } catch {}
  }
}

function enrichProductWithBadge<T extends { id: string; badge?: string }>(p: T): T {
  // Si la columna badge ya viene desde Supabase, usar siempre el valor real de la base de datos
  if (p.badge !== undefined && p.badge !== null) {
    return p
  }
  const localBadge = getStoredProductBadge(p.id)
  if (localBadge !== undefined) {
    return { ...p, badge: localBadge }
  }
  return p
}

// --- Products (Public) ---
export async function getProducts(restaurantIdOrSubdomain?: string) {
  const cacheKey = `products:${restaurantIdOrSubdomain || 'default'}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached.map(enrichProductWithBadge)

  let id = restaurantIdOrSubdomain?.trim()
  const isUuid = !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  if (!isUuid && !isSampleRestaurantId(id)) {
    const rest = await getRestaurant(id)
    id = rest.id
  }

  // Si es tienda demo o vista previa de subdominio, devolver directamente catálogo artesanal de ejemplo
  if (isSampleRestaurantId(id)) {
    const demoProds = ARTISANAL_FALLBACK_PRODUCTS.filter(p => p.is_available !== false).map(enrichProductWithBadge)
    setCached(cacheKey, demoProds, 15)
    return demoProds
  }

  // Comercio REAL en Supabase: consultar EXCLUSIVAMENTE sus propios productos (jamás mezclar con otro local ni con demo)
  let succeeded = false
  const query = (async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', id!)
      .eq('is_available', true)

    if (!error && data) {
      succeeded = true
      return data.map(enrichProductWithBadge)
    }
    return []
  })()

  const result = await withTimeout(query, 8000, [])
  if (succeeded) setCached(cacheKey, result, 15)
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
  badge?: string
  ingredients?: string[]
  product_ingredients?: ProductIngredientItem[]
}

// In-memory fallback map for recipes when Supabase migration is not yet applied
const inMemoryRecipes = new Map<string, { inventory_item_id: string; quantity: number }[]>()

// --- Admin Product CRUD ---
export async function getAdminProducts(restaurantId?: string): Promise<ProductItem[]> {
  const isSample = isSampleRestaurantId(restaurantId)
  const cacheKey = `admin_products:${restaurantId || 'demo'}`
  const cached = getCached<ProductItem[]>(cacheKey)
  if (cached) return cached.map(enrichProductWithBadge)

  // Modo demostración: devolver exclusivamente el catálogo de ejemplo sin consultar productos de otros locales en Supabase
  if (isSample || !restaurantId) {
    const demoProds = ARTISANAL_FALLBACK_PRODUCTS.map((p: any) => enrichProductWithBadge({
      ...p,
      restaurant_id: restaurantId || FALLBACK_RESTAURANT.id,
      product_ingredients: (inMemoryRecipes.get(p.id) || []).map(r => ({
        ...r,
        product_id: p.id
      }))
    })) as ProductItem[]
    setCached(cacheKey, demoProds, 15)
    return demoProds
  }

  // Comercio REAL: filtrar SIEMPRE por restaurant_id (jamás mezclar catálogos)
  let succeeded = false
  const query = supabase
    .from('products')
    .select(`
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
    .eq('restaurant_id', restaurantId)
    .order('name', { ascending: true })
    .then(async ({ data, error }) => {
      if (error) {
        console.warn('Falling back to plain products query:', error.message)
        const { data: plainData, error: plainErr } = await supabase
          .from('products')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('name', { ascending: true })

        if (!plainErr && plainData) {
          succeeded = true
          return plainData.map((p: any) => enrichProductWithBadge({
            ...p,
            product_ingredients: (inMemoryRecipes.get(p.id) || []).map(r => ({
              ...r,
              product_id: p.id
            }))
          }))
        }
        return []
      }

      succeeded = true
      return (data || []).map((p: any) => {
        const mem = inMemoryRecipes.get(p.id)
        if ((!p.product_ingredients || p.product_ingredients.length === 0) && mem) {
          return enrichProductWithBadge({
            ...p,
            product_ingredients: mem.map(r => ({ ...r, product_id: p.id }))
          })
        }
        return enrichProductWithBadge(p)
      })
    })

  const result = await withTimeout(query, 8000, [])
  if (succeeded) setCached(cacheKey, result, 15)
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
    badge?: string
  },
  recipe: { inventory_item_id: string; quantity: number }[],
  restaurantId: string
) {
  const code = productData.code?.trim() ||
    productData.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 10) + '-' + Math.floor(Math.random() * 900 + 100)

  let productId = productData.id
  const badgeVal = productData.badge !== undefined ? productData.badge.trim() : ''
  let badgeSavedInDb = true

  const basePayload: Record<string, any> = {
    name: productData.name,
    code,
    description: productData.description || '',
    price: Number(productData.price),
    category: productData.category,
    is_available: productData.is_available ?? true,
    image_url: productData.image_url || '',
    badge: badgeVal
  }

  if (isSampleRestaurantId(restaurantId)) {
    const targetId = productId || `prod-demo-${Date.now()}`
    const existingIdx = ARTISANAL_FALLBACK_PRODUCTS.findIndex(p => p.id === targetId)
    const demoItem: any = {
      ...(existingIdx !== -1 ? ARTISANAL_FALLBACK_PRODUCTS[existingIdx] : {}),
      id: targetId,
      ...basePayload
    }
    if (existingIdx !== -1) {
      ARTISANAL_FALLBACK_PRODUCTS[existingIdx] = demoItem
    } else {
      ARTISANAL_FALLBACK_PRODUCTS.push(demoItem)
    }
    inMemoryRecipes.set(targetId, recipe)
    invalidateCache('products')
    invalidateCache('admin_products')
    void emitRealtimeStoreEvent({ type: 'product_update', restaurantId })
    return targetId
  }

  if (productId) {
    // Actualizar producto existente (con fallback si la columna badge aún no se migró en DB)
    let { error } = await supabase
      .from('products')
      .update(basePayload)
      .eq('id', productId)
      .eq('restaurant_id', restaurantId)

    if (error && /badge/i.test(error.message || '')) {
      badgeSavedInDb = false
      const { badge: _omit, ...withoutBadge } = basePayload
      const retry = await supabase
        .from('products')
        .update(withoutBadge)
        .eq('id', productId)
        .eq('restaurant_id', restaurantId)
      error = retry.error
    }

    if (error) throw error
  } else {
    // Crear nuevo producto
    const insertPayload: Record<string, any> = { ...basePayload, restaurant_id: restaurantId }
    let { data: newProd, error } = await supabase
      .from('products')
      .insert(insertPayload)
      .select()
      .single()

    if (error && /badge/i.test(error.message || '')) {
      badgeSavedInDb = false
      const { badge: _omit, ...withoutBadge } = insertPayload
      const retry = await supabase
        .from('products')
        .insert(withoutBadge)
        .select()
        .single()
      newProd = retry.data
      error = retry.error
    }

    if (error) throw error
    productId = newProd.id
  }

  // Si la columna badge existe en la BDD, limpiamos localStorage para no pisar cambios de otros usuarios
  if (productId) {
    if (badgeSavedInDb) {
      clearStoredProductBadge(productId)
    } else {
      setStoredProductBadge(productId, badgeVal)
    }
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
  void emitRealtimeStoreEvent({ type: 'product_update', restaurantId })
  return productId
}

export async function deleteProduct(productId: string, restaurantId?: string) {
  if (isSampleRestaurantId(restaurantId)) {
    const idx = ARTISANAL_FALLBACK_PRODUCTS.findIndex(p => p.id === productId)
    if (idx !== -1) ARTISANAL_FALLBACK_PRODUCTS.splice(idx, 1)
    inMemoryRecipes.delete(productId)
    invalidateCache('products')
    invalidateCache('admin_products')
    void emitRealtimeStoreEvent({ type: 'product_update', restaurantId })
    return
  }

  let builder = supabase.from('products').delete().eq('id', productId)
  if (restaurantId) builder = builder.eq('restaurant_id', restaurantId)

  const { error } = await builder
  if (error) throw error

  inMemoryRecipes.delete(productId)
  invalidateCache('products')
  invalidateCache('admin_products')
  void emitRealtimeStoreEvent({ type: 'product_update', restaurantId })
}

export async function toggleProductAvailability(
  productId: string,
  isAvailable: boolean,
  restaurantId?: string
) {
  const demoProd = ARTISANAL_FALLBACK_PRODUCTS.find(p => p.id === productId)
  if (demoProd || isSampleRestaurantId(restaurantId)) {
    if (demoProd) demoProd.is_available = isAvailable
    invalidateCache('products')
    invalidateCache('admin_products')
    void emitRealtimeStoreEvent({ type: 'product_update', restaurantId })
    return
  }

  let builder = supabase
    .from('products')
    .update({ is_available: isAvailable })
    .eq('id', productId)

  if (restaurantId) {
    builder = builder.eq('restaurant_id', restaurantId)
  }

  const { error } = await builder

  if (error) throw error
  invalidateCache('products')
  invalidateCache('admin_products')
  void emitRealtimeStoreEvent({ type: 'product_update', restaurantId })
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

  // 3. Aplicar las deducciones al inventario (paralelizado para velocidad en Checkout y POS)
  if (totalDeductions.size === 0) return

  if (isSampleRestaurantId(restaurantId)) {
    for (const [inventoryItemId, deduction] of Array.from(totalDeductions.entries())) {
      const sampleItem = SAMPLE_INVENTORY.find((i) => i.id === inventoryItemId)
      if (sampleItem) {
        sampleItem.quantity_available = Math.max(0, Number(sampleItem.quantity_available) - deduction)
      }
    }
    invalidateCache('all_inventory')
    invalidateCache('critical_inventory')
    void emitRealtimeStoreEvent({ type: 'inventory_update', restaurantId })
    return
  }

  try {
    const itemIds = Array.from(totalDeductions.keys())
    let fetchBuilder = supabase
      .from('inventory_items')
      .select('id, quantity_available')
      .in('id', itemIds)

    if (restaurantId) {
      fetchBuilder = fetchBuilder.eq('restaurant_id', restaurantId)
    }

    const { data: currentItems } = await fetchBuilder
    if (currentItems && currentItems.length > 0) {
      await Promise.all(
        currentItems.map(async (currentItem: { id: string; quantity_available: number }) => {
          const deduction = totalDeductions.get(currentItem.id) || 0
          if (deduction <= 0) return
          const newQty = Math.max(0, Number(currentItem.quantity_available) - deduction)
          await Promise.all([
            supabase
              .from('inventory_items')
              .update({ quantity_available: newQty })
              .eq('id', currentItem.id),
            supabase.from('inventory_movements').insert({
              item_id: currentItem.id,
              quantity_change: -deduction,
              movement_type: 'out'
            })
          ])
        })
      )
    }
  } catch (err) {
    console.warn('Error batch updating inventory deductions:', err)
  }

  invalidateCache('all_inventory')
  invalidateCache('critical_inventory')
  void emitRealtimeStoreEvent({ type: 'inventory_update', restaurantId })
}

// Respaldo en memoria y localStorage para órdenes creadas en modo demo o con productos de muestra
const inMemoryCreatedOrders: any[] = []
const RECENT_ORDERS_STORAGE_KEY = 'comandapp_recent_orders_v1'

function getRecentLocalOrders(): any[] {
  if (typeof window === 'undefined') return inMemoryCreatedOrders
  try {
    const raw = window.localStorage.getItem(RECENT_ORDERS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return inMemoryCreatedOrders
    const byId = new Map<string, any>()
    for (const o of [...inMemoryCreatedOrders, ...parsed]) {
      if (o?.id && !byId.has(o.id)) byId.set(o.id, o)
    }
    return Array.from(byId.values())
  } catch {
    return inMemoryCreatedOrders
  }
}

function saveRecentLocalOrder(orderObj: any) {
  if (typeof window === 'undefined') return
  try {
    const existing = getRecentLocalOrders().filter((o) => o.id !== orderObj.id)
    const updated = [orderObj, ...existing].slice(0, 50)
    window.localStorage.setItem(RECENT_ORDERS_STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // Ignore storage quota errors
  }
}

function updateRecentLocalOrderStatus(orderId: string, status: string) {
  if (typeof window === 'undefined') return
  try {
    const list = getRecentLocalOrders()
    let changed = false
    const updated = list.map((o) => {
      if (o.id === orderId) {
        changed = true
        return { ...o, status }
      }
      return o
    })
    if (changed) {
      window.localStorage.setItem(RECENT_ORDERS_STORAGE_KEY, JSON.stringify(updated))
    }
  } catch {
    // Ignore storage errors
  }
}

function enrichOrderItemsFallback(dbOrder: any, recentPool: any[]): any {
  if (dbOrder.order_items && dbOrder.order_items.length > 0) {
    return dbOrder
  }
  const match = recentPool.find((m) => m.id === dbOrder.id)
  if (match?.order_items && match.order_items.length > 0) {
    return { ...dbOrder, order_items: match.order_items }
  }
  if (typeof dbOrder.notes === 'string' && dbOrder.notes.includes('Ítems:')) {
    const itemsPart = dbOrder.notes.split('Ítems:')[1]?.trim()
    if (itemsPart) {
      const parsedItems = itemsPart
        .split(',')
        .map((chunk: string) => {
          const m = chunk.trim().match(/^(\d+)x\s+(.+)$/)
          if (!m) return null
          const qty = Number(m[1]) || 1
          const name = m[2].trim()
          const sampleProd = ARTISANAL_FALLBACK_PRODUCTS.find((p) => p.name === name)
          return {
            quantity: qty,
            unit_price: sampleProd?.price || 0,
            products: { name }
          }
        })
        .filter(Boolean)
      if (parsedItems.length > 0) {
        return { ...dbOrder, order_items: parsedItems }
      }
    }
  }
  return dbOrder
}

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
  const id = restaurantId || FALLBACK_RESTAURANT.id
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
  let isFallbackOnly = false
  let createdOrder: any = {
    id: generatedId,
    restaurant_id: id,
    ...order,
    notes: finalNotes || undefined,
    status: order.status || 'pending',
    created_at: nowIso
  }

  if (isSampleRestaurantId(id)) {
    isFallbackOnly = true
  } else try {
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
    isFallbackOnly = true
  }

  // Guardar representación rica con nombres de productos para visualización inmediata en Cocina / Seguimiento / KPIs
  const enrichedOrder = {
    ...createdOrder,
    _fallbackOnly: isFallbackOnly,
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
  saveRecentLocalOrder(enrichedOrder)

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
  invalidateCache('critical_inventory')
  invalidateCache('all_inventory')

  // Emitir evento en vivo por WebSocket / Broadcast para actualizar Gerencia y Cocina sin recargar
  void emitRealtimeStoreEvent({
    type: 'new_order',
    restaurantId: id,
    orderId: enrichedOrder.id,
    totalAmount: Number(enrichedOrder.total_amount || 0),
    guestName: enrichedOrder.guest_name,
    status: enrichedOrder.status || 'pending'
  })

  return enrichedOrder
}

function formatHexAsUuid(hex32: string): string {
  return `${hex32.slice(0, 8)}-${hex32.slice(8, 12)}-${hex32.slice(12, 16)}-${hex32.slice(16, 20)}-${hex32.slice(20, 32)}`
}

// Para seguimiento público (acepta UUID completo o código corto como #B326ADF8)
export async function getOrderById(orderId: string, restaurantId?: string) {
  const cleanId = orderId.trim().replace(/^#+/, '').trim()
  if (!cleanId) return null
  const lowerId = cleanId.toLowerCase()

  const recentPool = getRecentLocalOrders()
  const localCandidates = [...inMemoryCreatedOrders, ...recentPool, ...SAMPLE_ADMIN_ORDERS]
  const memMatch = localCandidates.find((o) => {
    if (!o?.id) return false
    if (restaurantId && o.restaurant_id && o.restaurant_id !== restaurantId) return false
    const cand = String(o.id).toLowerCase()
    if (cand === lowerId) return true
    if (lowerId.length >= 6 && (cand.startsWith(lowerId) || cand.replace(/-/g, '').startsWith(lowerId.replace(/-/g, '')))) {
      return true
    }
    return false
  })

  if (isSampleRestaurantId(restaurantId) && lowerId !== FALLBACK_RESTAURANT.id) {
    return memMatch || null
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const strippedHex = lowerId.replace(/-/g, '')
  const isShortHexPrefix = !uuidRegex.test(lowerId) && /^[0-9a-f]{6,31}$/.test(strippedHex)

  if (!uuidRegex.test(lowerId) && !isShortHexPrefix) {
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

  if (uuidRegex.test(lowerId)) {
    builder = builder.eq('id', lowerId)
  } else {
    const minUuid = formatHexAsUuid(strippedHex.padEnd(32, '0'))
    const maxUuid = formatHexAsUuid(strippedHex.padEnd(32, 'f'))
    builder = builder.gte('id', minUuid).lte('id', maxUuid).order('created_at', { ascending: false }).limit(1)
  }

  if (restaurantId && !isSampleRestaurantId(restaurantId)) {
    builder = builder.eq('restaurant_id', restaurantId)
  }

  const query = builder.then(({ data, error }) => {
    const row = Array.isArray(data) ? data[0] : data
    if (!error && row) {
      return enrichOrderItemsFallback(row, recentPool)
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
  const isSample = isSampleRestaurantId(restaurantId)
  const cacheKey = `orders:${restaurantId || 'demo'}:${statuses.slice().sort().join(',')}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached

  const recentPool = getRecentLocalOrders()

  if (isSample || !restaurantId) {
    const demoLocal = recentPool.filter(
      (o) => statuses.includes(o.status) && isSampleRestaurantId(o.restaurant_id)
    )
    const demoOrders = [...demoLocal, ...SAMPLE_ADMIN_ORDERS.filter((o) => statuses.includes(o.status))]
    setCached(cacheKey, demoOrders, 5)
    return demoOrders
  }

  const memMatches = recentPool.filter(
    (o) => statuses.includes(o.status) && o.restaurant_id === restaurantId
  )

  let succeeded = false
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
    .in('status', statuses)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: true })
    .then(({ data, error }) => {
      if (!error && data) {
        succeeded = true
        const enriched = data.map((dbOrder: any) => enrichOrderItemsFallback(dbOrder, recentPool))
        const dbIds = new Set(enriched.map((o: any) => o.id))
        const localOnly = memMatches.filter((m) => m._fallbackOnly && !dbIds.has(m.id))
        return [...enriched, ...localOnly]
      }
      return memMatches
    })

  const result = await withTimeout(query, 8000, memMatches)
  if (succeeded) setCached(cacheKey, result, 5)
  return result
}

export async function updateOrderStatus(orderId: string, status: string, restaurantId?: string) {
  const memOrder = inMemoryCreatedOrders.find((o) => o.id === orderId)
  if (memOrder) {
    memOrder.status = status
  }
  const sampleOrder = SAMPLE_ADMIN_ORDERS.find((o) => o.id === orderId)
  if (sampleOrder) {
    sampleOrder.status = status
  }
  updateRecentLocalOrderStatus(orderId, status)
  const localOrder = getRecentOrderLocal(orderId)
  if (localOrder) {
    saveRecentOrderLocal({ ...localOrder, status })
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)
  if (isUuid && !isSampleRestaurantId(restaurantId)) {
    try {
      let builder = supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)

      if (restaurantId) {
        builder = builder.eq('restaurant_id', restaurantId)
      }

      const { error } = await builder
      if (error) throw error
    } catch (err) {
      console.warn('Mock updating order status', orderId, status, err)
    }
  }

  invalidateCache('orders')
  invalidateCache('today_orders')
  invalidateCache('orders_period')
  void emitRealtimeStoreEvent({
    type: 'order_status',
    restaurantId,
    orderId,
    status
  })
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
  const isSample = isSampleRestaurantId(restaurantId)
  const cacheKey = `critical_inventory:${restaurantId || 'demo'}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached

  if (isSample || !restaurantId) {
    const demoCrit = SAMPLE_INVENTORY.filter((item) => Number(item.quantity_available) <= Number(item.min_stock))
    setCached(cacheKey, demoCrit, 20)
    return demoCrit
  }

  let succeeded = false
  const query = supabase
    .from('inventory_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .then(({ data, error }) => {
      if (!error && data) {
        succeeded = true
        return data.filter((item: any) => Number(item.quantity_available) <= Number(item.min_stock))
      }
      return []
    })

  const result = await withTimeout(query, 8000, [])
  if (succeeded) setCached(cacheKey, result, 20)
  return result
}

export async function refillInventory(itemId: string, amount: number, restaurantId?: string) {
  const sampleIdx = SAMPLE_INVENTORY.findIndex((i) => i.id === itemId)
  if (sampleIdx !== -1) {
    SAMPLE_INVENTORY[sampleIdx].quantity_available = Math.max(
      0,
      Number(SAMPLE_INVENTORY[sampleIdx].quantity_available) + Number(amount)
    )
  }

  if (!isSampleRestaurantId(restaurantId) && sampleIdx === -1) {
    try {
      let fetchBuilder = supabase
        .from('inventory_items')
        .select('quantity_available, restaurant_id')
        .eq('id', itemId)

      if (restaurantId) fetchBuilder = fetchBuilder.eq('restaurant_id', restaurantId)

      const { data: current, error: fetchError } = await fetchBuilder.single()
      if (fetchError) throw fetchError

      const nextQty = Math.max(0, Number(current.quantity_available) + Number(amount))
      const effectiveRestId = restaurantId || current.restaurant_id

      await Promise.all([
        supabase
          .from('inventory_items')
          .update({ quantity_available: nextQty })
          .eq('id', itemId),
        supabase.from('inventory_movements').insert({
          item_id: itemId,
          quantity_change: Number(amount),
          movement_type: Number(amount) >= 0 ? 'in' : 'out'
        })
      ])

      invalidateCache('critical_inventory')
      invalidateCache('all_inventory')
      void emitRealtimeStoreEvent({ type: 'inventory_update', restaurantId: effectiveRestId })
      return
    } catch (err) {
      console.warn('Mock refill inventory', itemId, amount, err)
    }
  }

  invalidateCache('critical_inventory')
  invalidateCache('all_inventory')
  void emitRealtimeStoreEvent({ type: 'inventory_update', restaurantId })
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
  void emitRealtimeStoreEvent({ type: 'inventory_update', restaurantId })
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
  void emitRealtimeStoreEvent({ type: 'inventory_update', restaurantId })
}

export async function getAllInventory(restaurantId?: string) {
  const isSample = isSampleRestaurantId(restaurantId)
  const cacheKey = `all_inventory:${restaurantId || 'demo'}`
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached

  if (isSample || !restaurantId) {
    setCached(cacheKey, [...SAMPLE_INVENTORY], 30)
    return [...SAMPLE_INVENTORY]
  }

  let succeeded = false
  const query = supabase
    .from('inventory_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('name', { ascending: true })
    .then(({ data, error }) => {
      if (!error && data) {
        succeeded = true
        return data
      }
      return []
    })

  const result = await withTimeout(query, 8000, [])
  if (succeeded) setCached(cacheKey, result, 30)
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
  const isSample = isSampleRestaurantId(restaurantId)
  const cacheKey = `orders_period:${restaurantId || 'demo'}:${period}`
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

  const recentPool = getRecentLocalOrders()

  if (isSample || !restaurantId) {
    const demoLocal = recentPool.filter((o) => {
      if (!isSampleRestaurantId(o.restaurant_id)) return false
      if (!startDate) return true
      return new Date(o.created_at) >= startDate
    })
    const demoHist = [
      ...demoLocal,
      ...SAMPLE_HISTORICAL_ORDERS.filter((o) => {
        if (!startDate) return true
        return new Date(o.created_at) >= startDate
      })
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setCached(cacheKey, demoHist, 15)
    return demoHist
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
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })

  if (startDate) builder = builder.gte('created_at', startDate.toISOString())

  const localMatches = recentPool.filter((o) => {
    if (o.restaurant_id !== restaurantId) return false
    if (!startDate) return true
    return new Date(o.created_at) >= startDate
  })

  let succeeded = false
  const query = builder.then(({ data, error }) => {
    if (!error && data) {
      succeeded = true
      const enriched = data.map((dbOrder: any) => enrichOrderItemsFallback(dbOrder, recentPool))
      const dbIds = new Set(enriched.map((o: any) => o.id))
      const localOnly = localMatches.filter((m) => m._fallbackOnly && !dbIds.has(m.id))
      return [...localOnly, ...enriched].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }
    return localMatches
  })

  const result = await withTimeout(query, 8000, localMatches)
  if (succeeded) setCached(cacheKey, result, 15)
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
  if (isSampleRestaurantId(restaurantId)) {
    if (itemData.id) {
      const existing = SAMPLE_INVENTORY.find((i) => i.id === itemData.id)
      if (existing) {
        existing.name = itemData.name.trim()
        existing.quantity_available = Number(itemData.quantity_available)
        existing.unit = itemData.unit.trim()
        existing.min_stock = Number(itemData.min_stock)
      }
    } else {
      SAMPLE_INVENTORY.push({
        id: `inv-${Date.now()}`,
        name: itemData.name.trim(),
        quantity_available: Number(itemData.quantity_available),
        unit: itemData.unit.trim(),
        min_stock: Number(itemData.min_stock),
      })
    }
    invalidateCache('all_inventory')
    invalidateCache('critical_inventory')
    void emitRealtimeStoreEvent({ type: 'inventory_update', restaurantId })
    return
  }

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
  void emitRealtimeStoreEvent({ type: 'inventory_update', restaurantId })
}
