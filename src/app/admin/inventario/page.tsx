'use client'

import { useState, useEffect } from 'react'
import { PackageSearch, Loader2, Plus, Edit2, AlertCircle } from 'lucide-react'
import { getAllInventory, refillInventory } from '@/lib/api'

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadInventory = async () => {
    try {
      const data = await getAllInventory()
      setItems(data || [])
    } catch (error) {
      console.error("Error loading inventory", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [])

  const handleRefill = async (id: string, name: string) => {
    const amountStr = window.prompt(`¿Cuántas unidades de ${name} deseas agregar?`)
    if (!amountStr) return
    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) {
      alert("Por favor ingresa un número válido mayor a 0.")
      return
    }

    try {
      await refillInventory(id, amount)
      alert("Stock actualizado correctamente.")
      loadInventory()
    } catch (error) {
      console.error("Error refilling inventory", error)
      alert("Error al actualizar el stock.")
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-white">Inventario</h1>
          <p className="text-gray-400 mt-1">Gestión de insumos y niveles de stock.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 py-2">
          <Plus className="w-4 h-4" /> Nuevo Insumo
        </button>
      </div>

      <div className="glass-panel rounded-2xl flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-slate-800/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400 font-medium">
            <PackageSearch className="w-5 h-5" />
            <span>Insumos Registrados ({items.length})</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-0">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-gray-400 text-sm">
                  <th className="p-4 font-medium border-b border-white/5">Insumo</th>
                  <th className="p-4 font-medium border-b border-white/5">Stock Actual</th>
                  <th className="p-4 font-medium border-b border-white/5">Unidad</th>
                  <th className="p-4 font-medium border-b border-white/5">Stock Mínimo</th>
                  <th className="p-4 font-medium border-b border-white/5">Estado</th>
                  <th className="p-4 font-medium border-b border-white/5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No hay insumos registrados.
                    </td>
                  </tr>
                ) : (
                  items.map(item => {
                    const isCritical = item.quantity_available <= item.min_stock
                    return (
                      <tr key={item.id} className="hover:bg-slate-800/30 border-b border-white/5 transition-colors">
                        <td className="p-4 font-medium text-white">{item.name}</td>
                        <td className="p-4">
                          <span className={`font-bold ${isCritical ? 'text-red-400' : 'text-gray-200'}`}>
                            {item.quantity_available}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400">{item.unit}</td>
                        <td className="p-4 text-gray-400">{item.min_stock}</td>
                        <td className="p-4">
                          {isCritical ? (
                            <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full w-fit">
                              <AlertCircle className="w-3 h-3" /> Crítico
                            </span>
                          ) : (
                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full w-fit">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleRefill(item.id, item.name)}
                            className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-lg mr-2 transition-colors"
                          >
                            + Ingreso
                          </button>
                          <button className="text-gray-400 hover:text-white transition-colors p-1.5">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
