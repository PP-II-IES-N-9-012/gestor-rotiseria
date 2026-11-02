'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Loader2,
  Store,
  Truck,
  Utensils,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Receipt
} from 'lucide-react'
import { getProducts, createOrder } from '@/lib/api'
import { useAdminRestaurant } from '@/lib/AdminContext'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export default function POSPage() {
  const restaurant = useAdminRestaurant()
  const restaurantId = restaurant?.id
  const primaryColor = restaurant?.primary_color || '#e59324'

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([
    { id: 'prod-spiedo-01', name: 'Pollo al Spiedo al Limón y Finas Hierbas', price: 12500, quantity: 1 },
    { id: 'prod-emp-01', name: 'Empanadas Criollas Cortadas a Cuchillo', price: 1600, quantity: 6 },
    { id: 'prod-papas-01', name: 'Porción de Papas Fritas Rústicas a la Provenzal', price: 4900, quantity: 1 }
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todas las categorías')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [deliveryType, setDeliveryType] = useState<'local_pickup' | 'delivery' | 'dine_in'>('local_pickup')
  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [cashGiven, setCashGiven] = useState<string>('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successOrder, setSuccessOrder] = useState<any | null>(null)

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

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(i => {
          if (i.id === id) {
            const newQty = i.quantity + delta
            return newQty > 0 ? { ...i, quantity: newQty } : null
          }
          return i
        })
        .filter(Boolean) as CartItem[]
    })
  }

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  const clearCart = () => {
    if (cart.length === 0) return
    if (confirm('¿Vaciar todos los productos del ticket actual?')) {
      setCart([])
      setCashGiven('')
      setNotes('')
    }
  }

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const cashNum = parseFloat(cashGiven) || 0
  const changeDue = Math.max(0, cashNum - total)

  const handleConfirmOrder = async () => {
    if (cart.length === 0) return
    setIsSubmitting(true)

    try {
        const newOrder = await createOrder({
          delivery_type: deliveryType,
          total_amount: total,
          payment_method: paymentMethod,
        guest_name: customerName.trim() || (deliveryType === 'dine_in' ? 'Mesa / Salón' : 'Mostrador'),
          guest_address: deliveryType === 'delivery' ? customerAddress.trim() : undefined,
          notes: notes.trim(),
          status: 'pending' // Enviar a cocina
        }, cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price
        })), restaurantId)
      
      setSuccessOrder(newOrder)
      setCart([])
      setCustomerName('')
      setCustomerAddress('')
      setNotes('')
      setCashGiven('')
      } catch (error) {
        console.error("Error creating order", error)
        alert("Hubo un error al registrar la venta.")
      } finally {
        setIsSubmitting(false)
      }
    }

    const categories = ['Todas las categorías', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]

    const filteredProducts = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = categoryFilter === 'Todas las categorías' || p.category === categoryFilter
      return matchesSearch && matchesCategory
    })

    return (
            <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-8rem)] gap-6">

              {/* Product List & Search */}
              <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden shadow-xl min-h-[480px]">

                {/* Search & Categories Bar */}
                <div className="p-4 border-b flex flex-col sm:flex-row gap-3" style={{ borderColor: 'var(--store-border, rgba(255,255,255,0.08))' }}>
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--store-text-muted)]" />
                    <input
                      type="text"
                      placeholder="Buscar plato por nombre o código..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[var(--brand-primary,#e59324)] border text-white placeholder-white/40"
                      style={{
                        backgroundColor: 'var(--store-bg, rgba(30, 41, 59, 0.5))',
                        borderColor: 'var(--store-border, #334155)'
                      }}
                    />
                  </div>
                  <select
                    className="rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none border text-white"
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

                {/* Product Cards Grid */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {loading ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
                    </div>
                  ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
                        {filteredProducts.map(p => (
                          <button
                            key={p.id}
                            onClick={() => addToCart(p)}
                            className="p-3.5 rounded-2xl text-left transition-all active:scale-95 flex flex-col justify-between aspect-square border shadow-md group relative overflow-hidden"
                            style={{
                              backgroundColor: 'var(--store-card-bg, rgba(30, 41, 59, 0.5))',
                              borderColor: `color-mix(in srgb, ${primaryColor} 18%, var(--store-border, rgba(255, 255, 255, 0.08)))`
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = `${primaryColor}60`}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = `color-mix(in srgb, ${primaryColor} 18%, var(--store-border, rgba(255, 255, 255, 0.08)))`}
                          >
                            <span className="font-semibold text-xs sm:text-sm text-white group-hover:brightness-110 line-clamp-3">
                              {p.name}
                            </span>
                            <div className="mt-2 flex items-center justify-between w-full">
                              <span className="font-bold font-rustic text-sm sm:text-base" style={{ color: primaryColor }}>
                                ${Number(p.price).toLocaleString()}
                              </span>
                              <span
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110"
                                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                              >
                                +
                              </span>
                            </div>
                          </button>
                        ))}
                        {filteredProducts.length === 0 && (
                <div className="col-span-full text-center text-[color:var(--store-text-faint)] py-16 text-xs">
                  No se encontraron productos que coincidan con la búsqueda.
                </div>
                        )}
                      </div>
          )}
                    </div>
      </div>

                {/* Cart / Ticket Side Panel */}
                <div
                  className="w-full lg:w-[420px] rounded-2xl flex flex-col overflow-hidden border shadow-2xl shrink-0"
                  style={{
                    backgroundColor: 'var(--store-card-bg, #1a2230)',
          borderColor: `color-mix(in srgb, ${primaryColor} 25%, var(--store-border, rgba(255, 255, 255, 0.08)))`
                  }}
                >
                  {/* Ticket Header */}
                  <div
                    className="p-4 border-b flex justify-between items-center"
                    style={{
                      backgroundColor: 'var(--store-subtle-bg, rgba(30, 41, 59, 0.4))',
                      borderColor: 'var(--store-border, rgba(255, 255, 255, 0.08))'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Receipt className="w-5 h-5" style={{ color: primaryColor }} />
                      <h2 className="font-bold text-base text-white">Ticket de Venta</h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-[color:var(--store-text-muted)] font-mono">
                        {cart.reduce((sum, i) => sum + i.quantity, 0)} items
                      </span>
                    </div>

                    {cart.length > 0 && (
                      <button
                        onClick={clearCart}
                        className="text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Vaciar</span>
                      </button>
                    )}
                  </div>

                  {/* Modalidad de entrega */}
                  <div className="p-3 border-b border-[color:var(--store-border)] bg-[color:var(--store-subtle-bg)] grid grid-cols-3 gap-1.5 text-xs">
                    <button
                      onClick={() => setDeliveryType('local_pickup')}
                      className={`py-1.5 px-2 rounded-lg font-medium flex items-center justify-center gap-1 transition-all ${deliveryType === 'local_pickup'
                          ? 'bg-white/15 text-white font-bold border border-white/20'
                          : 'text-[color:var(--store-text-muted)] hover:text-white'
                        }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Mostrador</span>
                    </button>
                    <button
                      onClick={() => setDeliveryType('delivery')}
                      className={`py-1.5 px-2 rounded-lg font-medium flex items-center justify-center gap-1 transition-all ${deliveryType === 'delivery'
                          ? 'bg-white/15 text-white font-bold border border-white/20'
                          : 'text-[color:var(--store-text-muted)] hover:text-white'
                        }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Delivery</span>
                    </button>
                    <button
                      onClick={() => setDeliveryType('dine_in')}
                      className={`py-1.5 px-2 rounded-lg font-medium flex items-center justify-center gap-1 transition-all ${deliveryType === 'dine_in'
                          ? 'bg-white/15 text-white font-bold border border-white/20'
                          : 'text-[color:var(--store-text-muted)] hover:text-white'
                        }`}
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>Salón</span>
                    </button>
                  </div>

                  {/* Optional Customer info */}
                  <div className="px-4 py-2.5 border-b border-[color:var(--store-border)] space-y-2 text-xs">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Cliente o Mesa (ej: Juan Pérez / Mesa 3)"
                      className="w-full bg-black/20 border border-[color:var(--store-border)] rounded-lg px-3 py-1.5 text-white placeholder-white/30 focus:outline-none focus:border-[var(--brand-primary,#e59324)]"
                    />
                    {deliveryType === 'delivery' && (
                      <input
                        type="text"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="Dirección de entrega (ej: Mitre 540, 2B)"
                        className="w-full bg-black/20 border border-[color:var(--store-border)] rounded-lg px-3 py-1.5 text-white placeholder-white/30 focus:outline-none focus:border-[var(--brand-primary,#e59324)] animate-in fade-in"
                      />
                    )}
                  </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px]">
                      {cart.length === 0 ? (
            <div className="text-center py-12 text-[color:var(--store-text-faint)] text-xs">
              <Store className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Sin platos seleccionados</p>
              <p className="text-[11px] mt-1 text-[color:var(--store-text-muted)]">Haz clic en los platos del catálogo para agregarlos al ticket.</p>
            </div>
                      ) : (
                        cart.map(item => (
                              <div
                                key={item.id}
                                className="p-2.5 rounded-xl bg-[color:var(--store-subtle-bg)] border border-[color:var(--store-border)] flex items-center justify-between gap-2 text-xs"
                              >
                                <div className="flex-1 overflow-hidden">
                                  <p className="font-semibold text-white truncate">{item.name}</p>
                                  <p className="text-[11px] text-[color:var(--store-text-muted)]">
                                    ${item.price.toLocaleString()} c/u
                                  </p>
                                </div>

                                {/* Quantity Controls */}
                                <div className="flex items-center gap-1.5 bg-black/30 rounded-lg p-1 border border-white/10 shrink-0">
                                  <button
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="p-1 hover:text-white text-gray-400 transition-colors"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-6 text-center font-bold text-white text-xs">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="p-1 hover:text-white text-gray-400 transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="text-right shrink-0 min-w-[65px]">
                                  <span className="font-bold font-rustic text-white">
                                    ${(item.quantity * item.price).toLocaleString()}
                                  </span>
                                </div>

                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                                  title="Quitar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              ))
          )}
                            </div>

                            {/* Notes & Checkout Section */}
                            <div
                              className="p-4 border-t space-y-3"
                              style={{
                                backgroundColor: 'var(--store-subtle-bg, rgba(15, 23, 42, 0.6))',
                                borderColor: 'var(--store-border, rgba(255, 255, 255, 0.08))'
                              }}
                            >
                                {/* Kitchen note */}
                                <input
                                  type="text"
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  placeholder="Aclaración cocina (ej: Sin cebolla, bien cocido)"
                                  className="w-full bg-black/30 border border-[color:var(--store-border)] rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[var(--brand-primary,#e59324)]"
                                />

                                {/* Total */}
                                <div className="flex justify-between items-baseline pt-1">
                                  <span className="text-sm font-semibold text-white">Total a cobrar:</span>
                                  <span className="text-2xl font-bold font-rustic" style={{ color: primaryColor }}>
                                    ${total.toLocaleString()}
                                  </span>
                                </div>

                                  {/* Payment Method Switcher */}
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <button
                                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all border font-semibold"
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
                                      <Banknote className="w-4 h-4" />
                                      <span>Efectivo</span>
                                    </button>
                                    <button
                                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all border font-semibold"
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
                                      <CreditCard className="w-4 h-4" />
                                      <span>Tarjeta / MP</span>
                                    </button>
                                  </div>

                                  {/* Cash Change Calculator */}
                                  {paymentMethod === 'cash' && (
                                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/10 text-xs flex items-center justify-between gap-3 animate-in fade-in">
                                      <div className="flex items-center gap-2 flex-1">
                                        <span className="text-gray-400 text-[11px] whitespace-nowrap">Paga con $:</span>
                                        <input
                                          type="number"
                                          value={cashGiven}
                                          onChange={(e) => setCashGiven(e.target.value)}
                                          placeholder={total.toString()}
                                          className="w-full bg-black/40 border border-white/15 rounded-lg px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-[var(--brand-primary,#e59324)]"
                                        />
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="text-gray-400 text-[10px] block">Vuelto:</span>
                                        <span className="font-bold text-emerald-400 font-rustic text-sm">
                                          ${changeDue.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Submit */}
                                  <button
                                    className="w-full btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                    onClick={handleConfirmOrder}
                                    disabled={cart.length === 0 || isSubmitting}
                                  >
                                    {isSubmitting ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Enviando a cocina...</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Cobrar y Enviar a Cocina</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Success Modal */}
                              {successOrder && (
                                <div
                                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
                                  onClick={() => setSuccessOrder(null)}
                                >
                                  <div
                                    className="bg-[color:var(--store-card-bg)] border border-[color:var(--store-border)] rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl space-y-4"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
                                      <CheckCircle2 className="w-8 h-8" />
                                    </div>

                                    <div>
                                      <span className="badge-rustic text-xs">Venta Registrada</span>
                                      <h3 className="font-rustic font-bold text-2xl text-white mt-1">
                                        ¡Enviada a Cocina!
                                      </h3>
                                      <p className="text-xs text-[color:var(--store-text-muted)] mt-1 font-mono">
                                        Comanda #{successOrder.id.slice(0, 6).toUpperCase()}
                                      </p>
                                    </div>

                                    <div className="bg-[color:var(--store-subtle-bg)] p-3 rounded-xl border border-[color:var(--store-border)] text-xs text-left text-[color:var(--store-text-soft)] space-y-1">
                                      <p><strong className="text-white">Total Cobrado:</strong> ${Number(successOrder.total_amount).toLocaleString()}</p>
                                      <p><strong className="text-white">Medio:</strong> {successOrder.payment_method === 'cash' ? 'Efectivo' : 'Digital'}</p>
                                      <p><strong className="text-white">Modalidad:</strong> {successOrder.delivery_type === 'delivery' ? 'Delivery' : successOrder.delivery_type === 'dine_in' ? 'Salón' : 'Mostrador'}</p>
                                    </div>

                                    <button
                                      onClick={() => setSuccessOrder(null)}
                                      className="w-full btn-primary py-2.5 text-xs font-bold"
                                    >
                                      Tomar Siguiente Pedido
                                    </button>
                                  </div>
                                </div>
                              )}

                            </div>
                            )
}
