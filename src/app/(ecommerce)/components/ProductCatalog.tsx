'use client'

import { useMemo, useState } from 'react'
import { Maximize2, Search, X } from 'lucide-react'
import { ProductItem } from '@/lib/api'
import AddToCartButton from './AddToCartButton'
import ProductDetailModal from './ProductDetailModal'

interface ProductCatalogProps {
  products: ProductItem[]
  categories: string[]
  primaryColor?: string
  secondaryColor?: string
  cashDiscountPercentage?: number
  deliveryTime?: string
  ctaText?: string
  showProductBadges?: boolean
  isStoreOpen?: boolean
}

export default function ProductCatalog({
  products,
  categories,
  primaryColor = '#e59324',
  secondaryColor = '#d34e2c',
  cashDiscountPercentage = 0,
  deliveryTime = '35-45 min',
  ctaText = 'Pedir al plato',
  showProductBadges = true,
  isStoreOpen = true
}: ProductCatalogProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('ALL')

  const handleOpenProduct = (product: ProductItem) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return products.filter((p) => {
      if (activeCategory !== 'ALL' && p.category !== activeCategory) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.badge || '').toLowerCase().includes(q)
      )
    })
  }, [products, activeCategory, searchQuery])

  const visibleCategories = useMemo(() => {
    return categories.filter((cat) => filteredProducts.some((p) => p.category === cat))
  }, [categories, filteredProducts])

  if (categories.length === 0) {
    return (
      <div className="text-center text-[color:var(--store-text-muted)] py-16">
        <p className="text-xl font-rustic">El horno está preparándose para hoy...</p>
        <p className="text-sm mt-2">No hay platos disponibles en este momento.</p>
      </div>
    )
  }

  return (
    <>
              {/* Barra rápida de búsqueda y píldoras de categorías */}
      <div className="space-y-4 mb-10">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search
                    className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: primaryColor }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar plato, gusto o ingrediente..."
                    className="w-full rounded-2xl pl-11 pr-10 py-3 text-sm text-white placeholder-[color:var(--store-text-faint)] border focus:outline-none transition-all shadow-md"
                    style={{
                backgroundColor: 'var(--store-card-bg, #1f1814)',
                      borderColor: searchQuery
                        ? primaryColor
                        : `color-mix(in srgb, ${primaryColor} 22%, var(--store-border, #3d2f25))`
                    }}
            />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Limpiar búsqueda"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-[color:var(--store-text-muted)] hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                      {categories.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                          <button
                            type="button"
                            onClick={() => setActiveCategory('ALL')}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all active:scale-95"
                            style={
                              activeCategory === 'ALL'
                                ? {
                                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                  color: '#ffffff',
                                  borderColor: 'rgba(255,255,255,0.2)'
                                }
                                : {
                                  backgroundColor: 'var(--store-card-bg, #1f1814)',
                                  borderColor: 'var(--store-border, #3d2f25)',
                                  color: 'var(--store-text-soft, #ddcfc2)'
                                }
                            }
                          >
                              Todos ({products.length})
                          </button>
                          {categories.map((cat) => {
                            const count = products.filter((p) => p.category === cat).length
                            const isSelected = activeCategory === cat
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setActiveCategory(isSelected ? 'ALL' : cat)}
                                className="px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all active:scale-95"
                                style={
                                  isSelected
                                    ? {
                                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                      color: '#ffffff',
                                      borderColor: 'rgba(255,255,255,0.2)'
                                    }
                                    : {
                                      backgroundColor: 'var(--store-card-bg, #1f1814)',
                                      borderColor: 'var(--store-border, #3d2f25)',
                                      color: 'var(--store-text-soft, #ddcfc2)'
                                    }
                                }
                              >
                                {cat} ({count})
                              </button>
                            )
                          })}
                        </div>
                      )}
        </div>
              </div>

              {visibleCategories.length === 0 ? (
                <div
                  className="text-center py-14 px-6 rounded-3xl border"
                  style={{
                    backgroundColor: 'var(--store-card-bg, #1f1814)',
                    borderColor: 'var(--store-border, #3d2f25)'
                  }}
                >
                  <p className="text-lg font-rustic text-white mb-1">
                    No encontramos platos para &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-xs text-[color:var(--store-text-muted)] mb-4">
                    Probá con otra palabra o mirá todas las categorías de la carta.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setActiveCategory('ALL')
                    }}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    Mostrar toda la carta
                  </button>
                </div>
              ) : (
                visibleCategories.map((category) => {
                  const catProducts = filteredProducts.filter((p) => p.category === category)
                  return (
                    <section key={category} className="mb-14">
                      {/* Category Header */}
                      <div
                        className="flex items-center justify-between mb-8 pb-3 border-b"
                        style={{ borderColor: 'var(--store-border, #3d2e23)' }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3 h-3 rounded-full shadow-sm"
                            style={{ backgroundColor: primaryColor }}
                          />
                          <h2 className="text-2xl md:text-3xl font-bold font-rustic text-[#fcf9f5]">
                            {category}
                          </h2>
                        </div>
                        <span
                          className="text-xs px-3 py-1 rounded-full border"
                          style={{
                            backgroundColor: 'var(--store-subtle-bg, #241c16)',
                            borderColor: 'var(--store-border, #3d2e23)',
                            color: 'var(--store-text-muted, #a88a70)'
                          }}
                        >
                          {catProducts.length} {catProducts.length === 1 ? 'especialidad' : 'especialidades'}
                        </span>
                      </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {catProducts.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleOpenProduct(product)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleOpenProduct(product)
                              }
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={`Ver detalles de ${product.name}`}
                            className="rounded-2xl overflow-hidden hover:-translate-y-1.5 transition-all duration-300 flex flex-col group shadow-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            style={{
                              backgroundColor: 'var(--store-card-bg, #1f1814)',
                              borderColor: `color-mix(in srgb, ${primaryColor} 18%, var(--store-border, #3d2f25))`
                            }}
                          >
                    {/* Image & Price */ }
                          < div
                      className = "relative h-52 w-full overflow-hidden"
                      style = {{ backgroundColor: 'var(--store-subtle-bg, #181310)' }}
                    >
                        {product.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image_url}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-95 group-hover:brightness-100"
                          />
                        ) : (
                          <div
                            className="flex items-center justify-center h-full font-medium text-sm"
                            style={{ color: 'var(--store-text-muted, #7a6452)' }}
                          >
                            Foto en preparación
                          </div>
                        )}

                            {/* Hover visual cue: Ver detalle */}
                            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                              <span className="px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                <Maximize2 className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                                <span>Ver foto y detalles</span>
                              </span>
                            </div>

                            {/* Price Tag */}
                            <div
                              className="absolute top-3 right-3 backdrop-blur-sm border font-bold py-1.5 px-3 rounded-xl shadow-lg flex items-center gap-1 z-10"
                              style={{
                                backgroundColor: 'var(--store-bg, #151210)',
                                borderColor: `${primaryColor}60`,
                                color: '#fcf9f5'
                              }}
                            >
                              <span className="text-xs font-bold" style={{ color: primaryColor }}>
                                $
                              </span>
                              <span className="text-lg font-rustic">
                                {Number(product.price).toLocaleString('es-AR')}
                              </span>
                            </div>

                            {/* Custom Product Badge (Nuevo, Oferta, Más pedido, etc.) */}
                            {showProductBadges && product.badge && product.badge.trim() !== '' && (
                              <div
                                className="absolute bottom-3 left-3 backdrop-blur-md px-2.5 py-1 rounded-lg border text-[11px] font-bold z-10 shadow-lg"
                                style={{
                                  backgroundColor: 'var(--store-badge-bg, rgba(20, 15, 12, 0.92))',
                                  borderColor: `${primaryColor}55`,
                                  color: primaryColor
                                }}
                              >
                                {product.badge}
                              </div>
                            )}
                          </div>

                        {/* Content */}
                        <div className="p-5 flex-grow flex flex-col justify-between">
                          <div className="mb-4">
                            <h3 className="text-lg font-bold font-rustic text-[#fcf9f5] mb-2 transition-colors group-hover:text-[color:var(--brand-primary)]">
                              {product.name}
                            </h3>
                            <p
                              className="text-sm line-clamp-2 leading-relaxed"
                              style={{ color: 'var(--store-text-muted, #b89e89)' }}
                            >
                              {product.description}
                            </p>
                          </div>

                            <div
                              className="pt-3 border-t"
                              style={{ borderColor: 'var(--store-border, #31251e)' }}
                            >
                              <AddToCartButton
                                product={{
                                  id: product.id,
                                  name: product.name,
                                  price: Number(product.price)
                                }}
                                ctaText={ctaText}
                                disabled={!isStoreOpen}
                              />
                            </div>
                          </div>
                        </div>
                ))}
                    </div>
    </section >
          )
})
      )}

{/* Detail Modal Component */ }
<ProductDetailModal
  key={selectedProduct?.id || 'none'}
  product={selectedProduct}
  isOpen={isModalOpen}
  onClose={handleCloseModal}
  primaryColor={primaryColor}
  secondaryColor={secondaryColor}
  cashDiscountPercentage={cashDiscountPercentage}
  deliveryTime={deliveryTime}
  ctaText={ctaText}
  showProductBadges={showProductBadges}
  isStoreOpen={isStoreOpen}
/>
    </>
  )
}
