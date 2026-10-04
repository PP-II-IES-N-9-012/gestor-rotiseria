'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, CreditCard, Banknote, Loader2 } from 'lucide-react'
import { getProducts, createOrder } from '@/lib/api'

export default function POSPage() {
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
        const data = await getProducts()
        setProducts(data || [])
      } catch (error) {
        console.error("Error loading products", error)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])
  
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
      })))
      
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
        <div className="p-4 border-b border-white/5 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-red-500"
            />
          </div>
          <select 
            className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none"
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
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(p => (
                <button 
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 p-4 rounded-xl text-left transition-all active:scale-95 flex flex-col justify-between aspect-square"
                >
                  <span className="font-medium text-sm md:text-base">{p.name}</span>
                  <span className="text-red-400 font-bold mt-2">${p.price}</span>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-10">No se encontraron productos.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cart / Ticket */}
      <div className="w-96 glass-panel rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 bg-slate-800/30 border-b border-white/5">
          <h2 className="font-bold text-lg">Ticket de Venta</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">Sin productos seleccionados</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-gray-400">{item.quantity} x ${item.price}</p>
                </div>
                <span className="font-bold">${item.quantity * item.price}</span>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-white/5 bg-slate-900/50">
          <div className="flex justify-between text-xl font-bold mb-4 font-outfit">
            <span>Total</span>
            <span className="text-red-500">${total}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button 
              className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-colors border ${paymentMethod === 'cash' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-800 hover:bg-slate-700 border-transparent'}`}
              onClick={() => setPaymentMethod('cash')}
            >
              <Banknote className="w-5 h-5" />
              <span>Efectivo</span>
            </button>
            <button 
              className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-colors border ${paymentMethod === 'card' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-800 hover:bg-slate-700 border-transparent'}`}
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
