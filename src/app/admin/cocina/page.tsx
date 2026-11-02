'use client'

import { Clock, CheckCircle2, Loader2, Flame, ChefHat, Truck, Store, ArrowRight, RefreshCw, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getOrdersByStatus, updateOrderStatus, invalidateCache } from '@/lib/api'
import { useAdminRestaurant } from '@/lib/AdminContext'

export default function KitchenPage() {
  const restaurant = useAdminRestaurant()
  const restaurantId = restaurant?.id
  const primaryColor = restaurant?.primary_color || '#e59324'

  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadOrders = async () => {
    try {
      invalidateCache('orders')
      const data = await getOrdersByStatus(['pending', 'preparing', 'ready', 'completed'], restaurantId)
      setOrders(data || [])
    } catch (error) {
      console.error("Error loading orders", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()

    // Subscribe to realtime changes in orders (only this restaurant's)
    const subscription = supabase
      .channel(`kitchen-orders-${restaurantId || 'all'}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        ...(restaurantId ? { filter: `restaurant_id=eq.${restaurantId}` } : {})
      }, () => {
        loadOrders()
      })
      .subscribe()

    // Respaldo de sincronización periódica cada 5s por si Realtime no está activo en la tabla
    const pollInterval = setInterval(() => {
      loadOrders()
    }, 5000)

    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(subscription)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId])

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      setUpdatingId(orderId)
      await updateOrderStatus(orderId, status)
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    } catch (error) {
      console.error("Error updating order status", error)
      alert("No se pudo actualizar el estado de la comanda.")
    } finally {
      setUpdatingId(null)
    }
  }

  // Format time (HH:MM) from ISO string
  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Elapsed minutes since order creation
  const getElapsedMinutes = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime()
    return Math.max(0, Math.floor(diff / 60000))
  }

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const preparingOrders = orders.filter(o => o.status === 'preparing')
  const readyOrders = orders.filter(o => o.status === 'ready')
  const completedOrders = orders.filter(o => o.status === 'completed')

  return (
        <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">

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
                Gestión táctil de comandas en vivo. Sincronización automática sin recargar pantalla.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${showCompleted
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'text-[color:var(--store-text-muted)] border-[color:var(--store-border)] hover:text-white'
                  }`}
              >
                {showCompleted ? 'Ocultar Entregados' : `Ver Entregados Hoy (${completedOrders.length})`}
              </button>

              <button
                onClick={loadOrders}
                className="p-2 rounded-xl border border-[color:var(--store-border)] hover:bg-white/5 text-[color:var(--store-text-muted)] hover:text-white transition-colors"
                title="Refrescar comandas"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

            {/* Main KDS Columns Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 overflow-hidden">

              {/* Column 1: Pendientes */}
                    <div className="flex flex-col glass-panel rounded-2xl p-4 shadow-xl overflow-hidden border-t-4 border-amber-500">
                      <div className="flex justify-between items-center mb-3 pb-2 border-b border-[color:var(--store-border)]">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                          <h2 className="font-bold text-base text-white">1. Pendientes</h2>
                        </div>
                        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                          {pendingOrders.length}
                        </span>
                      </div>

                                <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
                                  {loading && <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400" />}

                                  {pendingOrders.length === 0 && !loading && (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-[color:var(--store-text-faint)] text-xs p-6">
                                      <ChefHat className="w-8 h-8 mb-2 opacity-30" />
                                      <p>Sin pedidos en espera</p>
                                      <p className="text-[11px] mt-1 text-[color:var(--store-text-muted)]">Nuevas órdenes ingresadas aparecerán aquí automáticamente.</p>
                                    </div>
                                  )}

                                  {pendingOrders.map(order => {
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
                          #{order.id.slice(0, 5).toUpperCase()}
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

                    {/* Delivery type badge */}
                    <div className="mb-2.5">
                      {order.delivery_type === 'delivery' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                          <Truck className="w-3 h-3" /> Delivery
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                          <Store className="w-3 h-3" /> Retiro en local
                        </span>
                      )}
                    </div>

                    {/* Platos */}
                    <ul className="space-y-1.5 mb-3 bg-black/20 p-2.5 rounded-lg border border-white/5">
                      {order.order_items?.map((item: any, i: number) => (
                        <li key={i} className="text-white text-xs font-semibold flex justify-between">
                          <span>• {item.quantity}x {item.products?.name || 'Plato'}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Notes */}
                    {order.notes && (
                      <p className="text-xs p-2 rounded mb-3 border bg-amber-500/10 border-amber-500/30 text-amber-300 italic">
                        <strong>Nota:</strong> {order.notes}
                      </p>
                    )}
                  </div>

                  <button 
                    onClick={() => handleUpdateStatus(order.id, 'preparing')}
                    disabled={updatingId === order.id}
                    className="w-full text-white font-bold py-2.5 rounded-xl text-xs transition-all hover:brightness-110 shadow-md flex items-center justify-center gap-2"
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
                                  <div className="flex flex-col glass-panel rounded-2xl p-4 shadow-xl overflow-hidden border-t-4 border-orange-500">
                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-[color:var(--store-border)]">
                                      <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                                        <h2 className="font-bold text-base text-white">2. En Marcha / Fuego</h2>
                                      </div>
                                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border bg-orange-500/20 text-orange-400 border-orange-500/40">
                                        {preparingOrders.length}
                                      </span>
                                    </div>

                                        <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
                                          {preparingOrders.length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center text-center text-[color:var(--store-text-faint)] text-xs p-6">
                                              <Flame className="w-8 h-8 mb-2 opacity-30 text-orange-400" />
                                              <p>El horno y hornallas están libres</p>
                                              <p className="text-[11px] mt-1 text-[color:var(--store-text-muted)]">Presiona &ldquo;Comenzar Preparación&rdquo; en los pendientes para marchar platos.</p>
                                            </div>
                                          )}

                                          {preparingOrders.map(order => {
                                            const elapsed = getElapsedMinutes(order.created_at)
                                            return (
                                              <div
                                                key={order.id}
                                                className="p-4 rounded-xl shadow-md border-l-4 border bg-[color:var(--store-subtle-bg)] border-[color:var(--store-border)] flex flex-col justify-between"
                                                style={{ borderLeftColor: primaryColor }}
                                              >
                                                <div>
                                                  <div className="flex justify-between items-start mb-2.5">
                                                    <div>
                                                      <span className="font-bold text-base font-rustic text-white">
                                                        #{order.id.slice(0, 5).toUpperCase()}
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

                                                  {/* Platos */}
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
                                                  onClick={() => handleUpdateStatus(order.id, 'ready')}
                                                  disabled={updatingId === order.id}
                                                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex justify-center items-center gap-2 shadow-lg"
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
                                    <div className="flex flex-col glass-panel rounded-2xl p-4 shadow-xl overflow-hidden border-t-4 border-emerald-500">
                                      <div className="flex justify-between items-center mb-3 pb-2 border-b border-[color:var(--store-border)]">
                                        <div className="flex items-center gap-2">
                                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                          <h2 className="font-bold text-base text-white">3. ¡Platos Listos!</h2>
                                        </div>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                          {readyOrders.length}
                                        </span>
                                      </div>

                                      <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
                                        {readyOrders.length === 0 && (
                                          <div className="h-full flex flex-col items-center justify-center text-center text-[color:var(--store-text-faint)] text-xs p-6">
                                            <CheckCircle2 className="w-8 h-8 mb-2 opacity-30 text-emerald-400" />
                                            <p>Sin pedidos esperando entrega</p>
                                            <p className="text-[11px] mt-1 text-[color:var(--store-text-muted)]">Los pedidos listos se entregan al comensal o repartidor aquí.</p>
                                          </div>
                                        )}

                                        {readyOrders.map(order => (
                                          <div
                                            key={order.id}
                                            className="p-4 rounded-xl shadow-md border bg-emerald-950/20 border-emerald-500/30 flex flex-col justify-between"
                                          >
                                                <div>
                                                  <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                      <span className="font-bold text-base font-rustic text-white">
                                                        #{order.id.slice(0, 5).toUpperCase()}
                                                      </span>
                                                      <p className="text-[11px] text-emerald-200">
                                                        {order.guest_name || 'Mostrador'}
                                                      </p>
                                                    </div>
                                                    <span className="text-emerald-400 text-xs font-bold uppercase bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                                                      Empaquetado
                                                    </span>
                                                  </div>

                                                  {/* Detalle para verificar antes de entregar */}
                                                  <ul className="space-y-1 mb-3 text-xs text-gray-200 bg-black/30 p-2.5 rounded-lg border border-white/5">
                                                    {order.order_items?.map((item: any, i: number) => (
                                                      <li key={i} className="flex justify-between">
                                                        <span>• {item.quantity}x {item.products?.name}</span>
                                                      </li>
                                                    ))}
                                                  </ul>

                                                  {order.guest_address && (
                                                    <p className="text-[11px] text-gray-300 mb-3">
                                                      <strong>Destino:</strong> {order.guest_address}
                                                    </p>
                                                  )}
                                                </div>

                                                  {/* BOTÓN FUNCIONAL: Entregar / Completar Pedido */}
                <button
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

      {/* Completed Orders Drawer / Section */ }
      { showCompleted && (
                                            <div className="glass-panel p-4 rounded-2xl border border-[color:var(--store-border)] animate-in fade-in max-h-48 overflow-y-auto">
                                              <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                                                  Comandas Entregadas en Esta Jornada ({completedOrders.length})
                                                </h3>
                                                <span className="text-[11px] text-[color:var(--store-text-muted)]">Archivadas con éxito</span>
                                              </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {completedOrders.slice(0, 8).map(o => (
              <div key={o.id} className="p-2 bg-[color:var(--store-subtle-bg)] rounded-xl border border-[color:var(--store-border)] text-xs flex justify-between items-center">
                <div>
                  <span className="font-mono font-bold text-white">#{o.id.slice(0, 5).toUpperCase()}</span>
                  <span className="text-[10px] text-gray-400 block truncate max-w-[120px]">{o.guest_name || 'Mostrador'}</span>
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
