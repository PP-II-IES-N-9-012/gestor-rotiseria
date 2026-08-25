'use client'

import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { getTodayOrders, getCriticalInventory, refillInventory } from '@/lib/api'

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [ordersData, inventoryData] = await Promise.all([
        getTodayOrders(),
        getCriticalInventory()
      ])
      setOrders(ordersData || [])
      setInventory(inventoryData || [])
    } catch (error) {
      console.error("Error loading dashboard data", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefill = async (itemId: string) => {
    try {
      await refillInventory(itemId, 10) // Mock adding 10 units
      alert("Insumo recargado con éxito.")
      loadData()
    } catch (error) {
      console.error("Error refilling inventory", error)
      alert("Error al intentar recargar insumo.")
    }
  }

  // Calculate KPIs
  const totalSales = orders.reduce((acc, o) => acc + Number(o.total_amount), 0)
  const totalOrders = orders.length
  const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0

  const stats = [
    { name: 'Ventas de hoy', value: `$${totalSales.toLocaleString()}`, icon: DollarSign, trend: 'En vivo', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { name: 'Pedidos Totales', value: totalOrders.toString(), icon: ShoppingBag, trend: 'En vivo', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { name: 'Ticket Promedio', value: `$${averageTicket.toLocaleString(undefined, {maximumFractionDigits: 0})}`, icon: TrendingUp, trend: 'En vivo', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { name: 'Insumos Críticos', value: inventory.length.toString(), icon: AlertCircle, trend: 'Revisar', color: 'text-red-400', bg: 'bg-red-400/10' },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-outfit text-white">Dashboard Gerencial</h1>
        <p className="text-gray-400 mt-1">Resumen general de las operaciones de hoy.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-red-500" />
        </div>
      ) : (
        <>
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
                </div>
              </div>
            ))}
          </div>

          {/* Main Charts & Tables Area (Mocked visual placeholders) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 min-h-[400px] flex flex-col">
              <h2 className="text-lg font-bold font-outfit mb-4">Ventas por Hora (Simulado)</h2>
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
                <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded-full">En Vivo</span>
              </h2>
              {inventory.length === 0 ? (
                <p className="text-gray-500 text-sm">Todo el stock está en niveles óptimos.</p>
              ) : (
                <ul className="space-y-4">
                  {inventory.map(item => (
                    <li key={item.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl">
                      <div>
                        <p className="font-medium text-red-400">{item.name}</p>
                        <p className="text-xs text-gray-400">Quedan {item.quantity_available} {item.unit}</p>
                      </div>
                      <button 
                        onClick={() => handleRefill(item.id)}
                        className="text-xs border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        Pedir
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
