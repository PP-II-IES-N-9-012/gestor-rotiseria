'use client'

import { useEffect, useRef, useState } from 'react'
import {
  X,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  Sparkles,
  Clock,
  ShieldCheck,
  Utensils,
  ChefHat,
  Flame,
  Tag
} from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { ProductItem } from '@/lib/api'

interface ProductDetailModalProps {
  product: ProductItem | null
  isOpen: boolean
  onClose: () => void
  primaryColor?: string
  secondaryColor?: string
  cashDiscountPercentage?: number
  deliveryTime?: string
  ctaText?: string
  showProductBadges?: boolean
  isStoreOpen?: boolean
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  primaryColor = '#e59324',
  secondaryColor = '#d34e2c',
  cashDiscountPercentage = 0,
  deliveryTime = '35-45 min',
  ctaText = 'Pedir al plato',
  showProductBadges = true,
  isStoreOpen = true
}: ProductDetailModalProps) {
  const addItem = useCartStore(state => state.addItem)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  // Manage Escape key and lock body scroll
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !product) return null

  const priceNum = Number(product.price) || 0
  const subtotal = priceNum * quantity
  const cashDiscount = Number(cashDiscountPercentage) || 0
  const cashPrice = cashDiscount > 0 ? Math.round(priceNum * (1 - cashDiscount / 100)) : null

  const handleAddToCart = () => {
    if (!isStoreOpen) return
    addItem({
      id: product.id,
      name: product.name,
      price: priceNum,
      quantity
    })
    setAdded(true)
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      closeTimerRef.current = setTimeout(() => {
        setAdded(false)
        onClose()
    }, 900)
  }

  const handleIncrement = () => {
    if (quantity < 99) setQuantity(prev => prev + 1)
  }

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(prev => prev - 1)
  }

  return (
      <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {/* Modal Card */}
        <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col md:flex-row overflow-hidden rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: 'var(--store-card-bg, #1a1410)',
          borderColor: `color-mix(in srgb, ${primaryColor} 30%, var(--store-border, #3d2f25))`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white border border-white/10 backdrop-blur-md transition-all duration-200 active:scale-95 shadow-xl group"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {/* LEFT COLUMN: Large Photo View */}
          <div
          className="md:w-1/2 w-full relative min-h-[260px] sm:min-h-[340px] md:min-h-[460px] bg-[#120e0b] flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r"
          style={{ borderColor: 'var(--store-border, #3d2f25)' }}
        >
          {product.image_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image_url}
                alt={product.name}
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30 pointer-events-none" />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 border shadow-inner"
                style={{
                  backgroundColor: 'var(--store-subtle-bg, #201712)',
                  borderColor: 'var(--store-border, #3d2f25)'
                }}
              >
                <Utensils className="w-10 h-10" style={{ color: primaryColor }} />
              </div>
              <p className="font-rustic text-lg text-white">Foto en preparación artesanal</p>
              <p className="text-xs text-[color:var(--store-text-muted)] mt-1 max-w-xs">
                Plato elaborado en el momento con ingredientes frescos del día.
              </p>
            </div>
          )}

        {/* Category Pill on top left */}
          <div
            className="absolute top-4 left-4 backdrop-blur-md px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-lg"
          style={{
            backgroundColor: 'rgba(21, 18, 16, 0.85)',
            borderColor: `${primaryColor}40`,
            color: primaryColor
          }}
        >
          <Flame className="w-3.5 h-3.5" style={{ color: primaryColor }} />
          <span>{product.category}</span>
        </div>

        {/* Custom Badge on bottom left */}
        {showProductBadges && product.badge && product.badge.trim() !== '' && (
            <div
              className="absolute bottom-4 left-4 backdrop-blur-md px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-lg text-[#fcf9f5]"
            style={{
              backgroundColor: 'rgba(30, 23, 19, 0.92)',
              borderColor: `${primaryColor}55`,
              color: primaryColor
            }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span>{product.badge}</span>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Description, Price & Actions */}
      <div className="md:w-1/2 w-full flex flex-col justify-between p-6 sm:p-8 overflow-y-auto max-h-[55vh] md:max-h-[92vh]">

        <div>
          {/* Header / Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg"
              style={{
                backgroundColor: `color-mix(in srgb, ${primaryColor} 15%, transparent)`,
                color: primaryColor
              }}
            >
              <Tag className="w-3 h-3" />
              {product.category}
            </span>

            {product.code && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">
                REF: {product.code}
              </span>
            )}
          </div>

          {/* Product Title */}
          <h2 className="text-2xl sm:text-3xl font-bold font-rustic text-[#fcf9f5] leading-tight mb-3">
            {product.name}
          </h2>

          {/* Price Box */}
          <div className="flex flex-wrap items-baseline gap-3 mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold" style={{ color: primaryColor }}>$</span>
              <span className="text-3xl sm:text-4xl font-extrabold font-rustic text-white tracking-tight">
                {priceNum.toLocaleString('es-AR')}
              </span>
            </div>

            {cashPrice && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm">
                ⚡ ${cashPrice.toLocaleString('es-AR')} con {cashDiscount}% OFF en Efectivo
              </span>
            )}
          </div>

            <div
            className="border-t my-4"
            style={{ borderColor: 'var(--store-border, #3d2e23)' }}
          />

          {/* Full Description */}
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[color:var(--store-text-muted,#a88a70)] mb-2">
              Descripción
            </h3>
            <p className="text-[color:var(--store-text-soft,#ddcfc2)] text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {product.description || 'Plato artesanal preparado con la receta tradicional de la casa y materias primas de primera calidad.'}
            </p>
          </div>

          {/* Ingredients (if available) */}
          {product.ingredients && product.ingredients.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-[color:var(--store-text-muted,#a88a70)] mb-2.5">
                <ChefHat className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                <span>Ingredientes seleccionados</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {product.ingredients.map((ing, idx) => (
                    <span
                      key={idx}
                    className="px-2.5 py-1 text-xs rounded-lg border text-[color:var(--store-text-soft)]"
                    style={{
                      backgroundColor: 'var(--store-subtle-bg, #201712)',
                      borderColor: 'var(--store-border, #3d2f25)'
                    }}
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quality Badges */}
            <div
              className="grid grid-cols-2 gap-2 text-xs text-[color:var(--store-text-muted)] p-3 rounded-2xl border mb-6"
            style={{
              backgroundColor: 'var(--store-subtle-bg, #181310)',
              borderColor: 'var(--store-border, #33251c)'
            }}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Demora aprox: {deliveryTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
              <span>Elaboración fresca del día</span>
            </div>
          </div>
        </div>

        {/* BOTTOM CONTROLS: Quantity & Add to Cart */}
          <div
            className="pt-4 border-t space-y-3"
          style={{ borderColor: 'var(--store-border, #3d2e23)' }}
        >
          {/* Quantity Selector + Subtotal */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[color:var(--store-text-muted)]">
              Cantidad:
            </span>
            <div className="flex items-center gap-3">
                <div
                  className="flex items-center rounded-xl border overflow-hidden shadow-inner"
                style={{
                  backgroundColor: 'var(--store-subtle-bg, #181310)',
                  borderColor: 'var(--store-border, #3d2f25)'
                }}
              >
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  className="p-2.5 text-gray-300 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Disminuir cantidad"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-white text-sm">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="p-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>


              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-[color:var(--store-text-muted)]">Subtotal</div>
                <div className="text-sm font-bold text-white font-rustic">
                  ${subtotal.toLocaleString('es-AR')}
                </div>
              </div>
            </div>
          </div>

          {/* Add to Cart CTA Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isStoreOpen}
            style={
              !isStoreOpen || added
                ? undefined
                : {
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                }
            }
            className={`w-full py-3.5 px-6 rounded-2xl font-bold transition-all duration-200 shadow-xl flex items-center justify-center gap-2.5 ${!isStoreOpen
                ? 'bg-black/40 text-white/45 border border-white/10 cursor-not-allowed'
                  : added
                    ? 'bg-emerald-600 text-white shadow-emerald-950/40 active:scale-95'
                    : 'text-white shadow-black/40 border border-white/10 hover:brightness-110 active:scale-95'
              }`}
          >
            {!isStoreOpen ? (
              <span className="text-sm font-bold">🔒 Local cerrado fuera del horario de atención</span>
            ) : added ? (
              <>
                <Check className="w-5 h-5 animate-in zoom-in" />
                <span className="text-base font-bold">
                  ¡{quantity} {quantity === 1 ? 'unidad agregada' : 'unidades agregadas'} a la comanda!
                </span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                <span className="text-base font-bold">
                  {ctaText || 'Pedir al plato'} • ${subtotal.toLocaleString('es-AR')}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
    </div >
  )
}
