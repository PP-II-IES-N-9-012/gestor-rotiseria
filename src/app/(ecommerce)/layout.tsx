'use client'

import Link from 'next/link'
import { 
  ShoppingCart, 
  Utensils, 
  Flame, 
  Sparkles, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Clock 
} from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useState, useEffect } from 'react'
import { useStoreTenant } from '@/lib/useStoreTenant'

function InstagramIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  )
}

export default function EcommerceLayout({ children }: { children: React.ReactNode }) {
  const { items } = useCartStore()
  const { restaurant, href, storePath } = useStoreTenant()
  const [mounted, setMounted] = useState(false)
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0)

  useEffect(() => setMounted(true), [])

  const primaryColor = restaurant?.primary_color || '#e59324'
  const secondaryColor = restaurant?.secondary_color || '#d34e2c'
  const themeClass = restaurant?.theme_style ? `theme-${restaurant.theme_style}` : 'theme-rustic'
  const fontClass = `font-style-${restaurant?.font_style || 'serif'}`
  const announcementText = restaurant?.announcement_banner || '🔥 Horno encendido y cocina despachando pedidos en vivo'
  const showAnnouncement = restaurant?.announcement_enabled !== false
  const deliveryTime = restaurant?.estimated_delivery_time || '35-45 min'

  return (
    <div 
      className={`flex flex-col min-h-screen text-[#fcf9f5] ${themeClass} ${fontClass}`}
      style={{
        '--brand-primary': primaryColor,
        '--brand-secondary': secondaryColor,
        '--color-primary': primaryColor,
        '--color-secondary': secondaryColor,
        '--primary': primaryColor,
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
            color: 'var(--store-text-soft, #e8caa4)'
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
          <div className="flex justify-between items-center h-22 py-3">
            
            {/* Logo / Brand */}
            <Link href={storePath} className="flex items-center space-x-3.5 group">
              {restaurant?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={restaurant.logo_url} 
                  alt={restaurant.name} 
                  className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-2xl bg-black/40 p-1 border shadow-md group-hover:scale-105 transition-all" 
                  style={{ borderColor: `${primaryColor}50` }}
                />
              ) : (
                <div 
                  className="p-3 rounded-2xl group-hover:rotate-6 transition-all duration-300 shadow-lg text-white"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    boxShadow: `0 4px 14px ${primaryColor}40`
                  }}
                >
                  <Flame className="w-7 h-7" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-rustic text-2xl font-bold tracking-tight text-[#fcf9f5]">
                  {restaurant?.name || 'La Rotisería'}
                </span>
                <span className="text-[11px] text-[color:var(--store-text-muted)] -mt-0.5 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3" style={{ color: primaryColor }} />
                  Tienda Oficial • Sabor Casero
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                href={storePath} 
                className="text-[color:var(--store-text-soft)] transition-colors font-medium text-sm flex items-center gap-1.5 hover:text-white"
              >
                <Utensils className="w-4 h-4" style={{ color: primaryColor }} />
                Carta & Menú
              </Link>
              <Link 
                href={href('/seguimiento')} 
                className="text-[color:var(--store-text-soft)] transition-colors font-medium text-sm hover:text-white"
              >
                Seguimiento en Vivo
              </Link>
              <Link 
                href="/" 
                className="text-xs text-[color:var(--store-text-muted)] hover:text-[#fcf9f5] px-3 py-1.5 rounded-lg border border-[color:var(--store-border)] hover:border-[color:var(--brand-primary)] transition-all"
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

      {/* Warm Footer with Contact & Service Bubbles */}
      <footer 
        className="border-t py-12 text-[color:var(--store-text-muted)] transition-colors"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          borderColor: `${primaryColor}20`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4">
              {restaurant?.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={restaurant.logo_url} 
                  alt={restaurant.name} 
                  className="w-16 h-16 object-cover rounded-2xl bg-black/40 p-1 border shadow-md shrink-0" 
                  style={{ borderColor: `${primaryColor}40` }}
                />
              )}
              <div>
                <p className="font-rustic text-xl font-bold text-[#fcf9f5] mb-1">
                  {restaurant?.name || 'ComandApp • Tienda Online'}
                </p>
                <p className="text-sm text-[color:var(--store-text-muted)] max-w-md">
                  {restaurant?.footer_custom_text || restaurant?.description || 'Cocina tradicional, recetas familiares y entrega directa sin intermediarios.'}
                </p>
                {restaurant?.opening_hours && (
                  <p className="text-xs mt-2 text-[color:var(--store-text-soft)]">
                    🕒 Horarios de atención: <span className="text-[#fcf9f5] font-medium">{restaurant.opening_hours}</span>
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
              <div 
                className="badge-rustic"
                style={{
                  borderColor: `${primaryColor}40`,
                  color: primaryColor
                }}
              >
                <span>⚡ 0% Comisiones • Software Gastronómico</span>
              </div>
              <p className="text-xs text-[color:var(--store-text-faint)]">
                Potenciado por <Link href="/" className="hover:underline font-semibold" style={{ color: primaryColor }}>ComandApp</Link> © {new Date().getFullYear()}
              </p>
            </div>
          </div>

          {/* Burbujas de Contacto, Redes y Servicios en el Footer */}
          {restaurant && (
            <div 
              className="pt-6 border-t flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-[color:var(--store-text-muted)]"
              style={{ borderColor: `${primaryColor}15` }}
            >
              {restaurant.address && (
                restaurant.google_maps_url ? (
                  <a
                    href={restaurant.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 backdrop-blur-sm px-3.5 py-2 rounded-xl border hover:border-white/30 transition-colors"
                    style={{ backgroundColor: 'var(--store-card-bg, #2b211a)', borderColor: 'var(--store-border, #44372e)' }}
                  >
                    <MapPin className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                    <span>{restaurant.address} (Ver Mapa)</span>
                  </a>
                ) : (
                  <span 
                    className="flex items-center gap-1.5 backdrop-blur-sm px-3.5 py-2 rounded-xl border"
                    style={{ backgroundColor: 'var(--store-card-bg, #2b211a)', borderColor: 'var(--store-border, #44372e)' }}
                  >
                    <MapPin className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                    {restaurant.address}
                  </span>
                )
              )}

              {restaurant.phone && (
                <a 
                  href={`tel:${restaurant.phone}`} 
                  className="flex items-center gap-1.5 backdrop-blur-sm px-3.5 py-2 rounded-xl border hover:border-white/30 transition-colors"
                  style={{ backgroundColor: 'var(--store-card-bg, #2b211a)', borderColor: 'var(--store-border, #44372e)' }}
                >
                  <Phone className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                  {restaurant.phone}
                </a>
              )}

              {restaurant.whatsapp_number && (
                <a 
                  href={`https://wa.me/${restaurant.whatsapp_number.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-[#14321c]/90 text-emerald-300 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-emerald-600/40 hover:bg-[#1a4225] transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  WhatsApp
                </a>
              )}

              {restaurant.instagram_handle && (
                <a 
                  href={`https://instagram.com/${restaurant.instagram_handle.replace('@', '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-[#2b211a]/90 text-pink-300 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-pink-700/30 hover:border-pink-500/50 transition-colors"
                >
                  <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                  {restaurant.instagram_handle}
                </a>
              )}

              {restaurant.facebook_url && (
                <a 
                  href={restaurant.facebook_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-[#17253d]/90 text-blue-300 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-blue-700/30 hover:border-blue-500/50 transition-colors"
                >
                  <span className="font-bold text-xs text-blue-400">f</span>
                  Facebook
                </a>
              )}

              {restaurant.tiktok_handle && (
                <a 
                  href={`https://tiktok.com/@${restaurant.tiktok_handle.replace('@', '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-[#121c24]/90 text-cyan-300 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-cyan-700/30 hover:border-cyan-500/50 transition-colors"
                >
                  <span className="font-bold text-xs text-cyan-400">t</span>
                  {restaurant.tiktok_handle}
                </a>
              )}

              <span 
                className="flex items-center gap-1.5 backdrop-blur-sm px-3.5 py-2 rounded-xl border"
                style={{ backgroundColor: 'var(--store-card-bg, #2b211a)', borderColor: 'var(--store-border, #44372e)' }}
              >
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Demora: {deliveryTime}
              </span>

              {restaurant.delivery_cost && (
                <span 
                  className="flex items-center gap-1.5 backdrop-blur-sm px-3.5 py-2 rounded-xl border"
                  style={{ backgroundColor: 'var(--store-card-bg, #2b211a)', borderColor: 'var(--store-border, #44372e)' }}
                >
                  <span>Envío: {restaurant.delivery_cost}</span>
                </span>
              )}
            </div>
          )}

        </div>
      </footer>
    </div>
  )
}
