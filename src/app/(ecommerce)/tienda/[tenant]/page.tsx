import { notFound } from 'next/navigation'
import { getProducts, getRestaurantStrict } from '@/lib/api'
import ProductCatalog from '../../components/ProductCatalog'
import { 
  Flame, 
  Clock, 
  Heart, 
  Award, 
  Sparkles, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Store 
} from 'lucide-react'

function InstagramIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  )
}

export const revalidate = 60

export default async function TenantTiendaPage({ 
  params 
}: { 
  params: Promise<{ tenant: string }> 
}) {
  const { tenant } = await params
  const restaurant = await getRestaurantStrict(tenant)
  if (!restaurant) notFound()
  const products = await getProducts(restaurant.id)

  const categories = Array.from(new Set(products.map(p => p.category)))

  const primaryColor = restaurant.primary_color || '#e59324'
  const secondaryColor = restaurant.secondary_color || '#d34e2c'
  const bannerUrl = restaurant.banner_url || '/hero_rotiseria.jpg'
  const logoUrl = restaurant.logo_url
  const deliveryTime = restaurant.estimated_delivery_time || '35-45 min'
  const tag1 = restaurant.highlight_tag_1 || 'Horno a Leña & Fuego'
  const tag2 = restaurant.highlight_tag_2 || '100% Casero'
  const tag3 = restaurant.highlight_tag_3 || 'Atención Directa'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Store Closed Notice */}
      {restaurant.is_store_open === false && (
        <div className="bg-rose-950/90 border border-rose-500/50 p-4 rounded-2xl text-center text-rose-200 text-sm flex items-center justify-center gap-2 shadow-xl animate-in fade-in">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span>
            <strong>Local Cerrado Temporalmente:</strong> {restaurant.closed_message || 'El horno está apagado por ahora. ¡Vuelve pronto!'}
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
          
          <div className="max-w-2xl text-center md:text-left">
            {/* Logo + Subdomain Badge + Discount */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={logoUrl} 
                  alt={restaurant.name} 
                  className="w-12 h-12 object-contain rounded-2xl bg-black/50 p-1.5 border border-white/10 shadow-lg" 
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Store className="w-5 h-5" />
                </div>
              )}

              <div 
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border shadow-sm backdrop-blur-sm"
                style={{
                  color: primaryColor,
                  borderColor: `${primaryColor}40`,
                  backgroundColor: `${primaryColor}15`
                }}
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                <span>Tienda Oficial • {restaurant.subdomain}.comandapp.com</span>
              </div>

              {Number(restaurant.cash_discount_percentage) > 0 && (
                <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm backdrop-blur-sm">
                  <span>⚡ {restaurant.cash_discount_percentage}% OFF en Efectivo</span>
                </div>
              )}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold font-rustic text-[#fcf9f5] mb-4 leading-tight">
              {restaurant.name}
            </h1>
            
            <p className="text-lg text-[color:var(--store-text-soft)] mb-6 leading-relaxed">
              {restaurant.description || 'Comida recién hecha a mano, respetando los tiempos y el amor de la cocina tradicional. Pide online y recíbelo humeante en tu casa.'}
            </p>

            {/* Badges de Contacto & Servicios */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-[color:var(--store-text-muted)]">
              {restaurant.address && (
                restaurant.google_maps_url ? (
                  <a
                    href={restaurant.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 backdrop-blur-sm px-3 py-1.5 rounded-xl border hover:border-white/30 transition-colors"
                    style={{ backgroundColor: 'var(--store-card-bg, #2b211a)', borderColor: 'var(--store-border, #44372e)' }}
                  >
                    <MapPin className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                    <span>{restaurant.address} (Ver Mapa)</span>
                  </a>
                ) : (
                  <span 
                    className="flex items-center gap-1.5 backdrop-blur-sm px-3 py-1.5 rounded-xl border"
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
                  className="flex items-center gap-1.5 backdrop-blur-sm px-3 py-1.5 rounded-xl border hover:border-white/30 transition-colors"
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
                  className="flex items-center gap-1.5 bg-[#14321c]/90 text-emerald-300 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-emerald-600/40 hover:bg-[#1a4225] transition-colors"
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
                  className="flex items-center gap-1.5 bg-[#2b211a]/90 text-pink-300 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-pink-700/30 hover:border-pink-500/50 transition-colors"
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
                  className="flex items-center gap-1.5 bg-[#17253d]/90 text-blue-300 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-blue-700/30 hover:border-blue-500/50 transition-colors"
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
                  className="flex items-center gap-1.5 bg-[#121c24]/90 text-cyan-300 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-cyan-700/30 hover:border-cyan-500/50 transition-colors"
                >
                  <span className="font-bold text-xs text-cyan-400">t</span>
                  {restaurant.tiktok_handle}
                </a>
              )}
              <span 
                className="flex items-center gap-1.5 backdrop-blur-sm px-3 py-1.5 rounded-xl border"
                style={{ backgroundColor: 'var(--store-card-bg, #2b211a)', borderColor: 'var(--store-border, #44372e)' }}
              >
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Demora: {deliveryTime}
              </span>
              {restaurant.delivery_cost && (
                <span 
                  className="flex items-center gap-1.5 backdrop-blur-sm px-3 py-1.5 rounded-xl border"
                  style={{ backgroundColor: 'var(--store-card-bg, #2b211a)', borderColor: 'var(--store-border, #44372e)' }}
                >
                  <span>Envío: {restaurant.delivery_cost}</span>
                </span>
              )}
            </div>

            {restaurant.opening_hours && (
              <p className="text-[11px] mt-3" style={{ color: 'var(--store-text-muted, #8c6f59)' }}>
                🕒 Horarios: <span className="text-[#fcf9f5]">{restaurant.opening_hours}</span>
              </p>
            )}
          </div>

          {/* Highlights Box */}
          <div 
            className="w-full md:w-auto border rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col gap-4 text-sm text-[color:var(--store-text-soft)]"
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
      />
    </div>
  )
}
