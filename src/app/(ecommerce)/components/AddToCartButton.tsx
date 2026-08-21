'use client'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'

export default function AddToCartButton({ product }: { product: { id: string, name: string, price: number } }) {
  const addItem = useCartStore(state => state.addItem)

  return (
    <button 
      onClick={() => addItem({ ...product, quantity: 1 })}
      className="btn-primary w-full flex items-center justify-center space-x-2"
    >
      <ShoppingCart className="w-5 h-5" />
      <span>Agregar</span>
    </button>
  )
}
