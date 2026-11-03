import { supabase } from './supabase'

export interface RealtimeStoreEvent {
  type: 'new_order' | 'order_status' | 'inventory_update' | 'store_config_update' | 'product_update'
  restaurantId?: string
  orderId?: string
  totalAmount?: number
  guestName?: string
  status?: string
  timestamp: number
}

const BROADCAST_TOPIC = 'comandapp-live-sync'
const LOCAL_CHANNEL_NAME = 'comandapp_live_sync'
const DEMO_RESTAURANT_UUID = '00000000-0000-0000-0000-000000000000'

export function isLocalOnlyRestaurantId(id?: string | null): boolean {
  if (!id) return false
  return id === DEMO_RESTAURANT_UUID || id.startsWith('sample-') || id.startsWith('preview-')
}

type StoreEventHandler = (event: RealtimeStoreEvent) => void

let sharedBroadcastChannel: ReturnType<typeof supabase.channel> | null = null
let sharedBroadcastStatus = false
let teardownTimer: ReturnType<typeof setTimeout> | null = null
const broadcastListeners = new Set<StoreEventHandler>()
const statusListeners = new Set<(connected: boolean) => void>()

function ensureSharedBroadcastChannel() {
  if (teardownTimer) {
    clearTimeout(teardownTimer)
    teardownTimer = null
  }

  if (sharedBroadcastChannel) {
    return sharedBroadcastChannel
  }

  const ch = supabase.channel(BROADCAST_TOPIC, {
    config: {
      broadcast: { self: true }
    }
  })

  ch.on('broadcast', { event: 'store_event' }, ({ payload }) => {
    if (!payload) return
    const evt = payload as RealtimeStoreEvent
    broadcastListeners.forEach((fn) => {
      try {
        fn(evt)
      } catch (err) {
        console.warn('Error handling realtime broadcast event:', err)
      }
    })
  }).subscribe((status) => {
    sharedBroadcastStatus = status === 'SUBSCRIBED'
    statusListeners.forEach((fn) => fn(sharedBroadcastStatus))
  })

  sharedBroadcastChannel = ch
  return ch
}

function scheduleSharedTeardownIfIdle() {
  if (broadcastListeners.size > 0) return
  if (teardownTimer) clearTimeout(teardownTimer)

  teardownTimer = setTimeout(() => {
    if (broadcastListeners.size === 0 && sharedBroadcastChannel) {
      const ch = sharedBroadcastChannel
      sharedBroadcastChannel = null
      sharedBroadcastStatus = false
      supabase.removeChannel(ch).catch(() => { })
    }
  }, 800)
}

/**
 * Emite un evento en tiempo real a través de:
 * 1) BroadcastChannel del navegador (latencia 0ms entre pestañas locales incluso offline o en Modo Demo)
 * 2) Supabase Realtime Broadcast (WebSocket / REST para múltiples dispositivos en comercios reales)
 */
export async function emitRealtimeStoreEvent(
  event: Omit<RealtimeStoreEvent, 'timestamp'>
): Promise<void> {
  const fullEvent: RealtimeStoreEvent = {
    ...event,
    timestamp: Date.now()
  }

  // 1. Sincronización inmediata entre pestañas locales (0ms)
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const bc = new BroadcastChannel(LOCAL_CHANNEL_NAME)
      bc.postMessage(fullEvent)
      bc.close()
    } catch {
      // Ignore BroadcastChannel errors
    }
  }

  // Si es un restaurante demo/simulado, no abrir llamadas de red a Supabase
  if (isLocalOnlyRestaurantId(event.restaurantId)) {
    return
  }

  // 2. Sincronización por Supabase Realtime (WebSocket / Broadcast)
  try {
    if (sharedBroadcastChannel) {
      await sharedBroadcastChannel.httpSend('store_event', fullEvent, { timeout: 2500 })
    } else {
      const existing = supabase
        .getChannels()
        .find((c) => c.topic === `realtime:${BROADCAST_TOPIC}`)

      if (existing) {
        await existing.httpSend('store_event', fullEvent, { timeout: 2500 })
      } else {
        const tempCh = supabase.channel(BROADCAST_TOPIC)
        try {
          await tempCh.httpSend('store_event', fullEvent, { timeout: 2500 })
        } finally {
          if (!tempCh.joinedOnce) {
            await supabase.removeChannel(tempCh).catch(() => { })
          }
        }
      }
    }
  } catch (err) {
    console.warn('Realtime broadcast emit fallback:', err)
  }
}

/**
 * Suscribe un componente (ej. Gerencia, Cocina, Inventario o Seguimiento) a eventos en tiempo real:
 * - Supabase Postgres Changes (`orders`, `order_items`, `inventory_items`) para tiendas reales
 * - Supabase Realtime Broadcast (`comandapp-live-sync`)
 * - BroadcastChannel local entre pestañas (instantáneo en tiendas reales y Modo Demo)
 */
export function subscribeToStoreRealtime(
  restaurantId: string | undefined,
  onEvent: StoreEventHandler,
  onConnectionChange?: (connected: boolean) => void
): () => void {
  let active = true
  let pgConnected = false
  const localOnly = isLocalOnlyRestaurantId(restaurantId)
  const seenSignatures = new Map<string, number>()

  const updateConnectionStatus = () => {
    if (!active || !onConnectionChange) return
    if (localOnly) {
      onConnectionChange(true)
      return
    }
    onConnectionChange(pgConnected || sharedBroadcastStatus)
  }

  const forwardIfRelevant = (evt: RealtimeStoreEvent) => {
    if (!active) return
    if (restaurantId && evt.restaurantId && evt.restaurantId !== restaurantId) {
      return
    }

    // Deduplicación suave para evitar disparar doble notificación cuando llegan
    // simultáneamente postgres_changes y broadcast para la misma orden
    const sig = evt.orderId
      ? `${evt.type}:${evt.orderId}:${evt.status || ''}`
      : `${evt.type}:${Math.floor(evt.timestamp / 400)}`
    const now = Date.now()
    const prev = seenSignatures.get(sig)
    if (prev && now - prev < 1500) {
      return
    }
    seenSignatures.set(sig, now)

    if (seenSignatures.size > 100) {
      for (const [k, ts] of Array.from(seenSignatures.entries())) {
        if (now - ts > 10000) seenSignatures.delete(k)
      }
    }

    onEvent(evt)
  }

  // Canal local entre pestañas del navegador (siempre activo)
  let localBc: BroadcastChannel | null = null
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      localBc = new BroadcastChannel(LOCAL_CHANNEL_NAME)
      localBc.onmessage = (msg) => {
        if (msg?.data) {
          forwardIfRelevant(msg.data as RealtimeStoreEvent)
        }
      }
    } catch {
      localBc = null
    }
  }

  // En modo demo/simulador evitamos abrir canales WebSocket hacia Supabase Cloud
  if (localOnly) {
    updateConnectionStatus()
    return () => {
      active = false
      if (localBc) {
        try {
          localBc.close()
        } catch {
          // Ignore close errors
        }
      }
    }
  }

  // 1. Canal WebSocket de Supabase Postgres Changes (instancia única por montaje)
  const uid = Math.random().toString(36).slice(2, 9)
  const pgChannel = supabase
    .channel(`store-pg-${restaurantId || 'all'}-${uid}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        ...(restaurantId ? { filter: `restaurant_id=eq.${restaurantId}` } : {})
      },
      (payload) => {
        const record = (payload.new || payload.old || {}) as Record<string, unknown>
        if (payload.eventType === 'INSERT') {
          forwardIfRelevant({
            type: 'new_order',
            restaurantId: typeof record.restaurant_id === 'string' ? record.restaurant_id : undefined,
            orderId: typeof record.id === 'string' ? record.id : undefined,
            totalAmount: Number(record.total_amount || 0),
            guestName: typeof record.guest_name === 'string' ? record.guest_name : undefined,
            status: typeof record.status === 'string' ? record.status : undefined,
            timestamp: Date.now()
          })
        } else {
          forwardIfRelevant({
            type: 'order_status',
            restaurantId: typeof record.restaurant_id === 'string' ? record.restaurant_id : undefined,
            orderId: typeof record.id === 'string' ? record.id : undefined,
            status: typeof record.status === 'string' ? record.status : undefined,
            timestamp: Date.now()
          })
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'order_items'
      },
      (payload) => {
        const record = (payload.new || {}) as Record<string, unknown>
        forwardIfRelevant({
          type: 'order_status',
          orderId: typeof record.order_id === 'string' ? record.order_id : undefined,
          status: 'items_synced',
          timestamp: Date.now()
        })
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'inventory_items',
        ...(restaurantId ? { filter: `restaurant_id=eq.${restaurantId}` } : {})
      },
      (payload) => {
        const record = (payload.new || payload.old || {}) as Record<string, unknown>
        forwardIfRelevant({
          type: 'inventory_update',
          restaurantId: typeof record.restaurant_id === 'string' ? record.restaurant_id : undefined,
          timestamp: Date.now()
        })
      }
    )
    .subscribe((status) => {
      pgConnected = status === 'SUBSCRIBED'
      updateConnectionStatus()
    })

  // 2. Canal WebSocket compartido de Supabase Broadcast
  const handleBroadcast: StoreEventHandler = (evt) => forwardIfRelevant(evt)
  const handleBroadcastStatus = () => updateConnectionStatus()

  broadcastListeners.add(handleBroadcast)
  statusListeners.add(handleBroadcastStatus)
  ensureSharedBroadcastChannel()
  updateConnectionStatus()

  return () => {
    active = false
    supabase.removeChannel(pgChannel).catch(() => { })
    broadcastListeners.delete(handleBroadcast)
    statusListeners.delete(handleBroadcastStatus)
    scheduleSharedTeardownIfIdle()
    if (localBc) {
      try {
        localBc.close()
      } catch {
        // Ignore close errors
      }
    }
  }
}
