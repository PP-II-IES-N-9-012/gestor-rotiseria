'use client'

import { useState } from 'react'
import { Search, Plus, CreditCard, Banknote } from 'lucide-react'

// Mock products
const mockProducts = [
  { id: '1', code: 'EMP-CAR', name: 'Empanada de Carne', price: 1500, category: 'Empanadas' },
  { id: '2', code: 'EMP-JYQ', name: 'Empanada de JyQ', price: 1400, category: 'Empanadas' },
  { id: '3', code: 'PIZ-MUZ', name: 'Pizza Muzzarella', price: 8500, category: 'Pizzas' },
]

export default function POSPage() {
  const [cart, setCart] = useState<{id: string, name: string, price: number, quantity: number}[]>([])
  
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
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-red-500"
            />
          </div>
          <select className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none">
            <option>Todas las categorías</option>
            <option>Empanadas</option>
            <option>Pizzas</option>
          </select>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {mockProducts.map(p => (
            <button 
              key={p.id}
              onClick={() => addToCart(p)}
              className="bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 p-4 rounded-xl text-left transition-all active:scale-95 flex flex-col justify-between aspect-square"
            >
              <span className="font-medium text-sm md:text-base">{p.name}</span>
              <span className="text-red-400 font-bold mt-2">${p.price}</span>
            </button>
          ))}
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
            <button className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl transition-colors">
              <Banknote className="w-5 h-5" />
              <span>Efectivo</span>
            </button>
            <button className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl transition-colors">
              <CreditCard className="w-5 h-5" />
              <span>Tarjeta</span>
            </button>
          </div>
          <button 
            className="w-full btn-primary mt-4 py-3 text-lg"
            onClick={() => {
              if(cart.length > 0) {
                alert('Venta registrada con éxito'); 
                setCart([]);
              }
            }}
          >
            Confirmar Venta
          </button>
        </div>
      </div>
    </div>
  )
}
