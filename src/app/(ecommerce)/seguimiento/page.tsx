'use client'

import { useState } from 'react'
import { Search, MapPin, Clock, PackageCheck, Loader2 } from 'lucide-react'
import { getOrderById } from '@/lib/api'

export default function TrackingPage() {
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderId.trim()) return

    setLoading(true)
    setError('')
    setOrder(null)

    try {
      const data = await getOrderById(orderId.trim())
      if (data) {
        setOrder(data)
      } else {
        setError('No se encontró ningún pedido con ese código.')
      }
    } catch (err) {
      console.error(err)
      setError('Código inválido o pedido no encontrado.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return { text: 'Recibido', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/20' }
      case 'preparing': return { text: 'En Preparación', icon: MapPin, color: 'text-blue-400', bg: 'bg-blue-400/20' }
      case 'ready': return { text: 'Listo para Entregar', icon: PackageCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/20' }
      case 'completed': return { text: 'Completado', icon: PackageCheck, color: 'text-gray-400', bg: 'bg-gray-400/20' }
      default: return { text: 'Desconocido', icon: Clock, color: 'text-gray-400', bg: 'bg-gray-400/20' }
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 min-h-[70vh]">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-bold font-outfit mb-4 text-white">Rastrea tu <span className="text-red-500">Pedido</span></h1>
        <p className="text-gray-400">Ingresa el código que te proporcionamos al finalizar tu compra.</p>
      </div>

      <form onSubmit={handleSearch} className="relative max-w-xl mx-auto mb-12 group">
        <input 
          type="text" 
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Ej: f47ac10b-58cc-4372-a567-0e02b2c3d479" 
          className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-6 pr-32 py-4 text-lg focus:outline-none focus:border-red-500 transition-colors shadow-lg"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="absolute right-2 top-2 bottom-2 bg-red-600 hover:bg-red-500 text-white font-medium px-6 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
        </button>
      </form>

      {error && (
        <div className="text-center text-red-400 bg-red-400/10 py-4 rounded-xl max-w-xl mx-auto">
          {error}
        </div>
      )}

      {order && (
        <div className="glass-panel p-8 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-8 border-b border-white/10 gap-4">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Pedido</p>
              <p className="font-outfit font-bold text-xl">#{order.id.split('-')[0].toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm font-medium mb-1">Total</p>
              <p className="text-red-400 font-bold text-xl">${order.total_amount}</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-bold mb-4 font-outfit text-lg">Estado Actual</h3>
            
            <div className="relative">
               {/* Timeline line */}
               <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-700"></div>

               <div className="space-y-8 relative">
                 {['pending', 'preparing', 'ready'].map((stepStatus, idx) => {
                   const isActive = order.status === stepStatus || 
                                    (order.status === 'ready' && idx < 2) || 
                                    (order.status === 'preparing' && idx === 0)
                   
                   const isCurrent = order.status === stepStatus
                   const statusInfo = getStatusDisplay(stepStatus)

                   return (
                     <div key={stepStatus} className={`flex items-center gap-4 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                       <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-colors duration-500 ${isActive ? statusInfo.bg : 'bg-slate-800'}`}>
                         <statusInfo.icon className={`w-5 h-5 ${isActive ? statusInfo.color : 'text-gray-500'}`} />
                       </div>
                       <div>
                         <h4 className={`font-bold ${isCurrent ? 'text-white text-lg' : 'text-gray-300'}`}>
                           {statusInfo.text}
                         </h4>
                         {isCurrent && <p className="text-sm text-gray-400 mt-1">Tu pedido se encuentra en esta etapa actualmente.</p>}
                       </div>
                     </div>
                   )
                 })}
               </div>
            </div>
          </div>

          <div className="bg-slate-800/30 rounded-2xl p-6">
            <h3 className="font-bold mb-4 font-outfit">Resumen de Productos</h3>
            <ul className="space-y-3">
              {order.order_items?.map((item: any) => (
                <li key={item.product_id} className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">
                    <span className="text-white font-medium mr-2">{item.quantity}x</span> 
                    {item.products?.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
