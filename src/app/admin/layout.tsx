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
  UtensilsCrossed,
  Menu,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { getRestaurant, getRestaurantStrict, FALLBACK_RESTAURANT, invalidateCache, type RestaurantInfo } from '@/lib/api'
import { 
  AdminRestaurantContext, 
  AdminSetRestaurantContext,
  AdminUserRoleContext,
  AdminUserProfileContext,
  type UserRole,
  type AdminUserProfile
} from '@/lib/AdminContext'
import { buildTenantUrl, getClientTenant, tenantPath } from '@/lib/tenant'

interface NavItem {
  name: string
  href: string
  icon: any
  roles: UserRole[]
}

const ALL_NAVIGATION: NavItem[] = [
  { name: 'Gerencia (KPIs)', href: '/admin', icon: LayoutDashboard, roles: ['admin'] },
  { name: 'Punto de Venta', href: '/admin/pos', icon: Calculator, roles: ['admin', 'seller'] },
  { name: 'Cocina en Vivo', href: '/admin/cocina', icon: ChefHat, roles: ['admin', 'seller', 'cook'] },
  { name: 'Catálogo & Recetas', href: '/admin/productos', icon: UtensilsCrossed, roles: ['admin'] },
  { name: 'Inventario', href: '/admin/inventario', icon: PackageSearch, roles: ['admin'] },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null)
  const [userRole, setUserRole] = useState<UserRole>('admin')
  const [userProfile, setUserProfile] = useState<AdminUserProfile | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu whenever pathname changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

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

        if (isDemo) {
          const targetTenant = hostTenant || 'don-carlos'
          const demoRestaurant = await getRestaurant(targetTenant)
          if (cancelled) return
          setRestaurant(demoRestaurant || FALLBACK_RESTAURANT)
          setUserRole('admin')
          setUserProfile({
            id: 'demo-admin-user',
            restaurant_id: demoRestaurant?.id || FALLBACK_RESTAURANT.id,
            role: 'admin',
            full_name: 'Administrador Demo'
          })
          setLoading(false)
          return
        }

        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 3500)
        )
        const { data: { session } } = await Promise.race([supabase.auth.getSession(), timeoutPromise])
        if (cancelled) return

        if (session) {
          // El local y rol del usuario sale de su perfil en Supabase
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, restaurant_id, role, full_name')
            .eq('id', session.user.id)
            .maybeSingle()
          if (cancelled) return

          if (profile?.restaurant_id) {
            const role: UserRole = (profile.role as UserRole) || 'admin'
            setUserRole(role)
            setUserProfile({
              id: profile.id || session.user.id,
              restaurant_id: profile.restaurant_id,
              role,
              full_name: profile.full_name
            })

            // Si es un cliente común, no debe entrar al panel administrativo
            if (role === 'customer') {
              router.push('/tienda')
              return
            }

            const own = await getRestaurant(profile.restaurant_id)
            if (cancelled) return

            // Redirección inicial según rol si entra a la raíz /admin
            const defaultTarget = role === 'cook' ? '/admin/cocina' : role === 'seller' ? '/admin/pos' : '/admin'

            // Si está en el dominio base o en el subdominio de otro local, llevarlo al suyo propio
            if (!hostTenant || own.subdomain.toLowerCase() !== hostTenant) {
              const target = buildTenantUrl(own.subdomain, defaultTarget)
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

  // Sincronización en tiempo real del restaurante entre distintos dispositivos/usuarios
  useEffect(() => {
    if (!restaurant?.id) return
    const channel = supabase
      .channel(`admin-restaurant-sync-${restaurant.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'restaurants', filter: `id=eq.${restaurant.id}` },
        async () => {
          invalidateCache('restaurant')
          invalidateCache('restaurant_strict')
          const fresh = await getRestaurant(restaurant.id)
          if (fresh) setRestaurant(fresh)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurant?.id])

  // Route Guard: Bloqueo de rutas en tiempo real según rol
  useEffect(() => {
    if (loading) return

    if (userRole === 'cook') {
      if (pathname !== '/admin/cocina') {
        router.replace('/admin/cocina')
      }
    } else if (userRole === 'seller') {
      const sellerAllowed = ['/admin/pos', '/admin/cocina']
      if (!sellerAllowed.includes(pathname)) {
        router.replace('/admin/pos')
      }
    } else if (userRole === 'customer') {
      router.replace('/tienda')
    }
  }, [pathname, userRole, loading, router])

  const handleLogout = async () => {
    localStorage.removeItem('demo_auth')
    await supabase.auth.signOut()
    router.push('/login')
  }

  const storeHref = restaurant ? tenantPath('/tienda', restaurant.subdomain) : '/tienda'

  if (loading) {
    return (
      <div className="flex h-screen bg-[color:var(--store-subtle-bg)] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[color:var(--brand-primary)]" />
      </div>
    )
  }

  const primaryColor = restaurant?.primary_color || '#e59324'
  const secondaryColor = restaurant?.secondary_color || '#d34e2c'
  const themeClass = restaurant?.theme_style ? `theme-${restaurant.theme_style}` : 'theme-rustic'
  const fontClass = `font-style-${restaurant?.font_style || 'serif'}`

  return (
    <AdminRestaurantContext.Provider value={restaurant}>
      <AdminSetRestaurantContext.Provider value={setRestaurant}>
        <AdminUserRoleContext.Provider value={userRole}>
          <AdminUserProfileContext.Provider value={userProfile}>
            <div 
              className={`flex h-screen text-[#fcf9f5] overflow-hidden ${themeClass} ${fontClass}`}
              style={{
                '--brand-primary': primaryColor,
                '--brand-secondary': secondaryColor,
                '--color-primary': primaryColor,
                '--color-secondary': secondaryColor,
                '--primary': primaryColor,
                backgroundColor: 'var(--store-bg, #151210)'
              } as React.CSSProperties}
            >
              {/* Desktop Sidebar */}
              <aside 
                className="w-64 border-r flex flex-col justify-between hidden md:flex transition-colors shrink-0"
                style={{
                  backgroundColor: 'var(--store-header-bg, #1b1511)',
                  borderColor: `${primaryColor}20`
                }}
              >
                <div>
                  <div 
                    className="min-h-[6.5rem] py-3 flex items-center px-6 border-b transition-colors"
                    style={{ borderColor: `${primaryColor}20` }}
                  >
                    <Link href={storeHref} className="flex items-center space-x-3.5 group">
                      {restaurant?.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={restaurant.logo_url} 
                          alt={restaurant.name} 
                          className="w-14 h-14 object-cover rounded-2xl bg-black/40 p-1 border shadow-md group-hover:scale-105 transition-transform shrink-0"
                          style={{ borderColor: `${primaryColor}50` }}
                        />
                      ) : (
                        <div 
                          className="p-2.5 rounded-2xl group-hover:rotate-6 transition-transform shadow-md text-white shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                            boxShadow: `0 4px 14px ${primaryColor}40`
                          }}
                        >
                          <Flame className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-rustic text-xl font-bold tracking-tight text-white">
                          Comand<span style={{ color: primaryColor }}>App</span>
                        </span>
                        <span className="text-[10px] text-[color:var(--store-text-muted)] -mt-1 font-semibold truncate max-w-[10rem]">
                          {restaurant?.name || 'Panel de Cocina'}
                        </span>
                        <span 
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5 w-fit border uppercase tracking-wider"
                          style={{
                            backgroundColor: userRole === 'admin' ? `${primaryColor}20` : userRole === 'cook' ? 'rgba(234, 88, 12, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                            borderColor: userRole === 'admin' ? `${primaryColor}50` : userRole === 'cook' ? 'rgba(234, 88, 12, 0.5)' : 'rgba(59, 130, 246, 0.5)',
                            color: userRole === 'admin' ? primaryColor : userRole === 'cook' ? '#fb923c' : '#60a5fa'
                          }}
                        >
                          {userRole === 'cook' ? '👨‍🍳 Cocina' : userRole === 'seller' ? '💳 Ventas / POS' : '👑 Administrador'}
                        </span>
                      </div>
                    </Link>
                  </div>
                  
                  <nav className="p-4 space-y-1.5">
                    <div className="text-[11px] font-semibold text-[color:var(--store-text-faint)] uppercase tracking-wider mb-3 px-3">
                      Módulos del Local
                    </div>
                    {ALL_NAVIGATION.filter(item => item.roles.includes(userRole)).map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                            isActive
                              ? 'border shadow-sm font-semibold'
                              : 'text-[color:var(--store-text-soft)] hover:bg-white/5 hover:text-white'
                          }`}
                          style={isActive ? {
                            backgroundColor: `${primaryColor}18`,
                            color: primaryColor,
                            borderColor: `${primaryColor}50`,
                          } : undefined}
                        >
                          <item.icon 
                            className="mr-3 h-4 w-4 transition-colors" 
                            style={{ color: isActive ? primaryColor : 'var(--store-text-faint, #8c6f59)' }} 
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
                        className="flex items-center px-3 py-2.5 text-xs text-[color:var(--store-text-muted)] hover:bg-white/5 rounded-xl transition-colors gap-2"
                        style={{ color: 'var(--store-text-soft, #c7af9a)' }}
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
                  {userRole === 'admin' && (
                    <Link 
                      href="/admin/configuracion" 
                      className={`flex w-full items-center px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                        pathname === '/admin/configuracion'
                          ? 'border shadow-sm font-semibold'
                          : 'text-[color:var(--store-text-soft)] hover:bg-white/5 hover:text-white'
                      }`}
                      style={pathname === '/admin/configuracion' ? {
                        backgroundColor: `${primaryColor}18`,
                        color: primaryColor,
                        borderColor: `${primaryColor}50`,
                      } : undefined}
                    >
                      <Settings 
                        className="mr-3 h-4 w-4" 
                        style={{ color: pathname === '/admin/configuracion' ? primaryColor : 'var(--store-text-faint, #8c6f59)' }} 
                      />
                      Personalización & Ajustes
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout} 
                    className="flex w-full items-center px-3 py-2 text-xs font-medium rounded-xl text-[color:var(--store-text-faint)] hover:bg-red-500/10 hover:text-red-400 transition-all"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </aside>

              {/* Main Content & Mobile Header */}
              <main className="flex-1 flex flex-col overflow-hidden relative">
                <header 
                  className="h-16 border-b flex items-center justify-between px-4 sm:px-6 md:hidden z-30 shrink-0"
                  style={{
                    backgroundColor: 'var(--store-header-bg, #1b1511)',
                    borderColor: `${primaryColor}20`
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className="p-2 rounded-xl border border-[color:var(--store-border)] hover:bg-white/10 text-white"
                      aria-label="Abrir menú"
                    >
                      {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <Link href={storeHref} className="flex items-center space-x-2">
                      <Flame className="w-5 h-5" style={{ color: primaryColor }} />
                      <span className="font-rustic text-lg font-bold tracking-tight text-white">
                        Comand<span style={{ color: primaryColor }}>App</span>
                      </span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link 
                      href={storeHref}
                      target="_blank"
                      className="p-2 rounded-xl text-xs hover:bg-white/10 text-[color:var(--store-text-muted)] hover:text-white"
                      title="Ver Tienda"
                    >
                      <Store className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={handleLogout} 
                      className="text-xs px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors font-medium"
                    >
                      Salir
                    </button>
                  </div>
                </header>

                {/* Mobile Navigation Drawer Overlay */}
                {mobileMenuOpen && (
                  <div 
                    className="fixed inset-0 top-16 z-40 bg-black/80 backdrop-blur-md md:hidden animate-in fade-in flex flex-col justify-between p-6 overflow-y-auto"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="space-y-4" onClick={e => e.stopPropagation()}>
                      <div className="text-xs font-bold text-[color:var(--store-text-muted)] uppercase tracking-wider mb-2">
                        Navegación de {restaurant?.name || 'ComandApp'}
                      </div>

                      <div className="space-y-2">
                        {ALL_NAVIGATION.filter(item => item.roles.includes(userRole)).map((item) => {
                          const isActive = pathname === item.href
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                                isActive 
                                  ? 'border shadow-md' 
                                  : 'text-[color:var(--store-text-soft)] hover:bg-white/5 hover:text-white'
                              }`}
                              style={isActive ? {
                                backgroundColor: `${primaryColor}20`,
                                color: primaryColor,
                                borderColor: `${primaryColor}50`,
                              } : undefined}
                            >
                              <item.icon className="mr-3 h-5 w-5" style={{ color: isActive ? primaryColor : 'var(--store-text-muted)' }} />
                              <span>{item.name}</span>
                            </Link>
                          )
                        })}
                      </div>

                      {userRole === 'admin' && (
                        <div className="pt-4 border-t border-white/10">
                          <Link
                            href="/admin/configuracion"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center px-4 py-3 rounded-2xl text-sm font-semibold text-[color:var(--store-text-soft)] hover:bg-white/5"
                          >
                            <Settings className="mr-3 h-5 w-5" style={{ color: primaryColor }} />
                            <span>Personalización & Ajustes</span>
                          </Link>
                        </div>
                      )}

                      <div className="pt-2">
                        <Link
                          href={storeHref}
                          target="_blank"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center px-4 py-3 rounded-2xl text-sm font-semibold text-[color:var(--store-text-muted)] hover:bg-white/5"
                        >
                          <Store className="mr-3 h-5 w-5" style={{ color: primaryColor }} />
                          <span>Ver Tienda Pública</span>
                        </Link>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={handleLogout} 
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}

                <div 
                  className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 transition-colors"
                  style={{ backgroundColor: 'var(--store-bg, #151210)' }}
                >
                  {children}
                </div>
              </main>
            </div>
          </AdminUserProfileContext.Provider>
        </AdminUserRoleContext.Provider>
      </AdminSetRestaurantContext.Provider>
    </AdminRestaurantContext.Provider>
  )
}
