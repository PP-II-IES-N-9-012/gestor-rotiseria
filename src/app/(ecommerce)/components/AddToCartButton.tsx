'use client'
import { ShoppingCart, Check, Lock } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useEffect, useRef, useState } from 'react'

  export default function AddToCartButton({
    product,
    ctaText = 'Pedir al plato',
    disabled = false
  }: {
    product: { id: string; name: string; price: number }
  ctaText?: string
  disabled?: boolean
}) {
    const addItem = useCartStore(state => state.addItem)
    const [added, setAdded] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    }, [])

    const handleAdd = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (disabled) return
      addItem({ ...product, quantity: 1 })
      setAdded(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setAdded(false), 1200)
    }

    if (disabled) {
      return (
        <button
          type="button"
          disabled
          onClick={(e) => e.stopPropagation()}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-medium bg-black/40 text-white/45 border border-white/10 cursor-not-allowed"
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">Cerrado por horario</span>
        </button>
      )
    }

    return (
        <button
      type="button"
        onClick={handleAdd}
        style={
        added
          ?undefined: {
              background: `linear-gradient(135deg, var(--brand-primary, #e59324), var(--brand-secondary, #d34e2c))`
  }
      }
        added
  ? 'bg-emerald-600 text-white shadow-emerald-950/40'
  : 'text-white shadow-black/40 border border-white/10 hover:brightness-110'
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
          <span className="text-sm font-semibold">{ctaText || 'Pedir al plato'}</span>
        </>
      )}
    </button>
  )
}
