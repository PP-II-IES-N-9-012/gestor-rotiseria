'use client'

import {
  Clock,
  CheckCircle2,
  Loader2,
  Flame,
  ChefHat,
  Truck,
  Store,
  RefreshCw,
  Check,
  UtensilsCrossed,
  Volume2,
  VolumeX
} from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { getOrdersByStatus, updateOrderStatus, invalidateCache } from '@/lib/api'
import { subscribeToStoreRealtime } from '@/lib/realtime'
import { useAdminRestaurant } from '@/lib/AdminContext'

/**
 * Reproduce un timbre doble cálido de cocina mediante Web Audio API (sin archivos pesados externos).
 */
function playKitchenBell() {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    const playTone = (freq: number, startOffset: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + startOffset)
      gain.gain.setValueAtTime(0.001, now + startOffset)
      gain.gain.exponentialRampToValueAtTime(0.24, now + startOffset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + startOffset)
      osc.stop(now + startOffset + duration)
    }

    playTone(880, 0, 0.28)
    playTone(1174.66, 0.16, 0.42)
    setTimeout(() => {
      ctx.close().catch(() => { })
    }, 800)
  } catch {
    // El navegador puede bloquear audio hasta la primera interacción táctil
  }
}

export default function KitchenPage() {
  const restaurant = useAdminRestaurant()
  const restaurantId = restaurant?.id
  const primaryColor = restaurant?.primary_color || '#e59324'

  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
  const [statusError, setStatusError] = useState<string | null>(null)

  const soundEnabledRef = useRef(true)
  const knownOrderIdsRef = useRef<Set<string> | null>(null)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('comandapp_kds_sound')
      if (saved === 'off') {
        setSoundEnabled(false)
        soundEnabledRef.current = false
      }
    } catch { }
  }, [])

  const toggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    soundEnabledRef.current = next
    try {
      window.localStorage.setItem('comandapp_kds_sound', next ? 'on' : 'off')
    } catch { }
    if (next) {
      playKitchenBell()
    }
  }

  const loadOrders = useCallback(async (bustCache = false) => {
    try {
      if (bustCache) {
        invalidateCache('orders')
        invalidateCache('today_orders')
      }
      const data = await getOrdersByStatus(['pending', 'preparing', 'ready', 'completed'], restaurantId)
      const list = data || []

      // Detectar nuevas comandas pendientes para sonar campana incluso si llegó por polling
      const currentIds = new Set(list.map((o: any) => String(o.id)))
      if (knownOrderIdsRef.current !== null) {
        const hasBrandNewPending = list.some(
          (o: any) => o.status === 'pending' && !knownOrderIdsRef.current!.has(String(o.id))
        )
        if (hasBrandNewPending && soundEnabledRef.current) {
          playKitchenBell()
        }
      }
      knownOrderIdsRef.current = currentIds

      setOrders(list)
    } catch (error) {
      console.error('Error loading orders', error)
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    knownOrderIdsRef.current = null
    void loadOrders(false)

    let trailingTimer: ReturnType<typeof setTimeout> | null = null
    const unsubscribe = subscribeToStoreRealtime(restaurantId, (evt) => {
      if (evt.type === 'new_order') {
        if (soundEnabledRef.current) {
          playKitchenBell()
        }
        if (evt.orderId && knownOrderIdsRef.current) {
          knownOrderIdsRef.current.add(String(evt.orderId))
        }
      }
      if (evt.type === 'new_order' || evt.type === 'order_status') {
        void loadOrders(true)
        if (trailingTimer) clearTimeout(trailingTimer)
        trailingTimer = setTimeout(() => void loadOrders(true), 400)
      }
    })

    const pollInterval = setInterval(() => {
    void loadOrders(true)
  }, 6000)

  return () => {
    unsubscribe()
    clearInterval(pollInterval)
    if (trailingTimer) clearTimeout(trailingTimer)
  }
}, [restaurantId, loadOrders])

    const handleUpdateStatus = async (orderId: string, status: string) => {
      try {
        setStatusError(null)
        setUpdatingId(orderId)
        // Optimistic update instantáneo
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
        await updateOrderStatus(orderId, status, restaurantId)
      } catch (error) {
        console.error('Error updating order status', error)
        setStatusError('No se pudo actualizar el estado de la comanda. Intentá nuevamente.')
        void loadOrders(true)
      } finally {
        setUpdatingId(null)
      }
    }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getElapsedMinutes = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime()
    return Math.max(0, Math.floor(diff / 60000))
  }

  const renderDeliveryBadge = (deliveryType?: string) => {
    if (deliveryType === 'delivery') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
          <Truck className="w-3 h-3" /> Delivery
        </span>
      )
    }
    if (deliveryType === 'dine_in') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <UtensilsCrossed className="w-3 h-3" /> Salón / Mesa
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
        <Store className="w-3 h-3" /> Retiro en local
      </span>
    )
  }

  const formatShortOrderId = (id: string) => String(id || '').split('-')[0].toUpperCase()

  const pendingOrders = orders.filter((o) => o.status === 'pending')
  const preparingOrders = orders.filter((o) => o.status === 'preparing')
  const readyOrders = orders.filter((o) => o.status === 'ready')
  const completedOrders = orders.filter((o) => o.status === 'completed')

            return (
            <div className="min-h-[calc(100vh-8rem)] md:h-[calc(100vh-8rem)] flex flex-col space-y-4">
              {/* Top Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-6 h-6" style={{ color: primaryColor }} />
                    <h1 className="text-2xl sm:text-3xl font-bold font-rustic text-white">
                      Comandera de Cocina (KDS)
                    </h1>
                  </div>
                  <p className="text-xs text-[color:var(--store-text-muted)] mt-0.5">
                    Gestión táctil de comandas en vivo. Sincronización automática con aviso sonoro.
                  </p>
                </div>

                    < div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={toggleSound}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${soundEnabled
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        : 'text-[color:var(--store-text-muted)] border-[color:var(--store-border)] hover:text-white'
                      }`}
                  title={soundEnabled ? 'Campana activa (clic para silenciar)' : 'Campana silenciada (clic para activar y probar)'}
          >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{soundEnabled ? 'Campana Activa' : 'Silenciado'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCompleted(!showCompleted)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${showCompleted
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'text-[color:var(--store-text-muted)] border-[color:var(--store-border)] hover:text-white'
                    }`}
                >
                  {showCompleted ? 'Ocultar Entregados' : `Ver Entregados Hoy (${completedOrders.length})`}
                </button>

                <button
                  type="button"
                  onClick={() => void loadOrders(true)}
                  className="p-2 rounded-xl border border-[color:var(--store-border)] hover:bg-white/5 text-[color:var(--store-text-muted)] hover:text-white transition-colors"
                  title="Refrescar comandas"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {statusError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs">
                {statusError}
              </div>
            )}

                  {/* Main KDS Columns Grid */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 md:overflow-hidden">
                    {/* Column 1: Pendientes */}
                    <div className="flex flex-col glass-panel rounded-2xl p-4 shadow-xl md:overflow-hidden border-t-4 border-amber-500 min-h-[300px]">
                      <div className="flex justify-between items-center mb-3 pb-2 border-b border-[color:var(--store-border)]">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                          <h2 className="font-bold text-base text-white">1. Pendientes</h2>
                        </div>
                        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                          {pendingOrders.length}
                        </span>
                      </div>

                      <div className="space-y-3.5 flex-1 md:overflow-y-auto pr-1">
                        {loading && <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400" />}

                        {pendingOrders.length === 0 && !loading && (
                          <div className="h-full flex flex-col items-center justify-center text-center text-[color:var(--store-text-faint)] text-xs p-6">
                            <ChefHat className="w-8 h-8 mb-2 opacity-30" />
                            <p>Sin pedidos en espera</p>
                            <p className="text-[11px] mt-1 text-[color:var(--store-text-muted)]">
                              Nuevas órdenes ingresadas aparecerán aquí automáticamente.
                            </p>
                          </div>
                        )}

                                      {pendingOrders.map((order) => {
                                        const elapsed = getElapsedMinutes(order.created_at)
                                        return (
                                          <div
                                            key={order.id}
                                            className="p-4 rounded-xl shadow-md border bg-[color:var(--store-subtle-bg)] border-[color:var(--store-border)] flex flex-col justify-between transition-all hover:border-amber-500/50"
                                          >
                                            <div>
                                              <div className="flex justify-between items-start mb-2.5">
                                                <div>
                                                  <span className="font-bold text-base font-rustic text-white">
                                                    #{formatShortOrderId(order.id)}
                                                  </span>
                                                  <p className="text-[11px] text-[color:var(--store-text-muted)]">
                                                    {order.guest_name || 'Mostrador'}
                                                  </p>
                                                </div>
                                                <div className="text-right">
                                                  <span className="flex items-center text-amber-400 text-xs font-semibold">
                                                    <Clock className="w-3.5 h-3.5 mr-1" /> {formatTime(order.created_at)}
                                                  </span>
                                                  <span className="text-[10px] text-gray-400 font-mono">
                                                    Hace {elapsed} min
                                                  </span>
                                                </div>
                                              </div>

                                              <div className="mb-2.5">{renderDeliveryBadge(order.delivery_type)}</div>

                                              <ul className="space-y-1.5 mb-3 bg-black/20 p-2.5 rounded-lg border border-white/5">
                                                {order.order_items?.map((item: any, i: number) => (
                                                  <li key={i} className="text-white text-xs font-semibold flex justify-between">
                                                    <span>• {item.quantity}x {item.products?.name || 'Plato'}</span>
                                                  </li>
                                                ))}
                                              </ul>

                                              {order.notes && (
                                                <p className="text-xs p-2 rounded mb-3 border bg-amber-500/10 border-amber-500/30 text-amber-300 italic">
                                                  <strong>Nota:</strong> {order.notes}
                                                </p>
                    )}
                                          </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(order.id, 'preparing')}
                    disabled={updatingId === order.id}
                    className="w-full text-white font-bold py-2.5 rounded-xl text-xs transition-all hover:brightness-110 shadow-md flex items-center justify-center gap-2 active:scale-95"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {updatingId === order.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Flame className="w-4 h-4" />
                        <span>Comenzar Preparación</span>
                      </>
                    )}
                  </button>
                </div>
                                  )
            })}
                                </div>
                              </div>

                              {/* Column 2: En Preparación */}
                              <div className="flex flex-col glass-panel rounded-2xl p-4 shadow-xl md:overflow-hidden border-t-4 border-orange-500 min-h-[300px]">
                                <div className="flex justify-between items-center mb-3 pb-2 border-b border-[color:var(--store-border)]">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                                    <h2 className="font-bold text-base text-white">2. En Marcha / Fuego</h2>
                                  </div>
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border bg-orange-500/20 text-orange-400 border-orange-500/40">
                                    {preparingOrders.length}
                                  </span>
                                </div>

                              <div className="space-y-3.5 flex-1 md:overflow-y-auto pr-1">
                                {preparingOrders.length === 0 && (
                                  <div className="h-full flex flex-col items-center justify-center text-center text-[color:var(--store-text-faint)] text-xs p-6">
                                    <Flame className="w-8 h-8 mb-2 opacity-30 text-orange-400" />
                                    <p>El horno y hornallas están libres</p>
                                    <p className="text-[11px] mt-1 text-[color:var(--store-text-muted)]">
                                      Presiona &ldquo;Comenzar Preparación&rdquo; en los pendientes para marchar platos.
                                    </p>
                                  </div>
                                )}

                                  {preparingOrders.map((order) => {
                                    const elapsed = getElapsedMinutes(order.created_at)
                                    return (
                                      <div
                                        key={order.id}
                                        className="p-4 rounded-xl shadow-md border-l-4 border bg-[color:var(--store-subtle-bg)] border-[color:var(--store-border)] flex flex-col justify-between"
                                        style={{ borderLeftColor: primaryColor }}
                                      >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-bold text-base font-rustic text-white">
                              #{formatShortOrderId(order.id)}
                            </span>
                            <p className="text-[11px] text-[color:var(--store-text-muted)]">
                              {order.guest_name || 'Mostrador'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="flex items-center text-orange-400 text-xs font-bold animate-pulse">
                              <Flame className="w-3.5 h-3.5 mr-1" /> En fuego
                            </span>
                            <span className="text-[10px] text-orange-300 font-mono block">
                              {elapsed} min transcurridos
                            </span>
                          </div>
                        </div>

                              <div className="mb-2.5">{renderDeliveryBadge(order.delivery_type)}</div>

                              <ul className="space-y-1.5 mb-3 bg-black/20 p-2.5 rounded-lg border border-white/5">
                                {order.order_items?.map((item: any, i: number) => (
                                  <li key={i} className="text-white text-xs font-semibold flex justify-between">
                                    <span>• {item.quantity}x {item.products?.name || 'Plato'}</span>
                                  </li>
                                ))}
                              </ul>

                              {order.notes && (
                                <p className="text-xs p-2 rounded mb-3 border bg-amber-500/10 border-amber-500/30 text-amber-300 italic">
                                  <strong>Nota:</strong> {order.notes}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, 'ready')}
                              disabled={updatingId === order.id}
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex justify-center items-center gap-2 shadow-lg active:scale-95"
                            >
                              {updatingId === order.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Marcar Listo para Entrega</span>
                                </>
                              )}
                            </button>
                          </div>
                          )
            })}
                        </div>
                      </div>

                            {/* Column 3: Listos para Despacho */}
                            <div className="flex flex-col glass-panel rounded-2xl p-4 shadow-xl md:overflow-hidden border-t-4 border-emerald-500 min-h-[300px]">
                              <div className="flex justify-between items-center mb-3 pb-2 border-b border-[color:var(--store-border)]">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                  <h2 className="font-bold text-base text-white">3. ¡Platos Listos!</h2>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                  {readyOrders.length}
                                </span>
                              </div>

                                  <div className="space-y-3.5 flex-1 md:overflow-y-auto pr-1">
                                    {readyOrders.length === 0 && (
                                      <div className="h-full flex flex-col items-center justify-center text-center text-[color:var(--store-text-faint)] text-xs p-6">
                                        <CheckCircle2 className="w-8 h-8 mb-2 opacity-30 text-emerald-400" />
                                        <p>Sin pedidos esperando entrega</p>
                                        <p className="text-[11px] mt-1 text-[color:var(--store-text-muted)]">
                                          Los pedidos listos se entregan al comensal o repartidor aquí.
                                        </p>
                                      </div>
                                    )}

                                    {readyOrders.map((order) => (
                                      <div
                                        key={order.id}
                                        className="p-4 rounded-xl shadow-md border bg-emerald-950/20 border-emerald-500/30 flex flex-col justify-between"
                                      >
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                              <div>
                                                <span className="font-bold text-base font-rustic text-white">
                                                  #{formatShortOrderId(order.id)}
                                                </span>
                                                  <p className="text-[11px] text-emerald-200">
                                                    {order.guest_name || 'Mostrador'}
                                                  </p>
                                              </div>
                                              <span className="text-emerald-400 text-xs font-bold uppercase bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                                                Empaquetado
                                              </span>
                                            </div>

                                              <div className="mb-2.5">{renderDeliveryBadge(order.delivery_type)}</div>

                                              <ul className="space-y-1 mb-3 text-xs text-gray-200 bg-black/30 p-2.5 rounded-lg border border-white/5">
                                                {order.order_items?.map((item: any, i: number) => (
                                                    <li key={i} className="flex justify-between">
                                                      <span>• {item.quantity}x {item.products?.name || 'Plato'}</span>
                                                    </li>
                    ))}
                                                  </ul>

                  {order.guest_address && (
                    <p className="text-[11px] text-gray-300 mb-3">
                      <strong>Destino:</strong> {order.guest_address}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus(order.id, 'completed')}
                  disabled={updatingId === order.id}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#151210] font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  {updatingId === order.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Entregar Comanda (Completar)</span>
                    </>
                  )}
                </button>
              </div>
            ))}
                                          </div>
                                        </div>
                                      </div>

                                          {/* Completed Orders Drawer / Section */}
                                          {showCompleted && (
        <div className="glass-panel p-4 rounded-2xl border border-[color:var(--store-border)] animate-in fade-in max-h-48 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Comandas Entregadas en Esta Jornada ({completedOrders.length})
            </h3>
            <span className="text-[11px] text-[color:var(--store-text-muted)]">Archivadas con éxito</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {completedOrders.slice(0, 12).map((o) => (
              <div
                key={o.id}
                className="p-2 bg-[color:var(--store-subtle-bg)] rounded-xl border border-[color:var(--store-border)] text-xs flex justify-between items-center"
              >
                <div>
                  <span className="font-mono font-bold text-white">#{formatShortOrderId(o.id)}</span>
                  <span className="text-[10px] text-gray-400 block truncate max-w-[120px]">
                    {o.guest_name || 'Mostrador'}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">Entregado</span>
              </div>
            ))}
          </div>
        </div>
                                          )}
                                        </div>
  )
}
