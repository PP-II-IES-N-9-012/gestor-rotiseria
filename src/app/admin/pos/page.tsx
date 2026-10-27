'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, CreditCard, Banknote, Loader2 } from 'lucide-react'
import { getProducts, createOrder } from '@/lib/api'
import { useAdminRestaurant } from '@/lib/AdminContext'

export default function POSPage() {
  const restaurant = useAdminRestaurant()
  const restaurantId = restaurant?.id
  const primaryColor = restaurant?.primary_color || '#e59324'
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<{id: string, name: string, price: number, quantity: number}[]>([
    { id: 'prod-spiedo-01', name: 'Pollo al Spiedo al Limón y Finas Hierbas', price: 12500, quantity: 1 },
    { id: 'prod-emp-01', name: 'Empanadas Criollas Cortadas a Cuchillo', price: 1600, quantity: 6 },
    { id: 'prod-papas-01', name: 'Porción de Papas Fritas Rústicas a la Provenzal', price: 4900, quantity: 1 }
  ])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todas las categorías')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getProducts(restaurantId)
        setProducts(data || [])
      } catch (error) {
        console.error("Error loading products", error)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [restaurantId])
  
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)

  const handleConfirmOrder = async () => {
    if (cart.length === 0) return
    setIsSubmitting(true)
    
    try {
      await createOrder({
        delivery_type: 'local_pickup', // POS is usually local or dine-in
        total_amount: total,
        payment_method: paymentMethod,
        status: 'pending' // Send to kitchen
      }, cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
      })), restaurantId)
      
      alert('Venta registrada con éxito. Enviada a cocina.')
      setCart([])
    } catch (error) {
      console.error("Error creating order", error)
      alert("Hubo un error al registrar la venta.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const categories = ['Todas las categorías', ...Array.from(new Set(products.map(p => p.category)))]
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'Todas las categorías' || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Product List */}
      <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 border-b flex gap-4" style={{ borderColor: 'var(--store-border, rgba(255,255,255,0.08))' }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[color:var(--store-text-muted)]" />
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-[var(--brand-primary,#e59324)] border text-white placeholder-gray-400"
              style={{
                backgroundColor: 'var(--store-bg, rgba(30, 41, 59, 0.5))',
                borderColor: 'var(--store-border, #334155)'
              }}
            />
          </div>
          <select 
            className="rounded-xl px-4 py-2 focus:outline-none border text-white"
            style={{
              backgroundColor: 'var(--store-bg, rgba(30, 41, 59, 0.5))',
              borderColor: 'var(--store-border, #334155)'
            }}
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(p => (
                <button 
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="p-4 rounded-xl text-left transition-all active:scale-95 flex flex-col justify-between aspect-square border shadow-md group"
                  style={{
                    backgroundColor: 'var(--store-card-bg, rgba(30, 41, 59, 0.5))',
                    borderColor: `color-mix(in srgb, ${primaryColor} 18%, var(--store-border, rgba(255, 255, 255, 0.08)))`
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = `${primaryColor}60`}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = `color-mix(in srgb, ${primaryColor} 18%, var(--store-border, rgba(255, 255, 255, 0.08)))`}
                >
                  <span className="font-medium text-sm md:text-base text-white group-hover:brightness-110">{p.name}</span>
                  <span className="font-bold mt-2 font-rustic text-base" style={{ color: primaryColor }}>${Number(p.price).toLocaleString()}</span>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center text-[color:var(--store-text-faint)] py-10">No se encontraron productos.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cart / Ticket */}
      <div 
        className="w-96 rounded-2xl flex flex-col overflow-hidden border shadow-xl"
        style={{
          backgroundColor: 'var(--store-card-bg, #1a2230)',
          borderColor: `color-mix(in srgb, ${primaryColor} 20%, var(--store-border, rgba(255, 255, 255, 0.08)))`
        }}
      >
        <div 
          className="p-4 border-b flex justify-between items-center"
          style={{
            backgroundColor: 'var(--store-subtle-bg, rgba(30, 41, 59, 0.4))',
            borderColor: 'var(--store-border, rgba(255, 255, 255, 0.08))'
          }}
        >
          <h2 className="font-bold text-lg text-white">Ticket de Venta</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-[color:var(--store-text-faint)] text-center mt-10">Sin productos seleccionados</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-[color:var(--store-text-muted)]">{item.quantity} x ${Number(item.price).toLocaleString()}</p>
                </div>
                <span className="font-bold font-rustic text-white">${(item.quantity * item.price).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>

        <div 
          className="p-4 border-t"
          style={{
            backgroundColor: 'var(--store-subtle-bg, rgba(15, 23, 42, 0.6))',
            borderColor: 'var(--store-border, rgba(255, 255, 255, 0.08))'
          }}
        >
          <div className="flex justify-between text-xl font-bold mb-4 font-outfit">
            <span>Total</span>
            <span style={{ color: primaryColor }}>${total.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button 
              className="flex items-center justify-center gap-2 py-3 rounded-xl transition-colors border font-medium"
              style={paymentMethod === 'cash' ? {
                backgroundColor: `${primaryColor}20`,
                borderColor: primaryColor,
                color: primaryColor
              } : {
                backgroundColor: 'var(--store-subtle-bg, rgba(30, 41, 59, 0.6))',
                borderColor: 'var(--store-border, transparent)',
                color: 'var(--store-text-muted, #94a3b8)'
              }}
              onClick={() => setPaymentMethod('cash')}
            >
              <Banknote className="w-5 h-5" />
              <span>Efectivo</span>
            </button>
            <button 
              className="flex items-center justify-center gap-2 py-3 rounded-xl transition-colors border font-medium"
              style={paymentMethod === 'card' ? {
                backgroundColor: `${primaryColor}20`,
                borderColor: primaryColor,
                color: primaryColor
              } : {
                backgroundColor: 'var(--store-subtle-bg, rgba(30, 41, 59, 0.6))',
                borderColor: 'var(--store-border, transparent)',
                color: 'var(--store-text-muted, #94a3b8)'
              }}
              onClick={() => setPaymentMethod('card')}
            >
              <CreditCard className="w-5 h-5" />
              <span>Tarjeta</span>
            </button>
          </div>
          <button 
            className="w-full btn-primary mt-4 py-3 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleConfirmOrder}
            disabled={cart.length === 0 || isSubmitting}
          >
            {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
            Confirmar Venta
          </button>
        </div>
      </div>
    </div>
  )
}
