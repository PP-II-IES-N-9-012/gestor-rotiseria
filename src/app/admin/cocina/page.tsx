'use client'

import { Clock, CheckCircle2, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getOrdersByStatus, updateOrderStatus } from '@/lib/api'
import { useAdminRestaurant } from '@/lib/AdminContext'

export default function KitchenPage() {
  const restaurant = useAdminRestaurant()
  const restaurantId = restaurant?.id
  const primaryColor = restaurant?.primary_color || '#e59324'
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadOrders = async () => {
    try {
      const data = await getOrdersByStatus(['pending', 'preparing', 'ready'], restaurantId)
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
        // When there is a change, reload orders to get relationships as well
        loadOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId])

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status)
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    } catch (error) {
      console.error("Error updating order status", error)
      alert("No se pudo actualizar el estado.")
    }
  }

  // Format time (HH:MM) from ISO string
  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-white">Comandas - Cocina</h1>
          <p className="text-[color:var(--store-text-muted)] mt-1">Gestión de preparación de pedidos en tiempo real.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-6">
        
        {/* Column 1: Pendientes */}
        <div className="flex flex-col glass-panel rounded-2xl p-4">
          <div className="flex justify-between items-center mb-4 border-b border-[color:var(--store-border)] pb-2">
            <h2 className="font-bold text-lg text-white">Pendientes</h2>
            <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full text-xs font-bold">
              {orders.filter(o => o.status === 'pending').length}
            </span>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {loading && <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: primaryColor }} />}
            {orders.filter(o => o.status === 'pending').map(order => (
              <div 
                key={order.id} 
                className="p-4 rounded-xl shadow-md border"
                style={{
                  backgroundColor: 'var(--store-subtle-bg, rgba(30, 41, 59, 0.8))',
                  borderColor: 'var(--store-border, #334155)'
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-lg font-outfit text-white">#{order.id.slice(0,5).toUpperCase()}</span>
                  <div className="flex items-center text-[color:var(--store-text-muted)] text-sm">
                    <Clock className="w-4 h-4 mr-1" /> {formatTime(order.created_at)}
                  </div>
                </div>
                <ul className="space-y-1 mb-3">
                  {order.order_items?.map((item: any, i: number) => (
                    <li key={i} className="text-[color:var(--store-text-soft)] text-sm font-medium">
                      • {item.quantity}x {item.products?.name}
                    </li>
                  ))}
                </ul>
                {order.notes && (
                  <p 
                    className="text-xs p-2 rounded mb-3 border"
                    style={{
                      backgroundColor: `${primaryColor}15`,
                      borderColor: `${primaryColor}30`,
                      color: primaryColor
                    }}
                  >
                    Nota: {order.notes}
                  </p>
                )}
                <button 
                  onClick={() => handleUpdateStatus(order.id, 'preparing')}
                  className="w-full text-white font-medium py-2 rounded-lg text-sm transition-all hover:brightness-110 shadow-md"
                  style={{ backgroundColor: primaryColor }}
                >
                  Comenzar Preparación
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: En Preparación */}
        <div className="flex flex-col glass-panel rounded-2xl p-4">
          <div className="flex justify-between items-center mb-4 border-b border-[color:var(--store-border)] pb-2">
            <h2 className="font-bold text-lg text-white">En Preparación</h2>
            <span 
              className="px-2 py-0.5 rounded-full text-xs font-bold border"
              style={{
                backgroundColor: `${primaryColor}20`,
                borderColor: `${primaryColor}40`,
                color: primaryColor
              }}
            >
              {orders.filter(o => o.status === 'preparing').length}
            </span>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {orders.filter(o => o.status === 'preparing').map(order => (
              <div 
                key={order.id} 
                className="border-l-4 p-4 rounded-xl shadow-md border"
                style={{
                  backgroundColor: 'var(--store-subtle-bg, rgba(30, 41, 59, 0.8))',
                  borderLeftColor: primaryColor,
                  borderColor: `color-mix(in srgb, ${primaryColor} 25%, var(--store-border, #334155))`
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-lg font-outfit text-white">#{order.id.slice(0,5).toUpperCase()}</span>
                  <div className="flex items-center text-sm animate-pulse" style={{ color: primaryColor }}>
                    <Clock className="w-4 h-4 mr-1" /> {formatTime(order.created_at)}
                  </div>
                </div>
                <ul className="space-y-1 mb-3">
                  {order.order_items?.map((item: any, i: number) => (
                    <li key={i} className="text-[color:var(--store-text-soft)] text-sm font-medium">
                      • {item.quantity}x {item.products?.name}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => handleUpdateStatus(order.id, 'ready')}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg text-sm transition-colors flex justify-center items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Marcar Listo
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Listos */}
        <div className="flex flex-col glass-panel rounded-2xl p-4 opacity-70">
          <div className="flex justify-between items-center mb-4 border-b border-[color:var(--store-border)] pb-2">
            <h2 className="font-bold text-lg text-[color:var(--store-text-muted)]">Listos (Recientes)</h2>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {orders.filter(o => o.status === 'ready').map(order => (
               <div 
                 key={order.id} 
                 className="border p-4 rounded-xl"
                 style={{
                   backgroundColor: 'var(--store-subtle-bg, rgba(6, 78, 59, 0.1))',
                   borderColor: 'var(--store-border, rgba(6, 78, 59, 0.3))'
                 }}
               >
                 <div className="flex justify-between items-center">
                   <span className="text-[color:var(--store-text-faint)] line-through">#{order.id.slice(0,5).toUpperCase()}</span>
                   <span className="text-emerald-500 text-xs font-bold uppercase">Listo</span>
                 </div>
               </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
