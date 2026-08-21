import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  AlertCircle 
} from 'lucide-react'

export default function AdminDashboard() {
  // Mock Data for KPIs
  const stats = [
    { name: 'Ventas de hoy', value: '$124,500', icon: DollarSign, trend: '+12%', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { name: 'Pedidos Totales', value: '84', icon: ShoppingBag, trend: '+5%', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { name: 'Ticket Promedio', value: '$1,480', icon: TrendingUp, trend: '+2%', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { name: 'Insumos Críticos', value: '3', icon: AlertCircle, trend: 'Revisar', color: 'text-red-400', bg: 'bg-red-400/10' },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-outfit text-white">Dashboard Gerencial</h1>
        <p className="text-gray-400 mt-1">Resumen general de las operaciones de hoy.</p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="glass-panel p-6 rounded-2xl border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                <p className="mt-2 text-3xl font-bold text-white font-outfit">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={stat.color}>{stat.trend}</span>
              <span className="text-gray-500 ml-2">vs. ayer</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts & Tables Area (Mocked visual placeholders) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 min-h-[400px] flex flex-col">
          <h2 className="text-lg font-bold font-outfit mb-4">Ventas por Hora</h2>
          <div className="flex-1 flex items-end justify-between space-x-2 pb-4">
             {/* Mock Chart Bars */}
             {[40, 60, 30, 80, 100, 70, 90, 50].map((height, i) => (
               <div key={i} className="w-full bg-slate-800 rounded-t-md relative group">
                 <div 
                  className="absolute bottom-0 w-full bg-red-500 rounded-t-md transition-all duration-500 group-hover:bg-red-400" 
                  style={{ height: `${height}%` }}
                 />
               </div>
             ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>10:00</span>
            <span>13:00</span>
            <span>17:00</span>
            <span>22:00</span>
          </div>
        </div>
        
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-bold font-outfit mb-4 flex items-center justify-between">
            <span>Alertas de Inventario</span>
            <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded-full">Inteligente</span>
          </h2>
          <ul className="space-y-4">
            <li className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl">
              <div>
                <p className="font-medium text-red-400">Muzzarella</p>
                <p className="text-xs text-gray-400">Quedan 2.5 kg</p>
              </div>
              <button className="text-xs border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5">Pedir</button>
            </li>
            <li className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl">
              <div>
                <p className="font-medium text-yellow-400">Harina</p>
                <p className="text-xs text-gray-400">Quedan 8 kg</p>
              </div>
              <button className="text-xs border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5">Pedir</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
