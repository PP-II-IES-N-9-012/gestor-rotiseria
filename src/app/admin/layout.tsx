'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  ChefHat, 
  Calculator, 
  PackageSearch, 
  Settings, 
  LogOut, 
  Flame, 
  Loader2,
  Store,
  UtensilsCrossed
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { getRestaurant, getRestaurantStrict, type RestaurantInfo } from '@/lib/api'
import { AdminRestaurantContext, AdminSetRestaurantContext } from '@/lib/AdminContext'
import { buildTenantUrl, getClientTenant, tenantPath } from '@/lib/tenant'

const navigation = [
  { name: 'Gerencia (KPIs)', href: '/admin', icon: LayoutDashboard },
  { name: 'Punto de Venta', href: '/admin/pos', icon: Calculator },
  { name: 'Cocina en Vivo', href: '/admin/cocina', icon: ChefHat },
  { name: 'Catálogo & Recetas', href: '/admin/productos', icon: UtensilsCrossed },
  { name: 'Inventario', href: '/admin/inventario', icon: PackageSearch },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null)

  useEffect(() => {
    let cancelled = false
    const hostTenant = getClientTenant()
    const isDemo =
      localStorage.getItem('demo_auth') === 'true' ||
      new URLSearchParams(window.location.search).get('demo') === 'true'

    const init = async () => {
      try {
        // Traspaso de sesión cross-origin (desde el login en dominio general u otro subdominio)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
          const at = hashParams.get('sat') || hashParams.get('access_token')
          const rt = hashParams.get('srt') || hashParams.get('refresh_token')
          if (at && rt) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search)
            try {
              await supabase.auth.setSession({ access_token: at, refresh_token: rt })
            } catch (e) {
              console.warn('Error syncing transferred auth session:', e)
            }
          }
        }

        const isDemo =
          localStorage.getItem('demo_auth') === 'true' ||
          new URLSearchParams(window.location.search).get('demo') === 'true'

        if (new URLSearchParams(window.location.search).get('demo') === 'true') {
          localStorage.setItem('demo_auth', 'true')
        }

        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 3500)
        )
        const { data: { session } } = await Promise.race([supabase.auth.getSession(), timeoutPromise])
        if (cancelled) return

        if (session) {
          // El local del admin sale de su perfil en Supabase
          const { data: profile } = await supabase
            .from('profiles')
            .select('restaurant_id')
            .eq('id', session.user.id)
            .maybeSingle()
          if (cancelled) return

          if (profile?.restaurant_id) {
            const own = await getRestaurant(profile.restaurant_id)
            if (cancelled) return

            // Si está en el dominio base o en el subdominio de otro local, llevarlo al suyo propio
            if (!hostTenant || own.subdomain.toLowerCase() !== hostTenant) {
              const target = buildTenantUrl(own.subdomain, '/admin')
              const transferHash = new URLSearchParams({
                sat: session.access_token,
                srt: session.refresh_token
              })
              window.location.href = `${target}#${transferHash.toString()}`
              return
            }

            setRestaurant(own)
            setLoading(false)
            return
          }
        }

        if (isDemo) {
          const demoRestaurant = hostTenant ? await getRestaurantStrict(hostTenant) : null
          if (cancelled) return
          setRestaurant(demoRestaurant)
          setLoading(false)
          return
        }

        router.push('/login')
      } catch {
        if (!cancelled) router.push('/login')
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && !isDemo) {
        router.push('/login')
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [router])

  const handleLogout = async () => {
    localStorage.removeItem('demo_auth')
    await supabase.auth.signOut()
    router.push('/login')
  }

  const storeHref = restaurant ? tenantPath('/tienda', restaurant.subdomain) : '/tienda'

  if (loading) {
    return (
      <div className="flex h-screen bg-[#151210] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#e59324]" />
      </div>
    )
  }

  const primaryColor = restaurant?.primary_color || '#e59324'
  const secondaryColor = restaurant?.secondary_color || '#d34e2c'
  const themeClass = restaurant?.theme_style ? `theme-${restaurant.theme_style}` : 'theme-rustic'

  return (
    <AdminRestaurantContext.Provider value={restaurant}>
    <AdminSetRestaurantContext.Provider value={setRestaurant}>
    <div 
      className={`flex h-screen text-[#fcf9f5] overflow-hidden ${themeClass}`}
      style={{
        '--brand-primary': primaryColor,
        '--brand-secondary': secondaryColor,
        backgroundColor: 'var(--store-bg, #151210)'
      } as React.CSSProperties}
    >
      {/* Sidebar */}
      <aside 
        className="w-64 border-r flex flex-col justify-between hidden md:flex transition-colors"
        style={{
          backgroundColor: 'var(--store-header-bg, #1b1511)',
          borderColor: `${primaryColor}20`
        }}
      >
        <div>
          <div 
            className="h-20 flex items-center px-6 border-b transition-colors"
            style={{ borderColor: `${primaryColor}20` }}
          >
            <Link href="/" className="flex items-center space-x-3 group">
              {restaurant?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={restaurant.logo_url} 
                  alt={restaurant.name}
                  className="w-10 h-10 object-contain rounded-xl bg-black/40 p-1 border shadow-md group-hover:scale-105 transition-transform"
                  style={{ borderColor: `${primaryColor}40` }}
                />
              ) : (
                <div 
                  className="p-2 rounded-xl group-hover:rotate-6 transition-transform shadow-md text-white"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    boxShadow: `0 4px 14px ${primaryColor}40`
                  }}
                >
                  <Flame className="w-5 h-5" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-rustic text-xl font-bold tracking-tight text-white">
                  Comand<span style={{ color: primaryColor }}>App</span>
                </span>
                <span className="text-[10px] text-[#bda086] -mt-1 font-semibold truncate max-w-[10rem]">
                  {restaurant?.name || 'Panel de Cocina'}
                </span>
              </div>
            </Link>
          </div>
          
          <nav className="p-4 space-y-1.5">
            <div className="text-[11px] font-semibold text-[#8c6f59] uppercase tracking-wider mb-3 px-3">
              Módulos del Local
            </div>
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'border shadow-sm font-semibold'
                      : 'text-[#c7af9a] hover:bg-white/5 hover:text-white'
                  }`}
                  style={isActive ? {
                    backgroundColor: `${primaryColor}18`,
                    color: primaryColor,
                    borderColor: `${primaryColor}50`,
                  } : undefined}
                >
                  <item.icon 
                    className="mr-3 h-4 w-4 transition-colors" 
                    style={{ color: isActive ? primaryColor : '#8c6f59' }} 
                  />
                  {item.name}
                </Link>
              )
            })}

            <div 
              className="pt-4 border-t mt-4"
              style={{ borderColor: `${primaryColor}20` }}
            >
              <Link 
                href={storeHref}
                target="_blank"
                className="flex items-center px-3 py-2.5 text-xs text-[#a88a70] hover:bg-white/5 rounded-xl transition-colors gap-2"
                style={{ color: '#c7af9a' }}
              >
                <Store className="w-4 h-4" style={{ color: primaryColor }} />
                <span>Ver Tienda Pública</span>
              </Link>
            </div>
          </nav>
        </div>

        <div 
          className="p-4 border-t space-y-1"
          style={{ borderColor: `${primaryColor}20` }}
        >
          <Link 
            href="/admin/configuracion" 
            className={`flex w-full items-center px-3 py-2 text-xs font-medium rounded-xl transition-all ${
              pathname === '/admin/configuracion'
                ? 'border shadow-sm font-semibold'
                : 'text-[#c7af9a] hover:bg-white/5 hover:text-white'
            }`}
            style={pathname === '/admin/configuracion' ? {
              backgroundColor: `${primaryColor}18`,
              color: primaryColor,
              borderColor: `${primaryColor}50`,
            } : undefined}
          >
            <Settings 
              className="mr-3 h-4 w-4" 
              style={{ color: pathname === '/admin/configuracion' ? primaryColor : '#8c6f59' }} 
            />
            Personalización & Ajustes
          </Link>
          <button 
            onClick={handleLogout} 
            className="flex w-full items-center px-3 py-2 text-xs font-medium rounded-xl text-[#8c6f59] hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header 
          className="h-16 border-b flex items-center justify-between px-6 md:hidden"
          style={{
            backgroundColor: 'var(--store-header-bg, #1b1511)',
            borderColor: `${primaryColor}20`
          }}
        >
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5" style={{ color: primaryColor }} />
            <span className="font-rustic text-lg font-bold tracking-tight text-white">
              Comand<span style={{ color: primaryColor }}>App</span>
            </span>
          </div>
          <button onClick={handleLogout} className="text-xs text-[#8c6f59] hover:text-red-400">
            Salir
          </button>
        </header>
        <div 
          className="flex-1 overflow-auto p-6 md:p-8 transition-colors"
          style={{ backgroundColor: 'var(--store-bg, #151210)' }}
        >
          {children}
        </div>
      </main>
    </div>
    </AdminSetRestaurantContext.Provider>
    </AdminRestaurantContext.Provider>
  )
}
