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
  Store
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

const navigation = [
  { name: 'Gerencia (KPIs)', href: '/admin', icon: LayoutDashboard },
  { name: 'Punto de Venta', href: '/admin/pos', icon: Calculator },
  { name: 'Cocina en Vivo', href: '/admin/cocina', icon: ChefHat },
  { name: 'Inventario', href: '/admin/inventario', icon: PackageSearch },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setLoading(false)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-[#151210] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#e59324]" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#151210] text-[#fcf9f5] overflow-hidden selection:bg-[#d34e2c] selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1b1511] border-r border-[#382b21] flex flex-col justify-between hidden md:flex">
        <div>
          <div className="h-20 flex items-center px-6 border-b border-[#382b21]">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="bg-gradient-to-br from-[#d34e2c] to-[#992c10] p-2 rounded-xl group-hover:rotate-6 transition-transform shadow-md shadow-orange-950/40">
                <Flame className="w-5 h-5 text-[#ffd5a8]" />
              </div>
              <div className="flex flex-col">
                <span className="font-rustic text-xl font-bold tracking-tight text-white">
                  Comand<span className="text-[#e59324]">App</span>
                </span>
                <span className="text-[10px] text-[#bda086] -mt-1 font-semibold">Panel de Cocina</span>
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
                      ? 'bg-[#3b2419] text-[#e59324] border border-[#e59324]/30 shadow-sm'
                      : 'text-[#c7af9a] hover:bg-[#281f18] hover:text-white'
                  }`}
                >
                  <item.icon className={`mr-3 h-4 w-4 ${isActive ? 'text-[#e59324]' : 'text-[#8c6f59]'}`} />
                  {item.name}
                </Link>
              )
            })}

            <div className="pt-4 border-t border-[#31251e] mt-4">
              <Link 
                href="/tienda" 
                target="_blank"
                className="flex items-center px-3 py-2.5 text-xs text-[#a88a70] hover:text-[#e59324] hover:bg-[#281f18] rounded-xl transition-colors gap-2"
              >
                <Store className="w-4 h-4 text-[#e59324]" />
                <span>Ver Tienda Pública</span>
              </Link>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-[#382b21] space-y-1">
          <Link 
            href="/admin/configuracion" 
            className="flex w-full items-center px-3 py-2 text-xs font-medium rounded-xl text-[#c7af9a] hover:bg-[#281f18] hover:text-white transition-all"
          >
            <Settings className="mr-3 h-4 w-4 text-[#8c6f59]" />
            Configuración
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
        <header className="h-16 bg-[#1b1511] border-b border-[#382b21] flex items-center justify-between px-6 md:hidden">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-[#e59324]" />
            <span className="font-rustic text-lg font-bold tracking-tight text-white">Comand<span className="text-[#e59324]">App</span></span>
          </div>
          <button onClick={handleLogout} className="text-xs text-[#8c6f59] hover:text-red-400">
            Salir
          </button>
        </header>
        <div className="flex-1 overflow-auto bg-[#151210] p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
