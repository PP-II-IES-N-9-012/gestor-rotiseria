'use client'

import { Clock, CheckCircle2 } from 'lucide-react'

const mockOrders = [
  { id: '1023', items: ['2x Pizza Muzzarella', '1x Empanada de Carne'], status: 'pending', time: '12:30', notes: 'Sin aceitunas en la pizza' },
  { id: '1024', items: ['1x Milanesa con Papas Fritas'], status: 'preparing', time: '12:35', notes: '' },
  { id: '1025', items: ['6x Empanada de JyQ'], status: 'pending', time: '12:40', notes: '' },
]

export default function KitchenPage() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-white">Comandas - Cocina</h1>
          <p className="text-gray-400 mt-1">Gestión de preparación de pedidos en tiempo real.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-6">
        
        {/* Column 1: Pendientes */}
        <div className="flex flex-col glass-panel rounded-2xl p-4">
          <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
            <h2 className="font-bold text-lg text-white">Pendientes</h2>
            <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full text-xs font-bold">2</span>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {mockOrders.filter(o => o.status === 'pending').map(order => (
              <div key={order.id} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-lg font-outfit">#{order.id}</span>
                  <div className="flex items-center text-gray-400 text-sm">
                    <Clock className="w-4 h-4 mr-1" /> {order.time}
                  </div>
                </div>
                <ul className="space-y-1 mb-3">
                  {order.items.map((item, i) => (
                    <li key={i} className="text-gray-200 text-sm font-medium">• {item}</li>
                  ))}
                </ul>
                {order.notes && (
                  <p className="text-xs text-amber-400 bg-amber-400/10 p-2 rounded mb-3">Nota: {order.notes}</p>
                )}
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg text-sm transition-colors">
                  Comenzar Preparación
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: En Preparación */}
        <div className="flex flex-col glass-panel rounded-2xl p-4">
          <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
            <h2 className="font-bold text-lg text-white">En Preparación</h2>
            <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs font-bold">1</span>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {mockOrders.filter(o => o.status === 'preparing').map(order => (
              <div key={order.id} className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-xl shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-lg font-outfit">#{order.id}</span>
                  <div className="flex items-center text-blue-400 text-sm animate-pulse">
                    <Clock className="w-4 h-4 mr-1" /> {order.time}
                  </div>
                </div>
                <ul className="space-y-1 mb-3">
                  {order.items.map((item, i) => (
                    <li key={i} className="text-gray-200 text-sm font-medium">• {item}</li>
                  ))}
                </ul>
                <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg text-sm transition-colors flex justify-center items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Marcar Listo
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Listos */}
        <div className="flex flex-col glass-panel rounded-2xl p-4 opacity-70">
          <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
            <h2 className="font-bold text-lg text-gray-400">Listos (Recientes)</h2>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto">
             <div className="bg-emerald-900/10 border border-emerald-900/30 p-4 rounded-xl">
               <div className="flex justify-between items-center">
                 <span className="text-gray-500 line-through">#1022</span>
                 <span className="text-emerald-500 text-xs font-bold uppercase">Entregado</span>
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  )
}
