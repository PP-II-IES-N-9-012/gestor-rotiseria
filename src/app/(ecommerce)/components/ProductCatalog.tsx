'use client'

import { useState } from 'react'
import { Maximize2 } from 'lucide-react'
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
}

export default function ProductCatalog({
  products,
  categories,
  primaryColor = '#e59324',
  secondaryColor = '#d34e2c',
  cashDiscountPercentage = 0,
  deliveryTime = '35-45 min',
  ctaText = 'Pedir al plato'
}: ProductCatalogProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenProduct = (product: ProductItem) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

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
      {categories.map(category => (
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
              {products.filter(p => p.category === category).length} especialidades
            </span>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.filter(p => p.category === category).map(product => (
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
                {/* Image & Price */}
                <div 
                  className="relative h-52 w-full overflow-hidden"
                  style={{ backgroundColor: 'var(--store-subtle-bg, #181310)' }}
                >
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
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
                    <span 
                      className="px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
                    >
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
                    <span className="text-xs font-bold" style={{ color: primaryColor }}>$</span>
                    <span className="text-lg font-rustic">{Number(product.price).toLocaleString()}</span>
                  </div>

                  {/* Artisanal Badge */}
                  <div 
                    className="absolute bottom-3 left-3 backdrop-blur-sm px-2.5 py-1 rounded-lg border text-[11px] font-medium z-10"
                    style={{
                      backgroundColor: 'var(--store-badge-bg, rgba(30,23,19,0.85))',
                      borderColor: `${primaryColor}35`,
                      color: primaryColor
                    }}
                  >
                    Receta Casera
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div className="mb-4">
                    <h3 
                      className="text-lg font-bold font-rustic text-[#fcf9f5] mb-2 transition-colors group-hover:text-[color:var(--brand-primary)]"
                    >
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
                      product={{ id: product.id, name: product.name, price: Number(product.price) }} 
                      ctaText={ctaText}
                    />
                  </div>
                </div>

              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Detail Modal Component */}
      <ProductDetailModal
        key={selectedProduct?.id || 'none'}
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        cashDiscountPercentage={cashDiscountPercentage}
        deliveryTime={deliveryTime}
      />
    </>
  )
}
