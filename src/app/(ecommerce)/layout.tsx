'use client'

import Link from 'next/link'
import {
    ShoppingCart,
    Utensils,
    Flame,
    Sparkles,
    MapPin,
    Phone,
    Clock,
    Truck,
    CreditCard,
    ExternalLink
  } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useState, useEffect } from 'react'
import { useStoreTenant } from '@/lib/useStoreTenant'

  function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
    return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
        )
}

        function FacebookIcon({className = 'w-4 h-4'}: {className ?: string}) {
  return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
        )
}

        function TikTokIcon({className = 'w-4 h-4'}: {className ?: string}) {
  return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.4a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 9.27 5.6 6.32 6.32 0 0 0 3.47-5.61V8.49a8.27 8.27 0 0 0 5-1.8z" />
        </svg>
        )
}

        function WhatsAppIcon({className = 'w-4 h-4'}: {className ?: string}) {
  return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.03 2c-5.51 0-9.98 4.47-9.98 9.98 0 1.76.46 3.48 1.33 4.99L2 22l5.16-1.35a9.94 9.94 0 0 0 4.87 1.27h.01c5.51 0 9.98-4.47 9.98-9.98 0-2.67-1.04-5.17-2.92-7.06A9.92 9.92 0 0 0 12.03 2zm5.82 14.27c-.24.69-1.42 1.32-1.97 1.4-.51.08-1.15.11-1.86-.12-.43-.14-.98-.32-1.69-.63-2.98-1.29-4.93-4.29-5.08-4.49-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.48.27-.3.6-.37.8-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.24.59.84 2.05.91 2.2.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.6.17.3.77 1.27 1.66 2.06 1.14 1.02 2.1 1.33 2.4 1.48.3.15.47.12.65-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.73.82 2.03.97.3.15.49.22.57.35.07.12.07.72-.17 1.41z" />
        </svg>
        )
}

        function buildInstagramUrl(handleOrUrl: string): string {
  const clean = handleOrUrl.trim()
        if (/^https?:\/\//i.test(clean)) return clean
        return `https://instagram.com/${clean.replace(/^@/, '').replace(/\/+$/, '')}`
}

        function buildFacebookUrl(urlOrSlug: string): string {
  const clean = urlOrSlug.trim()
        if (/^https?:\/\//i.test(clean)) return clean
        if (clean.includes('facebook.com') || clean.includes('fb.com')) return `https://${clean}`
        return `https://facebook.com/${clean.replace(/^@/, '')}`
}

        function buildTikTokUrl(handleOrUrl: string): string {
  const clean = handleOrUrl.trim()
        if (/^https?:\/\//i.test(clean)) return clean
        return `https://tiktok.com/@${clean.replace(/^@/, '')}`
}

        export default function EcommerceLayout({children}: {children: React.ReactNode }) {
  const {items} = useCartStore()
        const {restaurant, href, storePath} = useStoreTenant()
        const [mounted, setMounted] = useState(false)
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0)

  useEffect(() => setMounted(true), [])

  const primaryColor = restaurant?.primary_color || '#e59324'
  const secondaryColor = restaurant?.secondary_color || '#d34e2c'
  const themeClass = restaurant?.theme_style ? 'theme-' + restaurant.theme_style : 'theme-rustic'
  const fontClass = 'font-style-' + (restaurant?.font_style || 'serif')
  const announcementText =
    restaurant?.announcement_banner || '🔥 Horno encendido y cocina despachando pedidos en vivo'
  const showAnnouncement = restaurant?.announcement_enabled !== false
  const deliveryTime = restaurant?.estimated_delivery_time || '35-45 min'
        // Construir únicamente las redes sociales que fueron configuradas
        const whatsappDigits = (restaurant?.whatsapp_number || '').replace(/[^0-9]/g, '')
        const socialLinks = [
        whatsappDigits
        ? {
          id: 'whatsapp',
        label: 'WhatsApp',
        href: `https://wa.me/${whatsappDigits}`,
        icon: WhatsAppIcon,
        hoverClass: 'hover:border-emerald-500/60 hover:bg-emerald-500/15 hover:text-emerald-300'
        }
        : null,
        restaurant?.instagram_handle?.trim()
        ? {
          id: 'instagram',
        label: `Instagram (${restaurant.instagram_handle.trim()})`,
        href: buildInstagramUrl(restaurant.instagram_handle),
        icon: InstagramIcon,
        hoverClass: 'hover:border-pink-500/60 hover:bg-pink-500/15 hover:text-pink-300'
        }
        : null,
        restaurant?.facebook_url?.trim()
        ? {
          id: 'facebook',
        label: 'Facebook',
        href: buildFacebookUrl(restaurant.facebook_url),
        icon: FacebookIcon,
        hoverClass: 'hover:border-blue-500/60 hover:bg-blue-500/15 hover:text-blue-300'
        }
        : null,
        restaurant?.tiktok_handle?.trim()
        ? {
          id: 'tiktok',
        label: `TikTok (${restaurant.tiktok_handle.trim()})`,
        href: buildTikTokUrl(restaurant.tiktok_handle),
        icon: TikTokIcon,
        hoverClass: 'hover:border-cyan-400/60 hover:bg-cyan-500/15 hover:text-cyan-200'
        }
        : null
        ].filter(Boolean) as {
          id: string
        label: string
        href: string
        icon: React.ComponentType<{ className ?: string}>
          hoverClass: string
  }[]

          // Medios de pago habilitados para mostrar ordenadamente
          const paymentMethods = [
          restaurant?.accepts_cash !== false ? 'Efectivo' : null,
          restaurant?.accepts_transfer !== false ? 'Transferencia' : null,
          restaurant?.accepts_card !== false ? 'Tarjeta' : null
          ].filter(Boolean)

          return (
            <div
      className={`flex flex-col min-h-screen text-[#fcf9f5] ${themeClass} ${fontClass}`}
            style={
              {
                '--brand-primary': primaryColor,
                '--brand-secondary': secondaryColor,
                '--color-primary': primaryColor,
                '--color-secondary': secondaryColor,
                '--primary': primaryColor,
                backgroundColor: 'var(--store-bg, #151210)'
              } as React.CSSProperties
            }
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
                  <ShoppingCart
                    className="w-5 h-5 transition-transform group-hover:scale-110"
                    style={{ color: primaryColor }}
                  />
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
      </header >

      <main className="flex-grow">{children}</main>

      {/* Structured & Organized Store Footer */}
      <footer
        className="border-t pt-14 pb-8 text-[color:var(--store-text-muted)] transition-colors"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--store-bg, #151210) 65%, #070504)',
          borderColor: `${primaryColor}22`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            {/* Columna 1: Identidad del Local & Redes Sociales */}
            <div className="sm:col-span-2 lg:col-span-4 space-y-4">
              <Link href={storePath} className="inline-flex items-center gap-3.5 group">
                {restaurant?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={restaurant.logo_url}
                    alt={restaurant.name}
                    className="w-12 h-12 object-cover rounded-xl bg-black/40 p-1 border shadow-md shrink-0"
                    style={{ borderColor: `${primaryColor}45` }}
                  />
                ) : (
                  <div
                    className="p-2.5 rounded-xl text-white shadow-md shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                    }}
                  >
                    <Flame className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <p className="font-rustic text-xl font-bold text-[#fcf9f5] leading-tight">
                    {restaurant?.name || 'La Rotisería'}
                  </p>
                  <p className="text-[11px] font-medium" style={{ color: primaryColor }}>
                    Tienda Oficial Online
                  </p>
                </div>
              </Link>

              <p className="text-sm leading-relaxed text-[color:var(--store-text-muted)] max-w-sm">
                {restaurant?.footer_custom_text ||
                  restaurant?.description ||
                  'Cocina tradicional, recetas familiares y entrega directa sin intermediarios.'}
              </p>

              {/* Burbujas circulares exclusivas para redes sociales activas */}
              {socialLinks.length > 0 && (
                <div className="pt-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--store-text-faint)] mb-2.5">
                    Nuestras Redes
                  </p>
                  <div className="flex items-center gap-2.5">
                    {socialLinks.map((social) => {
                      const IconComponent = social.icon
                      return (
                        <a
                          key={social.id}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={social.label}
                          title={social.label}
                          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 shadow-sm text-[color:var(--store-text-soft,#e8caa4)] ${social.hoverClass}`}
                          style={{
                            backgroundColor: 'var(--store-card-bg, #221914)',
                            borderColor: 'var(--store-border, #3d2f25)'
                          }}
                        >
                          <IconComponent className="w-4 h-4" />
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Columna 2: Navegación Rápida */}
            <div className="lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#fcf9f5] mb-4">
                Navegación
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link
                    href={storePath}
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    Carta & Menú
                  </Link>
                </li>
                <li>
                  <Link
                    href={href('/carrito')}
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    Mi Comanda
                  </Link>
                </li>
                <li>
                  <Link
                    href={href('/seguimiento')}
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    Seguimiento en Vivo
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    Sobre ComandApp
                  </Link>
                </li>
              </ul>
            </div>

            {/* Columna 3: Contacto & Ubicación */}
            <div className="lg:col-span-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#fcf9f5] mb-4">
                Contacto & Local
              </h3>
              <ul className="space-y-3 text-sm">
                {restaurant?.address?.trim() && (
                  <li className="flex items-start gap-2.5">
                    <MapPin
                      className="w-4 h-4 shrink-0 mt-0.5"
                      style={{ color: primaryColor }}
                    />
                    <div className="leading-snug">
                      <span className="text-[color:var(--store-text-soft)] block">
                        {restaurant.address}
                      </span>
                      {restaurant.google_maps_url?.trim() && (
                        <a
                          href={restaurant.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium mt-0.5 hover:underline"
                          style={{ color: primaryColor }}
                        >
                          <span>Ver en Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </li>
                )}

                {restaurant?.phone?.trim() && (
                  <li className="flex items-center gap-2.5">
                    <Phone
                      className="w-4 h-4 shrink-0"
                      style={{ color: primaryColor }}
                    />
                    <a
                      href={`tel:${restaurant.phone}`}
                      className="text-[color:var(--store-text-soft)] hover:text-white transition-colors"
                    >
                      {restaurant.phone}
                    </a>
                  </li>
                )}

                {restaurant?.opening_hours?.trim() && (
                  <li className="flex items-start gap-2.5">
                    <Clock
                      className="w-4 h-4 shrink-0 mt-0.5"
                      style={{ color: primaryColor }}
                    />
                    <div className="leading-snug">
                      <span className="text-xs text-[color:var(--store-text-faint)] block">
                        Horarios de atención
                      </span>
                      <span className="text-[color:var(--store-text-soft)]">
                        {restaurant.opening_hours}
                      </span>
                    </div>
                  </li>
                )}
              </ul>
            </div>

            {/* Columna 4: Información Operativa & Envíos */}
            <div className="lg:col-span-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#fcf9f5] mb-4">
                Servicio & Envíos
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      restaurant?.is_store_open === false
                        ? 'bg-rose-500'
                        : 'bg-emerald-400 animate-pulse'
                    }`}
                  />
                  <span
                    className={
                      restaurant?.is_store_open === false
                        ? 'text-rose-300 font-medium'
                        : 'text-emerald-300 font-medium'
                    }
                  >
                    {restaurant?.is_store_open === false
                      ? 'Local cerrado temporalmente'
                      : 'Abierto recibiendo pedidos'}
                  </span>
                </li>

                <li className="flex items-center gap-2.5">
                  <Truck
                    className="w-4 h-4 shrink-0"
                    style={{ color: primaryColor }}
                  />
                  <span>
                    Demora estimada:{' '}
                    <strong className="text-[#fcf9f5] font-medium">{deliveryTime}</strong>
                    {restaurant?.delivery_cost?.trim()
                      ? ` • Envío: ${restaurant.delivery_cost}`
                      : ''}
                  </span>
                </li>

                {paymentMethods.length > 0 && (
                  <li className="flex items-start gap-2.5">
                    <CreditCard
                      className="w-4 h-4 shrink-0 mt-0.5"
                      style={{ color: primaryColor }}
                    />
                    <span>
                      Medios de pago:{' '}
                      <span className="text-[color:var(--store-text-soft)]">
                        {paymentMethods.join(', ')}
                      </span>
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Barra Inferior Legal & Plataforma */}
          <div
            className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[color:var(--store-text-faint)]"
            style={{ borderColor: `${primaryColor}18` }}
          >
            <p>
              © {new Date().getFullYear()} {restaurant?.name || 'La Rotisería'}. Todos los derechos
              reservados.
            </p>
            <p className="flex items-center gap-1.5">
              <span>Pedidos directos 0% comisiones • Potenciado por</span>
              <Link
                href="/"
                className="font-semibold hover:underline transition-colors"
                style={{ color: primaryColor }}
              >
                ComandApp
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div >
  )
  }
