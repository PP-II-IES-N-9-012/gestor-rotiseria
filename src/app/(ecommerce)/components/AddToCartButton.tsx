'use client'
import { ShoppingCart, Check } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useState } from 'react'

export default function AddToCartButton({ 
  product 
}: { 
  product: { id: string, name: string, price: number } 
}) {
  const addItem = useCartStore(state => state.addItem)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addItem({ ...product, quantity: 1 })
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <button 
      onClick={handleAdd}
      className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-medium transition-all duration-200 active:scale-95 shadow-md ${
        added 
          ? 'bg-emerald-600 text-white shadow-emerald-950/40' 
          : 'bg-gradient-to-r from-[#d34e2c] to-[#b83d1c] hover:from-[#ea643f] hover:to-[#d34e2c] text-white shadow-orange-950/40 border border-white/10'
      }`}
    >
      {added ? (
        <>
          <Check className="w-4 h-4 animate-in zoom-in" />
          <span className="font-semibold text-sm">¡En la comanda!</span>
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4" />
          <span className="text-sm font-semibold">Pedir al plato</span>
        </>
      )}
    </button>
  )
}
