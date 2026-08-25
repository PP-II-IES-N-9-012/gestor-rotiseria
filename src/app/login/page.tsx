'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UtensilsCrossed, Loader2, Lock, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

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
        throw new Error('No tienes un perfil de rotisería asignado.')
      }

      // If successful, redirect to admin dashboard
      router.push('/admin')
      
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="bg-red-500 p-3 rounded-2xl mb-4 shadow-lg shadow-red-500/20">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-outfit font-bold tracking-tight text-white">
            Roti<span className="text-red-500">Admin</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm text-center">
            Ingresa a tu panel de administración
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                  placeholder="admin@mirotiseria.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium text-gray-300">Contraseña</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-base font-semibold rounded-xl flex justify-center items-center gap-2 mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Iniciar Sesión'
              )}
            </button>
            
          </form>
        </div>
        
        {/* Support Link */}
        <p className="text-center text-sm text-gray-500 mt-8">
          ¿Necesitas ayuda? Contacta a <a href="#" className="text-red-400 hover:text-red-300 transition-colors">soporte</a>
        </p>
      </div>
    </div>
  )
}
