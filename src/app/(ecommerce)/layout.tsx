'use client'

import Link from 'next/link'
import { ShoppingCart, Utensils, Flame, Sparkles } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useState, useEffect } from 'react'
import { useStoreTenant } from '@/lib/useStoreTenant'

export default function EcommerceLayout({ children }: { children: React.ReactNode }) {
  const { items } = useCartStore()
  const { restaurant, href, storePath } = useStoreTenant()
  const [mounted, setMounted] = useState(false)
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0)

  useEffect(() => setMounted(true), [])

  const primaryColor = restaurant?.primary_color || '#e59324'
  const secondaryColor = restaurant?.secondary_color || '#d34e2c'
  const themeClass = restaurant?.theme_style ? `theme-${restaurant.theme_style}` : 'theme-rustic'
  const fontClass = restaurant?.font_style === 'sans' ? 'font-modern' : 'font-rustic'
  const announcementText = restaurant?.announcement_banner || '🔥 Horno encendido y cocina despachando pedidos en vivo'
  const showAnnouncement = restaurant?.announcement_enabled !== false

  return (
    <div 
      className={`flex flex-col min-h-screen text-[#fcf9f5] ${themeClass} ${fontClass}`}
      style={{
        '--brand-primary': primaryColor,
        '--brand-secondary': secondaryColor,
        backgroundColor: 'var(--store-bg, #151210)'
      } as React.CSSProperties}
    >
      {/* Top Announcement Bar */}
      {showAnnouncement && (
        <div 
          className="border-b px-4 py-1.5 text-xs text-center flex items-center justify-center gap-2 transition-colors"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderColor: `${primaryColor}25`,
            color: '#e8caa4'
          }}
        >
          <span 
            className="inline-block w-2 h-2 rounded-full animate-pulse shadow-sm"
            style={{ backgroundColor: primaryColor }}
          />
          <span className="font-medium text-white/90">{announcementText}</span>
          <span className="hidden md:inline opacity-40">•</span>
          <Link 
            href="/" 
            className="hidden md:inline hover:underline font-semibold transition-colors"
            style={{ color: primaryColor }}
          >
            ¿Tienes una rotisería? Conoce ComandApp ➔
          </Link>
        </div>
      )}

      {/* Main Store Header */}
      <header 
        className="sticky top-0 z-50 backdrop-blur-md border-b shadow-xl transition-all"
        style={{
          backgroundColor: 'var(--store-header-bg, rgba(30, 23, 19, 0.95))',
          borderColor: `${primaryColor}20`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo / Brand */}
            <Link href={storePath} className="flex items-center space-x-3 group">
              {restaurant?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={restaurant.logo_url} 
                  alt={restaurant.name} 
                  className="w-12 h-12 object-contain rounded-2xl bg-black/40 p-1.5 border shadow-md group-hover:scale-105 transition-all" 
                  style={{ borderColor: `${primaryColor}40` }}
                />
              ) : (
                <div 
                  className="p-2.5 rounded-2xl group-hover:rotate-6 transition-all duration-300 shadow-lg text-white"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    boxShadow: `0 4px 14px ${primaryColor}40`
                  }}
                >
                  <Flame className="w-6 h-6" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-rustic text-2xl font-bold tracking-tight text-[#fcf9f5]">
                  {restaurant?.name || 'La Rotisería'}
                </span>
                <span className="text-[11px] text-[#bda086] -mt-1 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3" style={{ color: primaryColor }} />
                  Tienda Oficial • Sabor Casero
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                href={storePath} 
                className="text-[#ddcfc2] transition-colors font-medium text-sm flex items-center gap-1.5 hover:text-white"
              >
                <Utensils className="w-4 h-4" style={{ color: primaryColor }} />
                Carta & Menú
              </Link>
              <Link 
                href={href('/seguimiento')} 
                className="text-[#ddcfc2] transition-colors font-medium text-sm hover:text-white"
              >
                Seguimiento en Vivo
              </Link>
              <Link 
                href="/" 
                className="text-xs text-[#a88a70] hover:text-[#fcf9f5] px-3 py-1.5 rounded-lg border border-[#44372e] hover:border-white/20 transition-all"
              >
                Sobre ComandApp
              </Link>
            </nav>

            {/* Actions: Cart */}
            <div className="flex items-center space-x-4">
              <Link 
                href={href('/carrito')} 
                className="relative flex items-center gap-2 text-[#fcf9f5] px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-md group"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 1,
                  borderColor: `${primaryColor}40`
                }}
              >
                <ShoppingCart className="w-5 h-5 transition-transform group-hover:scale-110" style={{ color: primaryColor }} />
                <span className="hidden sm:inline text-sm font-semibold">Mi Comanda</span>
                {mounted && cartCount > 0 && (
                  <span 
                    className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold leading-none text-white rounded-full shadow-md animate-in zoom-in"
                    style={{ 
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` 
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      {/* Warm Footer */}
      <footer 
        className="border-t py-12 text-[#9e836d] transition-colors"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          borderColor: `${primaryColor}20`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
            <div>
              <p className="font-rustic text-xl font-bold text-[#fcf9f5] mb-1">
                {restaurant?.name || 'ComandApp • Tienda Online'}
              </p>
              <p className="text-sm text-[#b59982] max-w-md">
                {restaurant?.footer_custom_text || restaurant?.description || 'Cocina tradicional, recetas familiares y entrega directa sin intermediarios.'}
              </p>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-2">
              <div 
                className="badge-rustic"
                style={{
                  borderColor: `${primaryColor}40`,
                  color: primaryColor
                }}
              >
                <span>⚡ 0% Comisiones • Software Gastronómico</span>
              </div>
              <p className="text-xs text-[#735e4e]">
                Potenciado por <Link href="/" className="hover:underline font-semibold" style={{ color: primaryColor }}>ComandApp</Link> © {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
