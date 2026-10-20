'use client'

import { useEffect, useState, useRef } from 'react'
import { 
  Save, 
  Store, 
  Globe, 
  MapPin, 
  Phone, 
  Loader2, 
  Palette, 
  Clock, 
  MessageCircle, 
  Sparkles, 
  ExternalLink,
  Award,
  Flame,
  Heart,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Type,
  Layout,
  Megaphone,
  CreditCard,
  Banknote,
  DollarSign,
  Power,
  Navigation,
  Percent,
  Sliders
} from 'lucide-react'
import { updateRestaurantBranding, uploadRestaurantMedia, type RestaurantInfo } from '@/lib/api'
import { useAdminRestaurant, useSetAdminRestaurant } from '@/lib/AdminContext'
import { buildTenantUrl } from '@/lib/tenant'

function InstagramIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  )
}

function TikTokIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.4a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 9.27 5.6 6.32 6.32 0 0 0 3.47-5.61V8.49a8.27 8.27 0 0 0 5-1.8z"/>
    </svg>
  )
}

const COLOR_PRESETS = [
  { name: 'Ámbar Leña & Fuego', primary: '#e59324', secondary: '#d34e2c' },
  { name: 'Rojo Pasión & Bodegón', primary: '#dc2626', secondary: '#991b1b' },
  { name: 'Verde Pesto & Huerta', primary: '#16a34a', secondary: '#15803d' },
  { name: 'Dorado Asador Criollo', primary: '#f59e0b', secondary: '#b45309' },
  { name: 'Borgoña & Vinoteca', primary: '#e11d48', secondary: '#9f1239' },
  { name: 'Azul & Minutas de Mar', primary: '#2563eb', secondary: '#1e40af' },
]

const THEME_PRESETS = [
  { 
    id: 'rustic', 
    name: 'Rústico Cálido', 
    desc: 'Madera, carbón y calidez hogareña', 
    bg: '#151210', 
    card: '#1f1814' 
  },
  { 
    id: 'midnight', 
    name: 'Negro Carbón (Dark)', 
    desc: 'Estilo moderno, limpio y de alto contraste', 
    bg: '#0b0d10', 
    card: '#151b24' 
  },
  { 
    id: 'bodegon', 
    name: 'Bodegón Tradicional', 
    desc: 'Tonos borgoña profundos y aire clásico', 
    bg: '#170f14', 
    card: '#241620' 
  },
  { 
    id: 'espresso', 
    name: 'Espresso & Tostado', 
    desc: 'Cafetería gourmet y tonos tostados', 
    bg: '#141110', 
    card: '#221c1a' 
  },
  { 
    id: 'olive', 
    name: 'Oliva & Jardín', 
    desc: 'Botánico natural, fresco y sustentable', 
    bg: '#0e1511', 
    card: '#17261d' 
  },
] as const

const BANNER_PRESETS = [
  { name: 'Horno Tradicional & Empanadas', url: '/hero_rotiseria.jpg' },
  { name: 'Platos Artesanales & Tablas', url: '/artisanal_dishes.jpg' },
]

export default function SettingsPage() {
  const restaurant = useAdminRestaurant()
  const setAdminRestaurant = useSetAdminRestaurant()

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false)
  const [showBannerUrlInput, setShowBannerUrlInput] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Estado del formulario con todos los controles
  const [formData, setFormData] = useState<Partial<RestaurantInfo>>({
    name: '',
    subdomain: '',
    description: '',
    address: '',
    phone: '',
    whatsapp_number: '',
    instagram_handle: '',
    facebook_url: '',
    tiktok_handle: '',
    google_maps_url: '',
    opening_hours: '',
    logo_url: '',
    banner_url: '/hero_rotiseria.jpg',
    primary_color: '#e59324',
    secondary_color: '#d34e2c',
    theme_style: 'rustic',
    font_style: 'serif',
    announcement_banner: '🔥 Horno encendido y cocina despachando pedidos en vivo',
    announcement_enabled: true,
    estimated_delivery_time: '35-45 min',
    highlight_tag_1: 'Horno a Leña & Fuego',
    highlight_tag_2: '100% Casero',
    highlight_tag_3: 'Atención Directa',
    
    // Controles de Operación
    is_store_open: true,
    closed_message: 'Horno cerrado por el momento. ¡Abrimos pronto!',
    min_order_amount: 0,
    delivery_cost: 'A coordinar',
    
    // Medios de pago
    accepts_cash: true,
    accepts_transfer: true,
    transfer_alias: '',
    accepts_card: true,
    cash_discount_percentage: 0,
    
    // Apariencia y textos
    hero_cta_text: 'Pedir al plato',
    hero_overlay_opacity: 'dark',
    footer_custom_text: 'Cocina tradicional, recetas familiares y entrega directa sin intermediarios.'
  })

  useEffect(() => {
    if (!restaurant) return
    setFormData({
      name: restaurant.name || '',
      subdomain: restaurant.subdomain || '',
      description: restaurant.description || '',
      address: restaurant.address || '',
      phone: restaurant.phone || '',
      whatsapp_number: restaurant.whatsapp_number || restaurant.phone || '',
      instagram_handle: restaurant.instagram_handle || '',
      facebook_url: restaurant.facebook_url || '',
      tiktok_handle: restaurant.tiktok_handle || '',
      google_maps_url: restaurant.google_maps_url || '',
      opening_hours: restaurant.opening_hours || 'Martes a Domingo: 19:30 a 23:45',
      logo_url: restaurant.logo_url || '',
      banner_url: restaurant.banner_url || '/hero_rotiseria.jpg',
      primary_color: restaurant.primary_color || '#e59324',
      secondary_color: restaurant.secondary_color || '#d34e2c',
      theme_style: restaurant.theme_style || 'rustic',
      font_style: restaurant.font_style || 'serif',
      announcement_banner: restaurant.announcement_banner || '🔥 Horno encendido y cocina despachando pedidos en vivo',
      announcement_enabled: restaurant.announcement_enabled !== false,
      estimated_delivery_time: restaurant.estimated_delivery_time || '35-45 min',
      highlight_tag_1: restaurant.highlight_tag_1 || 'Horno a Leña & Fuego',
      highlight_tag_2: restaurant.highlight_tag_2 || '100% Casero',
      highlight_tag_3: restaurant.highlight_tag_3 || 'Atención Directa',
      is_store_open: restaurant.is_store_open !== false,
      closed_message: restaurant.closed_message || 'Horno cerrado por el momento. ¡Abrimos pronto!',
      min_order_amount: restaurant.min_order_amount || 0,
      delivery_cost: restaurant.delivery_cost || 'A coordinar',
      accepts_cash: restaurant.accepts_cash !== false,
      accepts_transfer: restaurant.accepts_transfer !== false,
      transfer_alias: restaurant.transfer_alias || '',
      accepts_card: restaurant.accepts_card !== false,
      cash_discount_percentage: restaurant.cash_discount_percentage || 0,
      hero_cta_text: restaurant.hero_cta_text || 'Pedir al plato',
      hero_overlay_opacity: restaurant.hero_overlay_opacity || 'dark',
      footer_custom_text: restaurant.footer_custom_text || 'Cocina tradicional, recetas familiares y entrega directa sin intermediarios.'
    })
  }, [restaurant])

  // Subir Logo desde archivo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    setError('')
    try {
      const url = await uploadRestaurantMedia(file, 'logo', restaurant?.id || 'default')
      setFormData(prev => ({ ...prev, logo_url: url }))
    } catch (err: any) {
      console.error('Error uploading logo:', err)
      setError('No se pudo procesar la imagen del logo.')
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  // Subir Banner desde archivo
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBanner(true)
    setError('')
    try {
      const url = await uploadRestaurantMedia(file, 'banner', restaurant?.id || 'default')
      setFormData(prev => ({ ...prev, banner_url: url }))
    } catch (err: any) {
      console.error('Error uploading banner:', err)
      setError('No se pudo procesar la imagen de portada.')
    } finally {
      setUploadingBanner(false)
      if (bannerInputRef.current) bannerInputRef.current.value = ''
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurant?.id) {
      setError('No hay un local asociado a esta sesión.')
      return
    }
    setLoading(true)
    setSaved(false)
    setError('')

    try {
      await updateRestaurantBranding(restaurant.id, formData)
      
      // Actualizar el estado global del panel de administración en vivo
      if (setAdminRestaurant) {
        setAdminRestaurant({
          ...restaurant,
          ...formData
        } as RestaurantInfo)
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } catch (err: any) {
      console.error('Error saving restaurant branding:', err)
      setError(err?.message || 'No se pudieron guardar los cambios.')
    } finally {
      setLoading(false)
    }
  }

  const publicStoreUrl = formData.subdomain 
    ? (typeof window !== 'undefined' ? buildTenantUrl(formData.subdomain) : `/tienda/${formData.subdomain}`)
    : '/tienda'

  const currentTheme = THEME_PRESETS.find(t => t.id === formData.theme_style) || THEME_PRESETS[0]
  const activePrimary = formData.primary_color || '#e59324'
  const activeSecondary = formData.secondary_color || '#d34e2c'

  // Opacidad del banner de portada
  const overlayGradient = formData.hero_overlay_opacity === 'light'
    ? 'linear-gradient(to right, rgba(15, 12, 10, 0.75), rgba(20, 16, 13, 0.65), rgba(15, 12, 10, 0.70))'
    : formData.hero_overlay_opacity === 'medium'
    ? 'linear-gradient(to right, rgba(15, 12, 10, 0.85), rgba(20, 16, 13, 0.78), rgba(15, 12, 10, 0.82))'
    : 'linear-gradient(to right, rgba(15, 12, 10, 0.94), rgba(20, 16, 13, 0.88), rgba(15, 12, 10, 0.92))'

  return (
    <div 
      className="max-w-5xl mx-auto space-y-8 pb-20 transition-colors"
      style={{
        '--brand-primary': activePrimary,
        '--brand-secondary': activeSecondary,
      } as React.CSSProperties}
    >
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="w-2.5 h-2.5 rounded-full animate-pulse" 
              style={{ backgroundColor: activePrimary }} 
            />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: activePrimary }}>
              Estudio de Personalización & Operaciones
            </span>
          </div>
          <h1 className="text-3xl font-bold font-rustic text-white tracking-wide">
            Control Total de tu Tienda Online
          </h1>
          <p className="text-xs text-[#a88a70] mt-1">
            Personaliza en profundidad colores, logos, banners, medios de pago, pedido mínimo y horarios de atención.
          </p>
        </div>

        <a
          href={publicStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold shrink-0"
        >
          <span>Ver Tienda Pública</span>
          <ExternalLink className="w-3.5 h-3.5" style={{ color: activePrimary }} />
        </a>
      </div>

      {/* Alertas */}
      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>¡Personalización guardada con éxito! Toda tu tienda y panel de administración se han actualizado.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in">
          <X className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">

        {/* ===================================================================== */}
        {/* SECCIÓN 1: VISTA PREVIA EN TIEMPO REAL */}
        {/* ===================================================================== */}
        <div className="bg-[#1b1511] border border-[#382b21] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a88a70] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" style={{ color: activePrimary }} />
              Vista Previa Interactiva en Vivo
            </span>
            <span className="text-[11px] text-[#8c6f59]">
              Reacciona de inmediato a cada cambio
            </span>
          </div>

          {/* Estado del local en la previa */}
          {!formData.is_store_open && (
            <div className="py-2 px-4 rounded-xl bg-rose-950/80 border border-rose-600/40 text-rose-200 text-xs text-center font-medium flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>🔴 Local Cerrado: {formData.closed_message}</span>
            </div>
          )}

          {/* Mini Top Announcement Preview */}
          {formData.announcement_enabled && (
            <div 
              className="py-1 px-3 rounded-t-xl text-[11px] text-center font-medium border-b flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderColor: `${activePrimary}30`,
                color: '#fcf9f5'
              }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activePrimary }} />
              <span>{formData.announcement_banner}</span>
            </div>
          )}

          {/* Card Hero Preview */}
          <div 
            className="relative rounded-2xl overflow-hidden border p-6 sm:p-8 transition-all"
            style={{
              borderColor: `${activePrimary}40`,
              backgroundImage: `${overlayGradient}, url(${formData.banner_url || '/hero_rotiseria.jpg'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: currentTheme.bg
            }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                {/* Logo Preview */}
                {formData.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formData.logo_url}
                    alt="Logo Preview"
                    className="w-16 h-16 object-contain rounded-2xl bg-black/60 p-1.5 border shadow-xl shrink-0"
                    style={{ borderColor: `${activePrimary}50` }}
                  />
                ) : (
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0"
                    style={{ 
                      background: `linear-gradient(135deg, ${activePrimary}, ${activeSecondary})`,
                      boxShadow: `0 4px 14px ${activePrimary}50`
                    }}
                  >
                    <Flame className="w-8 h-8" />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <div 
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm backdrop-blur-sm"
                      style={{
                        color: activePrimary,
                        borderColor: `${activePrimary}50`,
                        backgroundColor: `${activePrimary}15`
                      }}
                    >
                      <span>{formData.subdomain || 'mi-rotiseria'}.comandapp.com</span>
                    </div>

                    {Number(formData.cash_discount_percentage) > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                        ⚡ {formData.cash_discount_percentage}% OFF en Efectivo
                      </span>
                    )}
                  </div>

                  <h3 
                    className={`text-2xl sm:text-3xl font-bold text-white ${formData.font_style === 'sans' ? 'font-sans' : 'font-rustic'}`}
                  >
                    {formData.name || 'Nombre de tu Rotisería'}
                  </h3>
                  <p className="text-xs text-[#d1bea9] leading-relaxed line-clamp-2 max-w-lg">
                    {formData.description || 'Comida casera recién hecha a mano, respetando los tiempos y el amor de la cocina tradicional.'}
                  </p>

                  {/* Highlights tags preview */}
                  <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 pt-1 text-[10px]">
                    <span className="bg-black/50 border border-white/10 px-2 py-0.5 rounded text-[#e6d3c0]">
                      ✓ {formData.highlight_tag_1}
                    </span>
                    <span className="bg-black/50 border border-white/10 px-2 py-0.5 rounded text-[#e6d3c0]">
                      ✓ {formData.highlight_tag_2}
                    </span>
                    <span className="bg-black/50 border border-white/10 px-2 py-0.5 rounded text-[#e6d3c0]">
                      ✓ {formData.highlight_tag_3}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón de ejemplo con color primario dinámico */}
              <div className="shrink-0 flex flex-col items-center gap-1">
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{ 
                    background: `linear-gradient(135deg, ${activePrimary}, ${activeSecondary})`,
                    boxShadow: `0 4px 14px ${activePrimary}50`
                  }}
                >
                  {formData.hero_cta_text || 'Pedir al plato'}
                </button>
                {Number(formData.min_order_amount) > 0 && (
                  <span className="text-[10px] text-[#a88a70]">
                    Mínimo: ${Number(formData.min_order_amount).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SECCIÓN 2: CONTROL DE OPERACIÓN & PEDIDOS */}
        {/* ===================================================================== */}
        <div className="bg-[#1b1511] border border-[#382b21] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#382b21]">
            <Power className="w-5 h-5" style={{ color: activePrimary }} />
            <div>
              <h2 className="text-lg font-bold font-rustic text-white">Operación & Políticas de Pedidos</h2>
              <p className="text-xs text-[#a88a70]">
                Controla en vivo si la tienda está abierta, el pedido mínimo y las reglas de entrega.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Switch de Tienda Abierta / Cerrada */}
            <div className="sm:col-span-2 bg-[#151210] p-4 rounded-2xl border border-[#382b21] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <span 
                    className={`w-3 h-3 rounded-full ${formData.is_store_open ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} 
                  />
                  <span>Estado del Local: {formData.is_store_open ? 'Abierto y Recibiendo Pedidos' : 'Cerrado Temporalmente'}</span>
                </p>
                <p className="text-xs text-[#8c6f59]">
                  Si desactivas esta opción, tus clientes verán un aviso de local cerrado y no podrán finalizar pedidos.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_store_open: !formData.is_store_open })}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  formData.is_store_open
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-600/40'
                    : 'bg-rose-600/30 text-rose-300 border border-rose-500/50 hover:bg-rose-600/40'
                }`}
              >
                {formData.is_store_open ? '🟢 Local Abierto' : '🔴 Local Cerrado'}
              </button>
            </div>

            {!formData.is_store_open && (
              <div className="sm:col-span-2 space-y-1.5 animate-in fade-in">
                <label className="text-xs font-semibold text-rose-300">Mensaje para tus Clientes (cuando está cerrado)</label>
                <input
                  type="text"
                  value={formData.closed_message}
                  onChange={(e) => setFormData({ ...formData, closed_message: e.target.value })}
                  placeholder="Ej: Abrimos hoy a las 19:30 hs. ¡Puedes dejarnos tu pedido programado!"
                  className="w-full bg-[#151210] border border-rose-900/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c7af9a] flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" style={{ color: activePrimary }} />
                <span>Monto Mínimo de Pedido ($)</span>
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={formData.min_order_amount}
                onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) || 0 })}
                placeholder="0 = Sin mínimo"
                className="w-full bg-[#151210] border border-[#382b21] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e59324]"
              />
              <p className="text-[10px] text-[#8c6f59]">
                Los clientes no podrán enviar pedidos si no alcanzan este monto.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c7af9a] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" style={{ color: activePrimary }} />
                <span>Costo / Modalidad de Envío</span>
              </label>
              <input
                type="text"
                value={formData.delivery_cost}
                onChange={(e) => setFormData({ ...formData, delivery_cost: e.target.value })}
                placeholder="Ej: $1.200 o A coordinar por zona"
                className="w-full bg-[#151210] border border-[#382b21] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e59324]"
              />
              <p className="text-[10px] text-[#8c6f59]">
                Visible en el carrito y durante la confirmación de la orden.
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SECCIÓN 3: MEDIOS DE PAGO & PROMOCIONES */}
        {/* ===================================================================== */}
        <div className="bg-[#1b1511] border border-[#382b21] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#382b21]">
            <Banknote className="w-5 h-5" style={{ color: activePrimary }} />
            <div>
              <h2 className="text-lg font-bold font-rustic text-white">Medios de Pago & Promociones</h2>
              <p className="text-xs text-[#a88a70]">
                Define qué métodos aceptas y premia a quienes abonen en efectivo o transferencia.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Efectivo */}
            <div className="bg-[#151210] p-4 rounded-2xl border border-[#382b21] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  <span>Efectivo</span>
                </span>
                <input
                  type="checkbox"
                  checked={formData.accepts_cash}
                  onChange={(e) => setFormData({ ...formData, accepts_cash: e.target.checked })}
                  className="w-4 h-4 accent-[#e59324] rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#c7af9a] flex items-center gap-1">
                  <Percent className="w-3 h-3 text-amber-400" />
                  <span>Descuento Especial (%)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.cash_discount_percentage}
                  onChange={(e) => setFormData({ ...formData, cash_discount_percentage: Number(e.target.value) || 0 })}
                  placeholder="Ej: 10"
                  className="w-full bg-[#1b1511] border border-[#382b21] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#e59324]"
                />
              </div>
            </div>

            {/* Transferencia */}
            <div className="bg-[#151210] p-4 rounded-2xl border border-[#382b21] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <span>Transferencia / Alias</span>
                </span>
                <input
                  type="checkbox"
                  checked={formData.accepts_transfer}
                  onChange={(e) => setFormData({ ...formData, accepts_transfer: e.target.checked })}
                  className="w-4 h-4 accent-[#e59324] rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#c7af9a]">Alias o CBU</label>
                <input
                  type="text"
                  value={formData.transfer_alias}
                  onChange={(e) => setFormData({ ...formData, transfer_alias: e.target.value })}
                  placeholder="Ej: roti.doncarlos.mp"
                  className="w-full bg-[#1b1511] border border-[#382b21] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#e59324] font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Tarjeta */}
            <div className="bg-[#151210] p-4 rounded-2xl border border-[#382b21] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  <span>Tarjeta Débito/Crédito</span>
                </span>
                <input
                  type="checkbox"
                  checked={formData.accepts_card}
                  onChange={(e) => setFormData({ ...formData, accepts_card: e.target.checked })}
                  className="w-4 h-4 accent-[#e59324] rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-[#8c6f59]">
                Cobro mediante terminal POS al entregar o en mostrador.
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SECCIÓN 4: LOGOS E IMÁGENES (SUBIDA DIRECTA) */}
        {/* ===================================================================== */}
        <div className="bg-[#1b1511] border border-[#382b21] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#382b21]">
            <Upload className="w-5 h-5" style={{ color: activePrimary }} />
            <div>
              <h2 className="text-lg font-bold font-rustic text-white">Logo & Imagen de Portada</h2>
              <p className="text-xs text-[#a88a70]">
                Sube tus propios archivos desde tu teléfono o computadora, o selecciona imágenes recomendadas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* SUBIDA DE LOGO */}
            <div className="space-y-3 bg-[#151210] p-4 rounded-2xl border border-[#382b21]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" style={{ color: activePrimary }} />
                  <span>Logotipo del Restaurante</span>
                </label>
                {formData.logo_url && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logo_url: '' })}
                    className="text-[10px] text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Quitar logo
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#523d2f] hover:border-[#e59324] bg-black/40 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all relative group"
                >
                  {uploadingLogo ? (
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: activePrimary }} />
                  ) : formData.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={formData.logo_url} 
                      alt="Logo" 
                      className="w-full h-full object-contain p-1.5 group-hover:opacity-60 transition-opacity" 
                    />
                  ) : (
                    <div className="text-center p-1">
                      <Upload className="w-5 h-5 text-[#8c6f59] mx-auto mb-1 group-hover:text-white" />
                      <span className="text-[9px] text-[#8c6f59] group-hover:text-white">Subir</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                    className="btn-secondary w-full py-2 text-xs flex items-center justify-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" style={{ color: activePrimary }} />
                    <span>{uploadingLogo ? 'Procesando...' : 'Seleccionar Logo de tu PC'}</span>
                  </button>
                  <p className="text-[10px] text-[#8c6f59]">
                    PNG transparente, JPG o SVG. Se redimensiona automáticamente.
                  </p>
                </div>
              </div>

              {/* Opción de URL manual */}
              <div className="pt-2 border-t border-[#261d17]">
                <button
                  type="button"
                  onClick={() => setShowLogoUrlInput(!showLogoUrlInput)}
                  className="text-[10px] text-[#a88a70] hover:text-white underline"
                >
                  {showLogoUrlInput ? 'Ocultar entrada de URL' : '¿Prefieres pegar un enlace URL?'}
                </button>
                {showLogoUrlInput && (
                  <input
                    type="text"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://..."
                    className="mt-2 w-full bg-[#1b1511] border border-[#382b21] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#e59324]"
                  />
                )}
              </div>
            </div>

            {/* SUBIDA DE BANNER / HERO */}
            <div className="space-y-3 bg-[#151210] p-4 rounded-2xl border border-[#382b21]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" style={{ color: activePrimary }} />
                  <span>Banner de Portada / Hero</span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <div 
                  onClick={() => bannerInputRef.current?.click()}
                  className="w-28 h-20 rounded-2xl border-2 border-dashed border-[#523d2f] hover:border-[#e59324] bg-black/40 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all relative group shrink-0"
                >
                  {uploadingBanner ? (
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: activePrimary }} />
                  ) : formData.banner_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={formData.banner_url} 
                      alt="Banner" 
                      className="w-full h-full object-cover group-hover:opacity-60 transition-opacity" 
                    />
                  ) : (
                    <div className="text-center p-1">
                      <Upload className="w-5 h-5 text-[#8c6f59] mx-auto mb-1 group-hover:text-white" />
                      <span className="text-[9px] text-[#8c6f59] group-hover:text-white">Subir</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingBanner}
                    onClick={() => bannerInputRef.current?.click()}
                    className="btn-secondary w-full py-2 text-xs flex items-center justify-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" style={{ color: activePrimary }} />
                    <span>{uploadingBanner ? 'Procesando...' : 'Subir Banner desde PC'}</span>
                  </button>
                  
                  {/* Presets rápidos */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {BANNER_PRESETS.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormData({ ...formData, banner_url: p.url })}
                        className="text-[9px] bg-[#241c16] hover:bg-[#34271e] text-[#e59324] px-2 py-0.5 rounded-lg border border-[#3d2e23]"
                      >
                        {p.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Opción de URL manual */}
              <div className="pt-2 border-t border-[#261d17]">
                <button
                  type="button"
                  onClick={() => setShowBannerUrlInput(!showBannerUrlInput)}
                  className="text-[10px] text-[#a88a70] hover:text-white underline"
                >
                  {showBannerUrlInput ? 'Ocultar entrada de URL' : '¿Prefieres pegar un enlace URL?'}
                </button>
                {showBannerUrlInput && (
                  <input
                    type="text"
                    value={formData.banner_url}
                    onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                    placeholder="https://..."
                    className="mt-2 w-full bg-[#1b1511] border border-[#382b21] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#e59324]"
                  />
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ===================================================================== */}
        {/* SECCIÓN 5: COLORES & ATMÓSFERA VISUAL */}
        {/* ===================================================================== */}
        <div className="bg-[#1b1511] border border-[#382b21] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#382b21]">
            <Palette className="w-5 h-5" style={{ color: activePrimary }} />
            <div>
              <h2 className="text-lg font-bold font-rustic text-white">Colores de Marca & Atmósfera</h2>
              <p className="text-xs text-[#a88a70]">
                Afecta directamente los botones de compra, badges, bordes, cabeceras y destacados tanto de la tienda como del panel admin.
              </p>
            </div>
          </div>

          {/* Paletas de 1 solo click */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#c7af9a]">Paletas Recomendadas para Gastronomía</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {COLOR_PRESETS.map((preset, idx) => {
                const isSelected = formData.primary_color === preset.primary && formData.secondary_color === preset.secondary

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      primary_color: preset.primary, 
                      secondary_color: preset.secondary 
                    })}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                      isSelected 
                        ? 'bg-[#291e17] border-[#e59324] shadow-md ring-2 ring-[#e59324]/30' 
                        : 'bg-[#151210] border-[#382b21] hover:border-[#523d2f]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: preset.primary }} />
                      <span className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: preset.secondary }} />
                    </div>
                    <span className="text-[10px] font-semibold text-white leading-tight">
                      {preset.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Inputs de Color Custom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c7af9a]">Color Primario (Botones, Acentos y Precios)</label>
              <div className="flex items-center gap-3 bg-[#151210] border border-[#382b21] rounded-xl p-2">
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-10 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="bg-transparent text-white font-mono text-xs focus:outline-none flex-1"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c7af9a]">Color Secundario (Degradados y Etiquetas)</label>
              <div className="flex items-center gap-3 bg-[#151210] border border-[#382b21] rounded-xl p-2">
                <input
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="w-10 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="bg-transparent text-white font-mono text-xs focus:outline-none flex-1"
                />
              </div>
            </div>
          </div>

          {/* ATMÓSFERA VISUAL (THEMES) */}
          <div className="pt-4 border-t border-[#2d221b] space-y-3">
            <div className="flex items-center gap-2">
              <Layout className="w-4 h-4" style={{ color: activePrimary }} />
              <label className="text-xs font-bold text-white">Atmósfera y Fondo Visual</label>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {THEME_PRESETS.map((theme) => {
                const active = (formData.theme_style || 'rustic') === theme.id
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, theme_style: theme.id })}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      active 
                        ? 'border-[#e59324] ring-2 ring-[#e59324]/30 shadow-lg' 
                        : 'border-[#382b21] hover:border-[#523d2f]'
                    }`}
                    style={{ backgroundColor: theme.card }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: theme.bg }} />
                      {active && <Check className="w-3.5 h-3.5" style={{ color: activePrimary }} />}
                    </div>
                    <p className="text-xs font-bold text-white leading-tight">{theme.name}</p>
                    <p className="text-[10px] text-[#9c826e] mt-0.5 line-clamp-1">{theme.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* TIPOGRAFÍA & HERO CTA */}
          <div className="pt-4 border-t border-[#2d221b] grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4" style={{ color: activePrimary }} />
                <label className="text-xs font-bold text-white">Estilo Tipográfico</label>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, font_style: 'serif' })}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    (formData.font_style || 'serif') === 'serif'
                      ? 'bg-[#291e17] border-[#e59324] ring-2 ring-[#e59324]/30'
                      : 'bg-[#151210] border-[#382b21]'
                  }`}
                >
                  <p className="text-xs font-bold font-rustic text-white">Rústica Tradicional</p>
                  <p className="text-[10px] text-[#9c826e]">Serifada, cálida</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, font_style: 'sans' })}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    formData.font_style === 'sans'
                      ? 'bg-[#291e17] border-[#e59324] ring-2 ring-[#e59324]/30'
                      : 'bg-[#151210] border-[#382b21]'
                  }`}
                >
                  <p className="text-xs font-bold font-sans text-white">Moderna & Limpia</p>
                  <p className="text-[10px] text-[#9c826e]">Sans-serif, ágil</p>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4" style={{ color: activePrimary }} />
                <label className="text-xs font-bold text-white">Texto del Botón de Compra (CTA)</label>
              </div>
              <input
                type="text"
                value={formData.hero_cta_text}
                onChange={(e) => setFormData({ ...formData, hero_cta_text: e.target.value })}
                placeholder="Ej: Pedir al plato, Hacer mi pedido, Ver Carta"
                className="w-full bg-[#151210] border border-[#382b21] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#e59324]"
              />
            </div>
          </div>

        </div>

        {/* ===================================================================== */}
        {/* SECCIÓN 6: ANUNCIO DE CABECERA (PROMO BAR) */}
        {/* ===================================================================== */}
        <div className="bg-[#1b1511] border border-[#382b21] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#382b21]">
            <Megaphone className="w-5 h-5" style={{ color: activePrimary }} />
            <div>
              <h2 className="text-lg font-bold font-rustic text-white">Barra de Anuncios Promocionales</h2>
              <p className="text-xs text-[#a88a70]">
                Mensaje visible en la parte superior de tu tienda para destacar promociones, avisos o novedades.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="announcement_enabled"
                checked={formData.announcement_enabled}
                onChange={(e) => setFormData({ ...formData, announcement_enabled: e.target.checked })}
                className="w-4 h-4 accent-[#e59324] rounded cursor-pointer"
              />
              <label htmlFor="announcement_enabled" className="text-xs font-semibold text-white cursor-pointer">
                Mostrar barra de anuncio en la parte superior de la tienda
              </label>
            </div>

            {formData.announcement_enabled && (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={formData.announcement_banner}
                  onChange={(e) => setFormData({ ...formData, announcement_banner: e.target.value })}
                  placeholder="Ej: 🔥 Horno encendido • 15% OFF abonando en efectivo"
                  className="w-full bg-[#151210] border border-[#382b21] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#e59324]"
                />
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SECCIÓN 7: INFORMACIÓN PÚBLICA, REDES & MAPAS */}
        {/* ===================================================================== */}
        <div className="bg-[#1b1511] border border-[#382b21] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#382b21]">
            <Globe className="w-5 h-5" style={{ color: activePrimary }} />
            <div>
              <h2 className="text-lg font-bold font-rustic text-white">Información & Canales de Contacto</h2>
              <p className="text-xs text-[#a88a70]">
                Datos de atención visibles en el encabezado, hero y pie de página de tu tienda.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c7af9a]">Nombre de la Rotisería *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#151210] border border-[#382b21] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e59324]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c7af9a]">Subdominio Asignado</label>
              <input
                type="text"
                value={formData.subdomain}
                readOnly
                title="Para modificar tu subdominio contacta a soporte"
                className="w-full bg-[#151210]/50 border border-[#382b21] rounded-xl px-4 py-2.5 text-xs text-[#8c6f59] cursor-not-allowed focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-[#c7af9a]">Descripción / Eslogan del Local</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve reseña sobre tus comidas, recetas caseras y tradición culinaria."
                className="w-full bg-[#151210] border border-[#382b21] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e59324] resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c7af9a] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" style={{ color: activePrimary }} />
                <span>Dirección del Local</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ej: Av. San Martín 1420, Buenos Aires"
                className="w-full bg-[#151210] border border-[#382b21] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e59324]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c7af9a] flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" style={{ color: activePrimary }} />
                <span>Enlace a Google Maps (URL)</span>
              </label>
              <input
                type="text"
                value={formData.google_maps_url}
                onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                placeholder="https://maps.app.goo.gl/..."
                className="w-full bg-[#151210] border border-[#382b21] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e59324]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c7af9a] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" style={{ color: activePrimary }} />
                <span>Teléfono de Pedidos</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ej: +54 9 11 4455-8899"
                className="w-full bg-[#151210] border border-[#382b21] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e59324]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c7af9a] flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp de Pedidos</span>
              </label>
              <input
                type="text"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                placeholder="Ej: +54 9 11 4455-8899"
                className="w-full bg-[#151210] border border-[#382b21] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e59324]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c7af9a] flex items-center gap-1.5">
                <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                <span>Instagram Oficial</span>
              </label>
              <input
                type="text"
                value={formData.instagram_handle}
                onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                placeholder="Ej: @doncarlos.rotiseria"
                className="w-full bg-[#151210] border border-[#382b21] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e59324]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c7af9a] flex items-center gap-1.5">
                <span className="font-bold text-xs text-blue-400">f</span>
                <span>Página de Facebook (URL)</span>
              </label>
              <input
                type="text"
                value={formData.facebook_url}
                onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                placeholder="Ej: https://facebook.com/rotiseriadoncarlos"
                className="w-full bg-[#151210] border border-[#382b21] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e59324]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c7af9a] flex items-center gap-1.5">
                <TikTokIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>TikTok (@perfil)</span>
              </label>
              <input
                type="text"
                value={formData.tiktok_handle}
                onChange={(e) => setFormData({ ...formData, tiktok_handle: e.target.value })}
                placeholder="Ej: @doncarlos_cocina"
                className="w-full bg-[#151210] border border-[#382b21] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e59324]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c7af9a] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" style={{ color: activePrimary }} />
                <span>Tiempo Estimado de Entrega</span>
              </label>
              <input
                type="text"
                value={formData.estimated_delivery_time}
                onChange={(e) => setFormData({ ...formData, estimated_delivery_time: e.target.value })}
                placeholder="Ej: 30-45 min"
                className="w-full bg-[#151210] border border-[#382b21] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e59324]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-[#c7af9a] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" style={{ color: activePrimary }} />
                <span>Días y Horarios de Atención</span>
              </label>
              <input
                type="text"
                value={formData.opening_hours}
                onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                placeholder="Ej: Martes a Domingo: 19:30 a 23:45"
                className="w-full bg-[#151210] border border-[#382b21] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e59324]"
              />
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SECCIÓN 8: SELLOS DE CONFIANZA & PIE DE PÁGINA */}
        {/* ===================================================================== */}
        <div className="bg-[#1b1511] border border-[#382b21] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#382b21]">
            <Award className="w-5 h-5" style={{ color: activePrimary }} />
            <div>
              <h2 className="text-lg font-bold font-rustic text-white">Sellos de Confianza & Pie de Página</h2>
              <p className="text-xs text-[#a88a70]">
                Tres distintivos de garantía y el mensaje de cierre para el pie de tu tienda.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c7af9a] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" style={{ color: activePrimary }} />
                <span>Sello 1 (Especialidad)</span>
              </label>
              <input
                type="text"
                value={formData.highlight_tag_1}
                onChange={(e) => setFormData({ ...formData, highlight_tag_1: e.target.value })}
                placeholder="Ej: Horno a Leña & Fuego"
                className="w-full bg-[#151210] border border-[#382b21] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#e59324]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c7af9a] flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Sello 2 (Calidad)</span>
              </label>
              <input
                type="text"
                value={formData.highlight_tag_2}
                onChange={(e) => setFormData({ ...formData, highlight_tag_2: e.target.value })}
                placeholder="Ej: 100% Casero"
                className="w-full bg-[#151210] border border-[#382b21] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#e59324]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c7af9a] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Sello 3 (Garantía)</span>
              </label>
              <input
                type="text"
                value={formData.highlight_tag_3}
                onChange={(e) => setFormData({ ...formData, highlight_tag_3: e.target.value })}
                placeholder="Ej: Atención Directa"
                className="w-full bg-[#151210] border border-[#382b21] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#e59324]"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-[#c7af9a]">Texto Personalizado para el Pie de Página (Footer)</label>
            <input
              type="text"
              value={formData.footer_custom_text}
              onChange={(e) => setFormData({ ...formData, footer_custom_text: e.target.value })}
              placeholder="Ej: Cocina tradicional, recetas familiares y entrega directa sin intermediarios."
              className="w-full bg-[#151210] border border-[#382b21] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#e59324]"
            />
          </div>
        </div>

        {/* ===================================================================== */}
        {/* BOTÓN FLOTANTE / INFERIOR DE GUARDADO */}
        {/* ===================================================================== */}
        <div className="flex items-center justify-between pt-4 border-t border-[#382b21]">
          <p className="text-xs text-[#8c6f59]">
            Los cambios se aplican de inmediato en la tienda pública y en tu panel de administración.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="btn-amber px-8 py-3 text-sm flex items-center gap-2 font-bold shadow-xl active:scale-95 transition-all"
            style={{
              background: `linear-gradient(135deg, ${activePrimary}, ${activeSecondary})`
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Guardando cambios...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white" />
                <span>Guardar Personalización</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  )
}
