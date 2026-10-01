'use client'

import { useCartStore } from '@/store/useCartStore'
import { Minus, Plus, Trash2, ArrowRight, Utensils, Sparkles, ChefHat, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createOrder } from '@/lib/api'

export default function CartPage() {
  const { items, updateQuantity, removeItem, total, clearCart } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderDone, setOrderDone] = useState<any>(null)
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    deliveryType: 'delivery',
    paymentMethod: 'cash',
    notes: ''
  })

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  if (orderDone) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-in fade-in duration-500">
        <div className="bg-[#1f1712] border border-[#4d3a2b] p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-emerald-900/40 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="badge-rustic mb-3">¡Orden #{orderDone.id.split('-')[0].toUpperCase()} enviada a cocina!</span>
          <h2 className="text-3xl md:text-4xl font-rustic font-bold text-white mb-3">
            ¡Comanda Recibida en Cocina!
          </h2>
          <p className="text-[#c7af9a] mb-6 leading-relaxed">
            Nuestros cocineros ya tienen tu pedido en la comanda. En unos minutos estará marchando al fuego.
          </p>

          <div className="bg-[#17120e] p-4 rounded-xl border border-[#382a1f] mb-8 text-left text-sm text-[#d4bfae]">
            <p><strong className="text-white">Cliente:</strong> {formData.name}</p>
            <p><strong className="text-white">Modalidad:</strong> {formData.deliveryType === 'delivery' ? 'Envío a Domicilio' : 'Retiro en Local'}</p>
            {formData.deliveryType === 'delivery' && <p><strong className="text-white">Dirección:</strong> {formData.address}</p>}
            <p><strong className="text-white">Total a abonar:</strong> ${total().toLocaleString()}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={`/seguimiento`}
              className="btn-amber text-center py-3 px-6"
            >
              Rastrear mi pedido
            </Link>
            <Link 
              href="/tienda"
              className="btn-secondary text-center py-3 px-6"
            >
              Volver a la carta
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-[#241a14] border border-[#44372e] flex items-center justify-center mx-auto mb-6">
          <Utensils className="w-8 h-8 text-[#e59324]" />
        </div>
        <h2 className="text-3xl font-rustic font-bold text-white mb-3">Tu comanda está vacía</h2>
        <p className="text-[#a88a70] mb-8 max-w-md mx-auto">
          Aún no has agregado ninguna de nuestras comidas caseras. Date una vuelta por el menú para ver qué sale del horno hoy.
        </p>
        <Link href="/tienda" className="btn-primary inline-flex items-center gap-2">
          <span>Ver la Carta & Menú</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const newOrder = await createOrder({
        delivery_type: formData.deliveryType,
        total_amount: total(),
        guest_name: formData.name,
        guest_phone: formData.phone,
        guest_address: formData.address,
        payment_method: formData.paymentMethod,
        notes: formData.notes
      }, items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
      })))

      clearCart()
      setOrderDone(newOrder)
    } catch (error) {
      console.error("Error al crear el pedido", error)
      alert("Hubo un error al procesar el pedido. Por favor intenta nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-8">
        <ChefHat className="w-8 h-8 text-[#e59324]" />
        <div>
          <h1 className="text-3xl font-rustic font-bold text-white">Tu Comanda</h1>
          <p className="text-xs text-[#a88a70]">Revisa tus platos y confirma tus datos de entrega</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div 
              key={item.id} 
              className="bg-[#1f1712] border border-[#3d2f25] p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md"
            >
              <div className="flex-1">
                <h3 className="font-rustic font-bold text-lg text-white mb-1">{item.name}</h3>
                <p className="text-[#e59324] font-medium text-sm">${Number(item.price).toLocaleString()} c/u</p>
              </div>

              <div className="flex items-center space-x-4 self-end sm:self-center">
                <div className="flex items-center space-x-2 bg-[#2b2019] border border-[#44352a] rounded-xl p-1">
                  <button 
                    type="button"
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} 
                    className="p-1.5 hover:text-[#e59324] rounded-lg transition-colors"
                  >
                    <Minus className="w-4 h-4"/>
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-white">{item.quantity}</span>
                  <button 
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                    className="p-1.5 hover:text-[#e59324] rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4"/>
                  </button>
                </div>

                <div className="text-right min-w-[70px]">
                  <p className="font-rustic font-bold text-white">${(item.price * item.quantity).toLocaleString()}</p>
                </div>

                <button 
                  type="button"
                  onClick={() => removeItem(item.id)} 
                  className="text-[#8c6d55] hover:text-red-400 p-2 transition-colors rounded-lg hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="pt-4 flex justify-between items-center text-sm text-[#bda086]">
            <span>¿Quieres sumar algo más del horno?</span>
            <Link href="/tienda" className="text-[#e59324] hover:underline font-semibold flex items-center gap-1">
              <span>+ Agregar más platos</span>
            </Link>
          </div>
        </div>

        {/* Checkout Form */}
        <div className="lg:col-span-1">
          <form 
            onSubmit={handleCheckout} 
            className="bg-[#1f1712] border border-[#4d3a2b] p-6 rounded-3xl sticky top-28 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#3d2f25]">
              <h2 className="text-xl font-rustic font-bold text-white">Datos de Entrega</h2>
              <span className="text-[11px] text-[#e59324] bg-[#2e1d13] px-2.5 py-0.5 rounded-full border border-[#e59324]/30">
                Sin Registro
              </span>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-[#c7af9a] mb-1.5">Tu Nombre y Apellido</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-[#17120e] border border-[#44352a] rounded-xl px-4 py-2.5 text-white placeholder-[#6d5645] focus:outline-none focus:border-[#e59324] transition-colors text-sm" 
                  placeholder="Ej: Marcelo Fernández" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#c7af9a] mb-1.5">Teléfono (WhatsApp)</label>
                <input 
                  required 
                  type="tel" 
                  className="w-full bg-[#17120e] border border-[#44352a] rounded-xl px-4 py-2.5 text-white placeholder-[#6d5645] focus:outline-none focus:border-[#e59324] transition-colors text-sm" 
                  placeholder="Ej: 11 4455-6677" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-[#c7af9a] mb-1.5">¿Cómo lo prefieres?</label>
                <select 
                  className="w-full bg-[#17120e] border border-[#44352a] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e59324] transition-colors text-sm" 
                  value={formData.deliveryType} 
                  onChange={e => setFormData({...formData, deliveryType: e.target.value})}
                >
                  <option value="delivery">🛵 Envío a Domicilio (Delivery)</option>
                  <option value="local_pickup">🏪 Retiro por el Local (Take Away)</option>
                </select>
              </div>

              {formData.deliveryType === 'delivery' && (
                <div className="animate-in fade-in duration-300">
                  <label className="block text-xs font-semibold text-[#c7af9a] mb-1.5">Dirección de Entrega</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full bg-[#17120e] border border-[#44352a] rounded-xl px-4 py-2.5 text-white placeholder-[#6d5645] focus:outline-none focus:border-[#e59324] transition-colors text-sm" 
                    placeholder="Calle, número y depto/piso" 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#c7af9a] mb-1.5">Forma de Pago</label>
                <select 
                  className="w-full bg-[#17120e] border border-[#44352a] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e59324] transition-colors text-sm" 
                  value={formData.paymentMethod} 
                  onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                >
                  <option value="cash">💵 Efectivo al recibir</option>
                  <option value="mercadopago">📱 MercadoPago / Transferencia</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#c7af9a] mb-1.5">Aclaración para la cocina (Opcional)</label>
                <input 
                  type="text" 
                  className="w-full bg-[#17120e] border border-[#44352a] rounded-xl px-4 py-2.5 text-white placeholder-[#6d5645] focus:outline-none focus:border-[#e59324] transition-colors text-sm" 
                  placeholder="Ej: Sin cebolla, tocar timbre 2B" 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                />
              </div>
            </div>

            {/* Total breakdown */}
            <div className="border-t border-[#3d2f25] pt-4 mb-6 space-y-2">
              <div className="flex justify-between items-center text-sm text-[#bda086]">
                <span>Subtotal comida</span>
                <span className="font-semibold text-white">${total().toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-[#8c6f59]">
                <span>Costo de envío</span>
                <span>{formData.deliveryType === 'delivery' ? 'A coordinar / Fijo' : '¡Gratis! (Retiro)'}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold font-rustic pt-2 border-t border-[#31251e]">
                <span className="text-white">Total</span>
                <span className="text-[#e59324]">${total().toLocaleString()}</span>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center space-x-2 py-3.5 text-base font-semibold disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Enviando a cocina...' : 'Confirmar Pedido'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <p className="text-[11px] text-center text-[#7a6452] mt-3">
              🔒 Tu orden viaja directo a la pantalla de cocina sin comisiones
            </p>
          </form>
        </div>

      </div>
    </div>
  )
}
