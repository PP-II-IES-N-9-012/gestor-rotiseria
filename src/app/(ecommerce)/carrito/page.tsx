'use client'
import { useCartStore } from '@/store/useCartStore'
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createOrder } from '@/lib/api'

export default function CartPage() {
  const { items, updateQuantity, removeItem, total, clearCart } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    deliveryType: 'delivery',
    paymentMethod: 'cash' // We will integrate MP later, default cash
  })

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-outfit font-bold mb-4">Tu carrito está vacío</h2>
        <p className="text-gray-400 mb-8">Parece que aún no has agregado nada delicioso.</p>
        <Link href="/" className="btn-primary inline-flex">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createOrder({
        delivery_type: formData.deliveryType,
        total_amount: total(),
        guest_name: formData.name,
        guest_phone: formData.phone,
        guest_address: formData.address,
        payment_method: formData.paymentMethod,
      }, items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
      })))

      alert("¡Pedido realizado con éxito!")
      clearCart()
      router.push('/')
    } catch (error) {
      console.error("Error al crear el pedido", error)
      alert("Hubo un error al procesar el pedido.")
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold font-outfit mb-8">Tu Pedido</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {items.map(item => (
            <div key={item.id} className="glass-panel p-4 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-red-400 font-medium">${item.price}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-slate-800 rounded-lg p-1">
                  <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="p-1 hover:text-red-400"><Minus className="w-4 h-4"/></button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:text-red-400"><Plus className="w-4 h-4"/></button>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 p-2">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <form onSubmit={handleCheckout} className="glass-panel p-6 rounded-3xl sticky top-28">
            <h2 className="text-xl font-bold mb-6 font-outfit">Detalles del Checkout (Invitado)</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre Completo</label>
                <input required type="text" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:border-red-500 transition-colors" placeholder="Ej. Juan Pérez" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Teléfono</label>
                <input required type="tel" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:border-red-500 transition-colors" placeholder="Ej. 11 1234-5678" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Modalidad de Entrega</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:border-red-500 transition-colors" value={formData.deliveryType} onChange={e => setFormData({...formData, deliveryType: e.target.value})}>
                  <option value="delivery">Envío a Domicilio</option>
                  <option value="local_pickup">Retiro en Local</option>
                </select>
              </div>

              {formData.deliveryType === 'delivery' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Dirección de Entrega</label>
                  <input required type="text" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:border-red-500 transition-colors" placeholder="Calle Falsa 123" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Método de Pago</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:border-red-500 transition-colors" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                  <option value="cash">Efectivo al recibir</option>
                  <option value="mercadopago">MercadoPago (Redirección)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Subtotal</span>
                <span className="font-medium">${total()}</span>
              </div>
              <div className="flex justify-between items-center mb-4 text-sm text-gray-400">
                <span>Costo de Envío</span>
                <span>{formData.deliveryType === 'delivery' ? 'A calcular' : 'Gratis'}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold font-outfit">
                <span>Total</span>
                <span className="text-red-500">${total()}</span>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center space-x-2 py-3 text-lg">
              <span>Confirmar Pedido</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
