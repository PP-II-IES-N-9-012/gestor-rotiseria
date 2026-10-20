'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Flame, Loader2, Lock, Mail, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getRestaurant, getRestaurantStrict, type RestaurantInfo } from '@/lib/api'
import { buildTenantUrl, getClientTenant, matchRootDomain } from '@/lib/tenant'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tenantInfo, setTenantInfo] = useState<RestaurantInfo | null>(null)
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'otro-local') {
      setError('Tu cuenta pertenece a otro local. Ingresá de nuevo desde su dirección.')
    }

    // Mostrar a qué local se está entrando (según el subdominio)
    const slug = getClientTenant()
    if (slug) getRestaurantStrict(slug).then(setTenantInfo)

    // Recibir la sesión si venimos de iniciar sesión en el dominio general.
    // (La sesión vive en localStorage, que es distinto en cada subdominio.)
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const at = hash.get('sat')
    const rt = hash.get('srt')
    if (at && rt) {
      window.history.replaceState(null, '', window.location.pathname)
      setLoading(true)
      supabase.auth.setSession({ access_token: at, refresh_token: rt }).then(({ error: sessionError }) => {
        if (sessionError) {
          setLoading(false)
          setError('No se pudo continuar la sesión. Ingresá nuevamente.')
        } else {
          router.push('/admin')
        }
      })
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      // Fetch profile to ensure they have a restaurant assigned
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile) {
        await supabase.auth.signOut()
        throw new Error('No tienes un local asignado a tu perfil.')
      }

      const own = await getRestaurant(profile.restaurant_id)
      const hostTenant = getClientTenant()
      const targetSubdomain = own.subdomain.toLowerCase()

      // Si ya está en el subdominio correcto de su restaurante
      if (hostTenant && hostTenant === targetSubdomain) {
        router.push('/admin')
        return
      }

      // Si se loguea desde el dominio general o desde otro subdominio,
      // lo enviamos DIRECTAMENTE a /admin de su restaurante transfiriendo los tokens
      if (matchRootDomain(window.location.host) && data.session) {
        const target = buildTenantUrl(targetSubdomain, '/admin')
        const hash = new URLSearchParams({
          sat: data.session.access_token,
          srt: data.session.refresh_token
        })
        window.location.href = `${target}#${hash.toString()}`
        return
      }

      router.push('/admin')
      
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#151210] flex items-center justify-center p-4 selection:bg-[#d34e2c] selection:text-white relative">
      
      {/* Return to Landing Link */}
      <Link 
        href="/"
        className="absolute top-6 left-6 text-xs text-[#bfa38c] hover:text-[#e59324] flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a ComandApp</span>
      </Link>

      <div className="w-full max-w-md">
        
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="bg-gradient-to-br from-[#d34e2c] to-[#992c10] p-3.5 rounded-2xl mb-3 shadow-xl shadow-orange-950/60 border border-amber-500/20">
            <Flame className="w-8 h-8 text-[#ffd5a8]" />
          </div>
          <h1 className="text-3xl font-rustic font-bold tracking-tight text-white">
            Comand<span className="text-[#e59324]">App</span>
          </h1>
          <p className="text-[#bfa38c] mt-1 text-xs text-center font-medium">
            {tenantInfo ? `Panel de ${tenantInfo.name}` : 'Panel de Cocina & Gestión de tu Rotisería'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#1f1712] rounded-3xl p-8 border border-[#4d3a2b] shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c7af9a] ml-1">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-[#7d6553]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#17120e] border border-[#44352a] rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-[#6d5645] focus:outline-none focus:border-[#e59324] transition-all"
                  placeholder="admin@tunegocio.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-semibold text-[#c7af9a]">Contraseña</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-[#7d6553]" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#17120e] border border-[#44352a] rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-[#6d5645] focus:outline-none focus:border-[#e59324] transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-900/60 text-red-300 text-xs p-3.5 rounded-xl text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-sm font-bold rounded-xl flex justify-center items-center gap-2 mt-2 shadow-lg"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Ingresar a mi Cocina'
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                const hostTenant = getClientTenant()
                const targetSubdomain = hostTenant || 'don-carlos'
                if (!hostTenant && matchRootDomain(window.location.host)) {
                  window.location.href = buildTenantUrl(targetSubdomain, '/admin?demo=true')
                } else {
                  localStorage.setItem('demo_auth', 'true')
                  router.push('/admin?demo=true')
                }
              }}
              className="w-full bg-[#2a1d15] hover:bg-[#38261b] text-[#e59324] border border-[#e59324]/30 py-2.5 text-xs font-semibold rounded-xl flex justify-center items-center gap-1.5 transition-all"
            >
              <span>Acceso Rápido / Modo Demostración</span>
            </button>
            
          </form>
        </div>
        
        {/* Support Link */}
        <p className="text-center text-xs text-[#8c6f59] mt-6">
          ¿Problemas para acceder? Contacta a <a href="#" className="text-[#e59324] hover:underline font-semibold">soporte técnico</a>
        </p>
      </div>
    </div>
  )
}
