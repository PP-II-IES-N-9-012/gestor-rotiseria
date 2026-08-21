'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ChefHat, 
  Calculator, 
  PackageSearch,
  Settings,
  LogOut,
  UtensilsCrossed
} from 'lucide-react'

const navigation = [
  { name: 'Gerencia (KPIs)', href: '/admin', icon: LayoutDashboard },
  { name: 'Punto de Venta', href: '/admin/pos', icon: Calculator },
  { name: 'Cocina', href: '/admin/cocina', icon: ChefHat },
  { name: 'Inventario', href: '/admin/inventario', icon: PackageSearch },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-white/5 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="h-20 flex items-center px-6 border-b border-white/5">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-red-500 p-1.5 rounded-lg">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <span className="font-outfit text-xl font-bold tracking-tight">Roti<span className="text-red-500">Admin</span></span>
            </Link>
          </div>
          
          <nav className="p-4 space-y-1">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">Modulos</div>
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-2 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-red-500' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/5 space-y-1">
          <button className="flex w-full items-center px-2 py-3 text-sm font-medium rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all">
            <Settings className="mr-3 h-5 w-5" />
            Configuración
          </button>
          <button className="flex w-full items-center px-2 py-3 text-sm font-medium rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all">
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 glass-panel border-b border-white/5 flex items-center justify-between px-8 md:hidden">
            <span className="font-outfit text-xl font-bold tracking-tight">Roti<span className="text-red-500">Admin</span></span>
        </header>
        <div className="flex-1 overflow-auto bg-[#0a0a0f] p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
