'use client'

import { useState, useEffect } from 'react'
import { Search, Flame, Clock, CheckCircle2, Utensils, ChefHat, Loader2, Sparkles, RefreshCw } from 'lucide-react'
import { getOrderById } from '@/lib/api'
import { useStoreTenant } from '@/lib/useStoreTenant'
import { supabase } from '@/lib/supabase'

export default function TrackingPage() {
  const { restaurant } = useStoreTenant()
  const primaryColor = restaurant?.primary_color || '#e59324'
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

    const fetchOrder = async (idToSearch: string, silent = false) => {
      const cleanId = idToSearch.trim()
      if (!cleanId) return

      if (!silent) {
        setLoading(true)
        setError('')
      }

      try {
        const data = await getOrderById(cleanId)
        if (data) {
          setOrder(data)
        } else if (!silent) {
          setOrder(null)
          setError('No se encontró ningún pedido con ese código en el sistema.')
        }
      } catch (err) {
        console.error(err)
        if (!silent) {
          setError('Código no encontrado o error de conexión. Verifica el código de tu pedido.')
        }
      } finally {
        if (!silent) setLoading(false)
      }
    }

    // Auto-load order if ?id=... or ?order=... is in the URL search params
    useEffect(() => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const queryId = params.get('id') || params.get('order')
        if (queryId) {
          setOrderId(queryId)
          fetchOrder(queryId)
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Realtime subscription + periodic polling to order status updates
    useEffect(() => {
      if (!order?.id) return

      const channel = supabase
        .channel(`tracking-order-${order.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`
        }, (payload) => {
          if (payload.new && payload.new.status) {
            setOrder((prev: any) => ({ ...prev, status: payload.new.status }))
          }
        })
        .subscribe()

      const pollTimer = setInterval(() => {
        fetchOrder(order.id, true)
      }, 5000)

      return () => {
        clearInterval(pollTimer)
        supabase.removeChannel(channel)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [order?.id])

    const handleSearch = (e: React.FormEvent) => {
      e.preventDefault()
      fetchOrder(orderId)
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
            color: 'text-[color:var(--store-text-muted)]',
            bg: 'bg-gray-800'
          }
      }
    }

    return (
      <div className="max-w-3xl mx-auto px-4 py-16 min-h-[75vh]">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="badge-rustic mb-4">
            <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span>Cocina en Vivo</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-rustic mb-4 text-[#fcf9f5]">
            Sigue el Estado de tu <span style={{ color: primaryColor }}>Comanda</span>
          </h1>
          <p className="text-[color:var(--store-text-muted)] max-w-md mx-auto text-sm leading-relaxed">
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
            className="w-full bg-[color:var(--store-card-bg)] border border-[color:var(--store-border)] rounded-2xl pl-6 pr-32 py-4 text-sm md:text-base text-white placeholder-[color:var(--store-text-faint)] focus:outline-none focus:border-[var(--brand-primary,#e59324)] transition-all shadow-xl"
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
          <div
            className="p-8 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 border"
            style={{
              backgroundColor: 'var(--store-card-bg, #1f1712)',
              borderColor: `color-mix(in srgb, ${primaryColor} 22%, var(--store-border, #4d3a2b))`
            }}
          >

            <div
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-6 border-b gap-4"
              style={{ borderColor: 'var(--store-border, #382b21)' }}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--store-text-muted, #8c6f59)' }}>Número de Comanda</p>
                <p className="font-rustic font-bold text-2xl text-white">#{order.id.split('-')[0].toUpperCase()}</p>
                {order.guest_name && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--store-text-muted, #bfa38c)' }}>Cliente: {order.guest_name}</p>
                )}
              </div>

              <div className="text-left sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--store-text-muted, #8c6f59)' }}>Total del Pedido</p>
                <p className="font-rustic font-bold text-2xl" style={{ color: primaryColor }}>${Number(order.total_amount).toLocaleString()}</p>
                <span className="text-[11px]" style={{ color: 'var(--store-text-muted, #a88a70)' }}>
                  {order.delivery_type === 'delivery' ? '🛵 Envío a domicilio' : '🏪 Retiro en local'}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-rustic font-bold text-lg text-white">Etapa de Cocina</h3>
                <button
                  onClick={() => fetchOrder(order.id)}
                  className="text-xs text-[color:var(--store-text-muted)] hover:text-white flex items-center gap-1 transition-colors"
                  title="Actualizar estado"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Actualizar</span>
                </button>
              </div>

              <div className="relative pl-2">
                {/* Timeline line */}
                <div
                  className="absolute left-7 top-6 bottom-6 w-0.5"
                  style={{ backgroundColor: 'var(--store-border, #382b21)' }}
                />

                <div className="space-y-8 relative">
                  {['pending', 'preparing', 'ready', 'completed'].map((stepStatus, idx) => {
                    const stepIndex = ['pending', 'preparing', 'ready', 'completed'].indexOf(order.status)
                    const isActive = stepIndex >= idx
                    const isCurrent = order.status === stepStatus
                    const statusInfo = getStatusDisplay(stepStatus)

                    return (
                      <div key={stepStatus} className={`flex items-start gap-4 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-35'}`}>
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center z-10 transition-all duration-500 shadow-md ${isCurrent
                              ? 'text-[#151210] ring-4 scale-110 font-bold'
                              : isActive
                                ? 'border'
                                : 'border'
                            }`}
                          style={isCurrent ? {
                            backgroundColor: primaryColor,
                            boxShadow: `0 0 16px ${primaryColor}40`
                          } : isActive ? {
                            backgroundColor: `${primaryColor}20`,
                            color: primaryColor,
                            borderColor: `${primaryColor}50`
                          } : {
                            backgroundColor: 'var(--store-subtle-bg, #241a14)',
                            borderColor: 'var(--store-border, #382b21)',
                            color: 'var(--store-text-muted, #7a6452)'
                          }}
                        >
                          <statusInfo.icon className="w-5 h-5" />
                        </div>

                        <div className="pt-1">
                          <div className="flex items-center gap-2">
                            <h4
                              className="font-rustic font-bold text-white"
                              style={isCurrent ? { color: primaryColor, fontSize: '1.125rem' } : undefined}
                            >
                              {statusInfo.text}
                            </h4>
                            {isCurrent && (
                              <span
                                className="text-[10px] text-white px-2 py-0.5 rounded-full font-semibold"
                                style={{ backgroundColor: primaryColor }}
                              >
                                ACTUAL
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-1" style={{ color: 'var(--store-text-muted, #a88a70)' }}>
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
              <div
                className="rounded-2xl p-5 border"
                style={{
                  backgroundColor: 'var(--store-subtle-bg, #17120e)',
                  borderColor: 'var(--store-border, #382b21)'
                }}
              >
                <h3 className="font-rustic font-bold text-white text-sm mb-3 flex items-center gap-2">
                  <Utensils className="w-4 h-4" style={{ color: primaryColor }} />
                  Detalle de los Platos
                </h3>
                <ul
                  className="space-y-2 text-sm divide-y"
                  style={{ borderColor: 'var(--store-border, #2a1e16)' }}
                >
                      {order.order_items.map((item: any, i: number) => (
                        <li key={i} className="pt-2 flex justify-between items-center text-[color:var(--store-text-soft)]">
                          <span>
                            <strong className="text-white font-semibold mr-2">{item.quantity}x</strong>
                            {item.products?.name || 'Plato artesanal'}
                          </span>
                          {item.unit_price && (
                            <span className="text-xs" style={{ color: 'var(--store-text-muted, #8c6f59)' }}>
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
