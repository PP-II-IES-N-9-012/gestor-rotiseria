'use client'

import { Clock, CheckCircle2, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getOrdersByStatus, updateOrderStatus } from '@/lib/api'

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadOrders = async () => {
    try {
      const data = await getOrdersByStatus(['pending', 'preparing', 'ready'])
      setOrders(data || [])
    } catch (error) {
      console.error("Error loading orders", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()

    // Subscribe to realtime changes in orders
    const subscription = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        // When there is a change, reload orders to get relationships as well
        loadOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

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
          <p className="text-gray-400 mt-1">Gestión de preparación de pedidos en tiempo real.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-6">
        
        {/* Column 1: Pendientes */}
        <div className="flex flex-col glass-panel rounded-2xl p-4">
          <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
            <h2 className="font-bold text-lg text-white">Pendientes</h2>
            <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full text-xs font-bold">
              {orders.filter(o => o.status === 'pending').length}
            </span>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {loading && <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-500" />}
            {orders.filter(o => o.status === 'pending').map(order => (
              <div key={order.id} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-lg font-outfit">#{order.id.slice(0,5).toUpperCase()}</span>
                  <div className="flex items-center text-gray-400 text-sm">
                    <Clock className="w-4 h-4 mr-1" /> {formatTime(order.created_at)}
                  </div>
                </div>
                <ul className="space-y-1 mb-3">
                  {order.order_items?.map((item: any, i: number) => (
                    <li key={i} className="text-gray-200 text-sm font-medium">
                      • {item.quantity}x {item.products?.name}
                    </li>
                  ))}
                </ul>
                {order.notes && (
                  <p className="text-xs text-amber-400 bg-amber-400/10 p-2 rounded mb-3">Nota: {order.notes}</p>
                )}
                <button 
                  onClick={() => handleUpdateStatus(order.id, 'preparing')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                >
                  Comenzar Preparación
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: En Preparación */}
        <div className="flex flex-col glass-panel rounded-2xl p-4">
          <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
            <h2 className="font-bold text-lg text-white">En Preparación</h2>
            <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs font-bold">
              {orders.filter(o => o.status === 'preparing').length}
            </span>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {orders.filter(o => o.status === 'preparing').map(order => (
              <div key={order.id} className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-xl shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-lg font-outfit">#{order.id.slice(0,5).toUpperCase()}</span>
                  <div className="flex items-center text-blue-400 text-sm animate-pulse">
                    <Clock className="w-4 h-4 mr-1" /> {formatTime(order.created_at)}
                  </div>
                </div>
                <ul className="space-y-1 mb-3">
                  {order.order_items?.map((item: any, i: number) => (
                    <li key={i} className="text-gray-200 text-sm font-medium">
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
          <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
            <h2 className="font-bold text-lg text-gray-400">Listos (Recientes)</h2>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {orders.filter(o => o.status === 'ready').map(order => (
               <div key={order.id} className="bg-emerald-900/10 border border-emerald-900/30 p-4 rounded-xl">
                 <div className="flex justify-between items-center">
                   <span className="text-gray-500 line-through">#{order.id.slice(0,5).toUpperCase()}</span>
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
