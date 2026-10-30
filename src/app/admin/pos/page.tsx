'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ShoppingBag
} from 'lucide-react'
import { getProducts, createOrder } from '@/lib/api'
import { useAdminRestaurant } from '@/lib/AdminContext'

export default function POSPage() {
  const restaurant = useAdminRestaurant()
  const restaurantId = restaurant?.id
  const primaryColor = restaurant?.primary_color || '#e59324'
  const secondaryColor = restaurant?.secondary_color || '#d34e2c'

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<{ id: string; name: string; price: number; quantity: number }[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todas las categorías')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card'>('cash')
  const [guestName, setGuestName] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showNotice = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

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
      return [...prev, { id: product.id, name: product.name, price: Number(product.price), quantity: 1 }]
    })
  }

  const updateQty = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => item.id === productId ? { ...item, quantity: item.quantity + delta } : item)
        .filter(item => item.quantity > 0)
    )
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)

  const handleConfirmOrder = async () => {
    if (cart.length === 0) return
    setIsSubmitting(true)
    setFeedback(null)
    
    try {
      const created = await createOrder(
        {
          delivery_type: 'local_pickup',
          total_amount: total,
          guest_name: guestName.trim() || 'Mostrador',
          payment_method: paymentMethod,
          notes: notes.trim() || undefined,
          status: 'pending'
        },
        cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          product_name: item.name
        })),
        restaurantId
      )
      
      const shortCode = created?.id ? `#${String(created.id).slice(0, 5).toUpperCase()}` : ''
      showNotice('success', `¡Venta ${shortCode} confirmada con éxito! Enviada a Cocina en Vivo.`)
      setCart([])
      setGuestName('')
      setNotes('')
    } catch (error: any) {
      console.error("Error creating order", error)
      showNotice('error', error?.message || "Hubo un error al registrar la venta.")
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
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6">
      {/* Product List */}
      <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3" style={{ borderColor: 'var(--store-border, rgba(255,255,255,0.08))' }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[color:var(--store-text-muted)]" />
            <input 
              type="text" 
              placeholder="Buscar plato o bebida..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-[var(--brand-primary,#e59324)] border text-white placeholder-gray-400 text-sm"
              style={{
                backgroundColor: 'var(--store-bg, rgba(30, 41, 59, 0.5))',
                borderColor: 'var(--store-border, #334155)'
              }}
            />
          </div>
          <select 
            className="rounded-xl px-4 py-2.5 focus:outline-none border text-white text-sm"
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
                  type="button"
                  onClick={() => addToCart(p)}
                  className="p-4 rounded-xl text-left transition-all active:scale-95 flex flex-col justify-between min-h-[130px] border shadow-md group hover:brightness-110"
                  style={{
                    backgroundColor: 'var(--store-card-bg, rgba(30, 41, 59, 0.5))',
                    borderColor: `color-mix(in srgb, ${primaryColor} 22%, var(--store-border, rgba(255, 255, 255, 0.08)))`
                  }}
                >
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--store-text-faint)] block mb-1 truncate">
                      {p.category}
                    </span>
                    <span className="font-semibold text-sm text-white line-clamp-2 leading-snug">{p.name}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 w-full">
                    <span className="font-bold font-rustic text-base" style={{ color: primaryColor }}>
                      ${Number(p.price).toLocaleString()}
                    </span>
                    <span 
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs shadow-sm"
                      style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center text-[color:var(--store-text-faint)] py-10">
                  No se encontraron productos.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cart / Ticket */}
      <div 
        className="w-full lg:w-96 rounded-2xl flex flex-col overflow-hidden border shadow-xl shrink-0"
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
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" style={{ color: primaryColor }} />
            <h2 className="font-bold text-lg text-white">Ticket de Venta</h2>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => setCart([])}
              className="text-xs text-[color:var(--store-text-faint)] hover:text-red-400 transition-colors"
            >
              Vaciar
            </button>
          )}
        </div>

        {feedback && (
          <div 
            className={`mx-4 mt-3 p-3 rounded-xl border text-xs font-medium flex items-center gap-2 animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {cart.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-[color:var(--store-text-faint)] text-sm">
                Haz clic en los platos de la izquierda para armar la comanda de mostrador.
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div 
                key={item.id} 
                className="flex justify-between items-center gap-2 text-sm p-2.5 rounded-xl border"
                style={{
                  backgroundColor: 'var(--store-subtle-bg, rgba(255,255,255,0.03))',
                  borderColor: 'var(--store-border, rgba(255,255,255,0.06))'
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{item.name}</p>
                  <p className="text-xs text-[color:var(--store-text-muted)]">
                    ${Number(item.price).toLocaleString()} c/u
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, -1)}
                    className="w-6 h-6 rounded-lg bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-bold text-xs text-white">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, 1)}
                    className="w-6 h-6 rounded-lg bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <span className="font-bold font-rustic text-white min-w-[65px] text-right">
                  ${(item.quantity * item.price).toLocaleString()}
                </span>

                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="text-[color:var(--store-text-faint)] hover:text-red-400 p-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div 
          className="p-4 border-t space-y-3"
          style={{
            backgroundColor: 'var(--store-subtle-bg, rgba(15, 23, 42, 0.6))',
            borderColor: 'var(--store-border, rgba(255, 255, 255, 0.08))'
          }}
        >
          {/* Datos opcionales rápidos de mostrador */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Cliente (ej: Mostrador)"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              className="rounded-xl px-3 py-2 text-xs text-white placeholder-gray-400 border focus:outline-none focus:border-[var(--brand-primary,#e59324)]"
              style={{
                backgroundColor: 'var(--store-card-bg, #151210)',
                borderColor: 'var(--store-border, #334155)'
              }}
            />
            <input
              type="text"
              placeholder="Nota cocina (opcional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="rounded-xl px-3 py-2 text-xs text-white placeholder-gray-400 border focus:outline-none focus:border-[var(--brand-primary,#e59324)]"
              style={{
                backgroundColor: 'var(--store-card-bg, #151210)',
                borderColor: 'var(--store-border, #334155)'
              }}
            />
          </div>

          <div className="flex justify-between items-center text-xl font-bold font-outfit pt-1">
            <span>Total a Cobrar</span>
            <span style={{ color: primaryColor }}>${total.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button 
              type="button"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-colors border text-xs font-semibold"
              style={paymentMethod === 'cash' ? {
                backgroundColor: `${primaryColor}20`,
                borderColor: primaryColor,
                color: primaryColor
              } : {
                backgroundColor: 'var(--store-card-bg, rgba(30, 41, 59, 0.6))',
                borderColor: 'var(--store-border, transparent)',
                color: 'var(--store-text-muted, #94a3b8)'
              }}
              onClick={() => setPaymentMethod('cash')}
            >
              <Banknote className="w-4 h-4" />
              <span>Efectivo</span>
            </button>
            <button 
              type="button"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-colors border text-xs font-semibold"
              style={paymentMethod === 'transfer' ? {
                backgroundColor: `${primaryColor}20`,
                borderColor: primaryColor,
                color: primaryColor
              } : {
                backgroundColor: 'var(--store-card-bg, rgba(30, 41, 59, 0.6))',
                borderColor: 'var(--store-border, transparent)',
                color: 'var(--store-text-muted, #94a3b8)'
              }}
              onClick={() => setPaymentMethod('transfer')}
            >
              <Smartphone className="w-4 h-4" />
              <span>Transf.</span>
            </button>
            <button 
              type="button"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-colors border text-xs font-semibold"
              style={paymentMethod === 'card' ? {
                backgroundColor: `${primaryColor}20`,
                borderColor: primaryColor,
                color: primaryColor
              } : {
                backgroundColor: 'var(--store-card-bg, rgba(30, 41, 59, 0.6))',
                borderColor: 'var(--store-border, transparent)',
                color: 'var(--store-text-muted, #94a3b8)'
              }}
              onClick={() => setPaymentMethod('card')}
            >
              <CreditCard className="w-4 h-4" />
              <span>Tarjeta</span>
            </button>
          </div>

          <button 
            type="button"
            className="w-full py-3.5 rounded-xl text-base font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
            }}
            onClick={handleConfirmOrder}
            disabled={cart.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Registrando venta...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirmar Venta</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
