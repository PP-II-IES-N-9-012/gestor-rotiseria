'use client'

import { useState } from 'react'
import { Search, Flame, Clock, CheckCircle2, Utensils, ChefHat, Loader2, Sparkles } from 'lucide-react'
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
        setError('No se encontró ningún pedido con ese código en el sistema.')
      }
    } catch (err) {
      console.error(err)
      setError('Código no encontrado o error de conexión. Verifica el código de tu pedido.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': 
        return { 
          text: 'Comanda Recibida', 
          desc: 'Tu pedido está anotado y esperando entrar a la cocina.',
          icon: Clock, 
          color: 'text-amber-400', 
          bg: 'bg-amber-400/20' 
        }
      case 'preparing': 
        return { 
          text: 'Marchando en el Fuego', 
          desc: 'Los cocineros están preparando tus platos en este momento.',
          icon: Flame, 
          color: 'text-orange-400', 
          bg: 'bg-orange-500/20' 
        }
      case 'ready': 
        return { 
          text: '¡Platos Listos!', 
          desc: 'Tu pedido está empaquetado, calentito y listo para entregar o despachar.',
          icon: ChefHat, 
          color: 'text-emerald-400', 
          bg: 'bg-emerald-500/20' 
        }
      case 'completed': 
        return { 
          text: 'Entregado', 
          desc: '¡Buen provecho! Gracias por apoyar la cocina de barrio.',
          icon: CheckCircle2, 
          color: 'text-emerald-300', 
          bg: 'bg-emerald-500/20' 
        }
      default: 
        return { 
          text: 'En Proceso', 
          desc: 'Gestionando tu pedido...',
          icon: Clock, 
          color: 'text-gray-400', 
          bg: 'bg-gray-800' 
        }
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 min-h-[75vh]">
      
      {/* Header */}
      <div className="text-center mb-10">
        <div className="badge-rustic mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#e59324]" />
          <span>Cocina en Vivo</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold font-rustic mb-4 text-[#fcf9f5]">
          Sigue el Estado de tu <span className="text-[#e59324]">Comanda</span>
        </h1>
        <p className="text-[#bfa38c] max-w-md mx-auto text-sm leading-relaxed">
          Ingresa el código identificador que recibiste al confirmar tu pedido para ver en qué etapa está en la cocina.
        </p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative max-w-xl mx-auto mb-10 group">
        <input 
          type="text" 
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Pega aquí el código del pedido (ej: b326adf8...)" 
          className="w-full bg-[#1e1713] border border-[#44352a] rounded-2xl pl-6 pr-32 py-4 text-sm md:text-base text-white placeholder-[#7d6553] focus:outline-none focus:border-[#e59324] transition-all shadow-xl"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="absolute right-2 top-2 bottom-2 btn-amber px-6 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#151210]" />
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Consultar</span>
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="text-center text-red-300 bg-red-950/40 border border-red-900/60 py-4 px-6 rounded-2xl max-w-xl mx-auto mb-8 text-sm">
          {error}
        </div>
      )}

      {/* Order Status Result */}
      {order && (
        <div className="bg-[#1f1712] border border-[#4d3a2b] p-8 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-6 border-b border-[#382b21] gap-4">
            <div>
              <p className="text-[#8c6f59] text-xs font-semibold uppercase tracking-wider mb-1">Número de Comanda</p>
              <p className="font-rustic font-bold text-2xl text-white">#{order.id.split('-')[0].toUpperCase()}</p>
              {order.guest_name && (
                <p className="text-xs text-[#bfa38c] mt-0.5">Cliente: {order.guest_name}</p>
              )}
            </div>
            
            <div className="text-left sm:text-right">
              <p className="text-[#8c6f59] text-xs font-semibold uppercase tracking-wider mb-1">Total del Pedido</p>
              <p className="text-[#e59324] font-rustic font-bold text-2xl">${Number(order.total_amount).toLocaleString()}</p>
              <span className="text-[11px] text-[#a88a70]">
                {order.delivery_type === 'delivery' ? '🛵 Envío a domicilio' : '🏪 Retiro en local'}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-10">
            <h3 className="font-rustic font-bold text-lg text-white mb-6">Etapa de Cocina</h3>
            
            <div className="relative pl-2">
              {/* Timeline line */}
              <div className="absolute left-7 top-6 bottom-6 w-0.5 bg-[#382b21]"></div>

              <div className="space-y-8 relative">
                {['pending', 'preparing', 'ready', 'completed'].map((stepStatus, idx) => {
                  const stepIndex = ['pending', 'preparing', 'ready', 'completed'].indexOf(order.status)
                  const isActive = stepIndex >= idx
                  const isCurrent = order.status === stepStatus
                  const statusInfo = getStatusDisplay(stepStatus)

                  return (
                    <div key={stepStatus} className={`flex items-start gap-4 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-35'}`}>
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center z-10 transition-all duration-500 shadow-md ${
                        isCurrent 
                          ? 'bg-[#e59324] text-[#151210] ring-4 ring-[#e59324]/20 scale-110' 
                          : isActive 
                            ? 'bg-[#3b2419] text-[#e59324] border border-[#e59324]/40' 
                            : 'bg-[#241a14] text-[#7a6452] border border-[#382b21]'
                      }`}>
                        <statusInfo.icon className="w-5 h-5" />
                      </div>

                      <div className="pt-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-rustic font-bold ${isCurrent ? 'text-[#e59324] text-lg' : 'text-white'}`}>
                            {statusInfo.text}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] bg-[#d34e2c] text-white px-2 py-0.5 rounded-full font-semibold">
                              ACTUAL
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#a88a70] mt-1">
                          {statusInfo.desc}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Items Summary */}
          {order.order_items && order.order_items.length > 0 && (
            <div className="bg-[#17120e] rounded-2xl p-5 border border-[#382b21]">
              <h3 className="font-rustic font-bold text-white text-sm mb-3 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-[#e59324]" />
                Detalle de los Platos
              </h3>
              <ul className="space-y-2 text-sm divide-y divide-[#2a1e16]">
                {order.order_items.map((item: any) => (
                  <li key={item.product_id} className="pt-2 flex justify-between items-center text-[#d4bea9]">
                    <span>
                      <strong className="text-white font-semibold mr-2">{item.quantity}x</strong>
                      {item.products?.name || 'Plato artesanal'}
                    </span>
                    {item.unit_price && (
                      <span className="text-xs text-[#8c6f59]">
                        ${(item.quantity * item.unit_price).toLocaleString()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}

    </div>
  )
}
