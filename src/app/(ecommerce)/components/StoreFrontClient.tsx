'use client'

import { useState, useEffect } from 'react'
import { 
  Flame, 
  Heart, 
  Award, 
  Sparkles, 
  Store 
} from 'lucide-react'
import ProductCatalog from './ProductCatalog'
import { 
  getRestaurant, 
  getProducts, 
  mergeBranding, 
  invalidateCache,
  getStoreOpenStatus,
  type RestaurantInfo, 
  type ProductItem 
} from '@/lib/api'
import { supabase } from '@/lib/supabase'

interface StoreFrontClientProps {
  initialRestaurant: RestaurantInfo
  initialProducts: ProductItem[]
  showSubdomainBadge?: boolean
}

export default function StoreFrontClient({
  initialRestaurant,
  initialProducts,
  showSubdomainBadge = false
}: StoreFrontClientProps) {
  const [restaurant, setRestaurant] = useState<RestaurantInfo>(initialRestaurant)
  const [products, setProducts] = useState<ProductItem[]>(initialProducts)
  const [, setClockTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setClockTick(t => t + 1), 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false

    // Aplicar inmediatamente cualquier personalización local guardada tras hidratar
    setRestaurant(prev => mergeBranding(prev))

    const syncLatest = async () => {
      const freshRest = await getRestaurant(initialRestaurant.subdomain || initialRestaurant.id)
      if (cancelled) return
      setRestaurant(mergeBranding(freshRest))

      const freshProds = await getProducts(freshRest.id)
      if (cancelled) return
      if (freshProds && freshProds.length > 0) {
        setProducts(freshProds)
      }
    }

    syncLatest()

    const handleUpdate = () => {
      invalidateCache('restaurant')
      invalidateCache('restaurant_strict')
      invalidateCache('products')
      syncLatest()
    }

    window.addEventListener('comandapp-branding-updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)

    const channel = supabase
      .channel(`storefront-sync-${initialRestaurant.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurants' },
        () => handleUpdate()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => handleUpdate()
      )
      .subscribe()

    return () => {
      cancelled = true
      window.removeEventListener('comandapp-branding-updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
      supabase.removeChannel(channel)
    }
  }, [initialRestaurant])

  const categories = Array.from(new Set(products.map(p => p.category)))

  const primaryColor = restaurant.primary_color || '#e59324'
  const secondaryColor = restaurant.secondary_color || '#d34e2c'
  const bannerUrl = restaurant.banner_url || '/hero_rotiseria.jpg'
  const logoUrl = restaurant.logo_url
  const deliveryTime = restaurant.estimated_delivery_time || '35-45 min'
  const tag1 = restaurant.highlight_tag_1 || 'Horno a Leña & Fuego'
  const tag2 = restaurant.highlight_tag_2 || '100% Casero'
  const tag3 = restaurant.highlight_tag_3 || 'Atención Directa'
  const ctaText = restaurant.hero_cta_text || 'Pedir al plato'
  const storeStatus = getStoreOpenStatus(restaurant)
  const showProductBadges = restaurant.show_product_badges !== false

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Store Closed / Outside Hours Notice */}
      {!storeStatus.isOpen && (
        <div className="bg-rose-950/90 border border-rose-500/50 p-4 rounded-2xl text-center text-rose-200 text-sm flex items-center justify-center gap-2 shadow-xl animate-in fade-in">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
          <span>
            <strong>Local Cerrado:</strong> {storeStatus.message}
          </span>
        </div>
      )}

      {/* Custom Hero Banner */}
      <div 
        className="relative rounded-3xl overflow-hidden border border-[color:var(--store-border)] p-8 md:p-12 shadow-2xl transition-all"
        style={{
          backgroundImage: `${
            restaurant.hero_overlay_opacity === 'light'
              ? 'linear-gradient(to right, color-mix(in srgb, var(--store-bg, #151210) 75%, transparent), color-mix(in srgb, var(--store-header-bg, #1b1511) 65%, transparent), color-mix(in srgb, var(--store-bg, #151210) 70%, transparent))'
              : restaurant.hero_overlay_opacity === 'medium'
              ? 'linear-gradient(to right, color-mix(in srgb, var(--store-bg, #151210) 85%, transparent), color-mix(in srgb, var(--store-header-bg, #1b1511) 78%, transparent), color-mix(in srgb, var(--store-bg, #151210) 82%, transparent))'
              : 'linear-gradient(to right, color-mix(in srgb, var(--store-bg, #151210) 94%, transparent), color-mix(in srgb, var(--store-header-bg, #1b1511) 88%, transparent), color-mix(in srgb, var(--store-bg, #151210) 92%, transparent))'
          }, url(${bannerUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${primaryColor} 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="max-w-2xl flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            {/* Foto de perfil del local agrandada y destacada */}
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={logoUrl} 
                alt={restaurant.name} 
                className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 object-cover rounded-3xl bg-black/60 p-1.5 border-2 shadow-2xl shrink-0 transition-transform hover:scale-105" 
                style={{ borderColor: `${primaryColor}60` }}
              />
            ) : (
              <div 
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center text-white shadow-2xl shrink-0"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  boxShadow: `0 8px 24px ${primaryColor}40`
                }}
              >
                <Store className="w-12 h-12" />
              </div>
            )}

            <div className="flex-1">
              {/* Subdomain / Official Badge + Discount */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-3">
                <div 
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border shadow-sm backdrop-blur-sm"
                  style={{
                    color: primaryColor,
                    borderColor: `${primaryColor}40`,
                    backgroundColor: `${primaryColor}15`
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                  <span>
                    {showSubdomainBadge && restaurant.subdomain
                      ? `Tienda Oficial • ${restaurant.subdomain}.comandapp.com`
                      : 'Rotisería & Cocina Artesanal'}
                  </span>
                </div>

                {Number(restaurant.cash_discount_percentage) > 0 && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm backdrop-blur-sm">
                    <span>⚡ {restaurant.cash_discount_percentage}% OFF en Efectivo</span>
                  </div>
                )}

                {Number(restaurant.min_order_amount) > 0 && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-black/50 text-[color:var(--store-text-soft)] border border-white/15 shadow-sm backdrop-blur-sm">
                    <span>Pedido mín: ${Number(restaurant.min_order_amount).toLocaleString('es-AR')}</span>
                  </div>
                )}
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold font-rustic text-[#fcf9f5] mb-3 leading-tight">
                {restaurant.name}
              </h1>
              
              <p className="text-lg text-[color:var(--store-text-soft)] leading-relaxed">
                {restaurant.description || 'Comida recién hecha a mano, respetando los tiempos y el amor de la cocina tradicional. Pide online y recíbelo humeante en tu casa.'}
              </p>
            </div>
          </div>

          {/* Highlights Box */}
          <div 
            className="w-full md:w-auto border rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col gap-4 text-sm text-[color:var(--store-text-soft)] shrink-0"
            style={{ 
              backgroundColor: 'var(--store-card-bg, #1a1410)',
              borderColor: `color-mix(in srgb, ${primaryColor} 25%, var(--store-border, #3d2f25))` 
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-xl text-white shadow-md"
                style={{ backgroundColor: secondaryColor }}
              >
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-white">{tag1}</p>
                <p className="text-xs text-[color:var(--store-text-muted)]">Especialidad de la casa</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-xl text-white shadow-md"
                style={{ backgroundColor: secondaryColor }}
              >
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-white">{tag2}</p>
                <p className="text-xs text-[color:var(--store-text-muted)]">Receta y sabor tradicional</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-xl text-white shadow-md"
                style={{ backgroundColor: secondaryColor }}
              >
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-white">{tag3}</p>
                <p className="text-xs text-[color:var(--store-text-muted)]">Sin comisiones de apps externas</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Product Catalog with Modal */}
      <ProductCatalog 
        products={products}
        categories={categories}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        cashDiscountPercentage={restaurant.cash_discount_percentage}
        deliveryTime={deliveryTime}
        ctaText={ctaText}
        showProductBadges={showProductBadges}
        isStoreOpen={storeStatus.isOpen}
      />
    </div>
  )
}

