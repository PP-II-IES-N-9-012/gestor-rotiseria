'use client'

import { useState, useEffect } from 'react'
import { 
  PackageSearch, 
  Loader2, 
  Plus, 
  Edit2, 
  AlertCircle, 
  Trash2, 
  Search, 
  X, 
  Check, 
  Sparkles,
  CheckCircle2
} from 'lucide-react'
import { 
  getAllInventory, 
  refillInventory, 
  saveInventoryItem, 
  deleteInventoryItem 
} from '@/lib/api'
import { useAdminRestaurant } from '@/lib/AdminContext'

interface InventoryItem {
  id: string
  name: string
  quantity_available: number
  unit: string
  min_stock: number
}

const COMMON_UNITS = [
  'kg',
  'litros',
  'unidades',
  'gramos',
  'botellas',
  'paquetes',
  'atados',
  'docenas',
  'porciones'
]

export default function InventoryPage() {
  const restaurant = useAdminRestaurant()
  const restaurantId = restaurant?.id
  const primaryColor = restaurant?.primary_color || '#e59324'

  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCriticalOnly, setFilterCriticalOnly] = useState(false)

  // Modal State (Create / Edit Item)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [formName, setFormName] = useState('')
  const [formQuantity, setFormQuantity] = useState<number | ''>('')
  const [formUnit, setFormUnit] = useState('kg')
  const [formMinStock, setFormMinStock] = useState<number | ''>('')
  const [formError, setFormError] = useState('')

  // Quick Refill Modal State
  const [refillModalItem, setRefillModalItem] = useState<InventoryItem | null>(null)
  const [refillAmount, setRefillAmount] = useState<number | ''>('')
  const [refilling, setRefilling] = useState(false)

  const loadInventory = async () => {
    try {
      setLoading(true)
      const data = await getAllInventory(restaurantId)
      setItems(data || [])
    } catch (error) {
      console.error("Error loading inventory", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId])

  const openCreateModal = () => {
    setEditingItem(null)
    setFormName('')
    setFormQuantity('')
    setFormUnit('kg')
    setFormMinStock('')
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item)
    setFormName(item.name)
    setFormQuantity(item.quantity_available)
    setFormUnit(item.unit)
    setFormMinStock(item.min_stock)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      setFormError('El nombre del insumo es obligatorio.')
      return
    }

    setSaving(true)
    setFormError('')

    try {
      await saveInventoryItem({
        id: editingItem?.id,
        name: formName.trim(),
        quantity_available: Number(formQuantity) || 0,
        unit: formUnit.trim() || 'unidades',
        min_stock: Number(formMinStock) || 0,
      }, restaurantId || 'default')

      setIsModalOpen(false)
      loadInventory()
    } catch (err: any) {
      console.error('Error saving inventory item:', err)
      setFormError('No se pudo guardar el insumo. Intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (item: InventoryItem) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${item.name}" del inventario?`)) {
      return
    }

    try {
      await deleteInventoryItem(item.id, restaurantId)
      setItems(prev => prev.filter(i => i.id !== item.id))
    } catch (err) {
      console.error('Error deleting inventory item:', err)
      alert('Error al eliminar el insumo.')
    }
  }

  const handleQuickRefillSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!refillModalItem || !refillAmount || Number(refillAmount) <= 0) {
      alert('Ingresa una cantidad válida mayor a 0.')
      return
    }

    setRefilling(true)
    try {
      await refillInventory(refillModalItem.id, Number(refillAmount))
      setRefillModalItem(null)
      setRefillAmount('')
      loadInventory()
    } catch (err) {
      console.error('Error refilling item:', err)
      alert('No se pudo actualizar el stock.')
    } finally {
      setRefilling(false)
    }
  }

  // Filtrado
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.unit.toLowerCase().includes(searchQuery.toLowerCase())
    const isCritical = Number(item.quantity_available) <= Number(item.min_stock)
    const matchesCritical = !filterCriticalOnly || isCritical
    return matchesSearch && matchesCritical
  })

  const criticalItemsCount = items.filter(i => Number(i.quantity_available) <= Number(i.min_stock)).length

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div 
              className="p-2.5 rounded-xl border"
              style={{
                backgroundColor: `${primaryColor}18`,
                borderColor: `${primaryColor}40`,
                color: primaryColor
              }}
            >
              <PackageSearch className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-rustic text-white">
                Control de Inventario & Materias Primas
              </h1>
              <p className="text-xs text-[color:var(--store-text-muted)] mt-0.5">
                Seguimiento de existencias, umbrales de alerta y consumo automático por recetas.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Nuevo Insumo */}
        <button 
          onClick={openCreateModal}
          className="btn-primary flex items-center justify-center gap-2 py-2.5 px-5 text-sm font-semibold shadow-lg shadow-orange-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Insumo</span>
        </button>
      </div>

      {/* Search & Status Filters Bar */}
      <div className="bg-[color:var(--store-card-bg)] border border-[color:var(--store-border)] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xl">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o unidad..."
            className="w-full rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[var(--brand-primary,#e59324)] transition-colors border"
            style={{
              backgroundColor: 'var(--store-bg, #151210)',
              borderColor: 'var(--store-border, #382b21)'
            }}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setFilterCriticalOnly(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              !filterCriticalOnly
                ? 'text-white shadow-md'
                : 'text-[color:var(--store-text-muted)] hover:text-white'
            }`}
            style={!filterCriticalOnly ? { backgroundColor: primaryColor, borderColor: primaryColor } : { borderColor: 'var(--store-border)' }}
          >
            Todos ({items.length})
          </button>

          <button
            onClick={() => setFilterCriticalOnly(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              filterCriticalOnly
                ? 'bg-red-500/30 text-red-300 border-red-500/50 shadow-md'
                : 'text-red-400/80 border-red-500/20 hover:bg-red-500/10'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Críticos ({criticalItemsCount})</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl">
        <div className="flex-1 overflow-auto p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[color:var(--store-subtle-bg)] text-[color:var(--store-text-muted)] border-b border-[color:var(--store-border)]">
                  <th className="p-4 font-semibold">Materia Prima / Insumo</th>
                  <th className="p-4 font-semibold">Stock Actual</th>
                  <th className="p-4 font-semibold">Unidad</th>
                  <th className="p-4 font-semibold">Stock Mínimo</th>
                  <th className="p-4 font-semibold">Estado</th>
                  <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--store-border)]">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-[color:var(--store-text-faint)]">
                      <PackageSearch className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-white">No se encontraron insumos.</p>
                      <p className="mt-1 text-xs text-[color:var(--store-text-muted)]">
                        {searchQuery ? 'Prueba con otro término de búsqueda.' : 'Crea tu primer insumo con el botón superior.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => {
                    const isCritical = Number(item.quantity_available) <= Number(item.min_stock)
                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-[color:var(--store-subtle-bg)] transition-colors"
                      >
                        <td className="p-4 font-semibold text-sm text-white">
                          {item.name}
                        </td>
                        <td className="p-4">
                          <span className={`font-rustic font-bold text-base ${isCritical ? 'text-red-400' : 'text-emerald-400'}`}>
                            {item.quantity_available}
                          </span>
                        </td>
                        <td className="p-4 text-[color:var(--store-text-muted)] uppercase font-mono text-[11px]">
                          {item.unit}
                        </td>
                        <td className="p-4 text-[color:var(--store-text-muted)] font-mono">
                          {item.min_stock} {item.unit}
                        </td>
                        <td className="p-4">
                          {isCritical ? (
                            <span className="flex items-center gap-1 text-[11px] font-semibold bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full w-fit border border-red-500/30">
                              <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                              <span>¡Crítico!</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full w-fit border border-emerald-500/30">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* BOTÓN FUNCIONAL: + Ingreso rápido */}
                            <button 
                              onClick={() => {
                                setRefillModalItem(item)
                                setRefillAmount('')
                              }}
                              className="border border-[color:var(--store-border)] bg-[color:var(--store-subtle-bg)] hover:bg-white/10 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-all"
                            >
                              + Ingreso
                            </button>

                            {/* BOTÓN FUNCIONAL: Editar insumo */}
                            <button 
                              onClick={() => openEditModal(item)}
                              className="text-[color:var(--store-text-muted)] hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-colors"
                              title="Editar insumo"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* BOTÓN FUNCIONAL: Eliminar insumo */}
                            <button 
                              onClick={() => handleDeleteItem(item)}
                              className="text-[color:var(--store-text-faint)] hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                              title="Eliminar insumo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* MODAL 1: Crear / Editar Insumo */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-[color:var(--store-card-bg)] border border-[color:var(--store-border)] rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-[color:var(--store-border)]">
              <div>
                <span className="badge-rustic text-[10px]">Gestión de Stock</span>
                <h3 className="font-rustic font-bold text-xl text-white mt-1">
                  {editingItem ? 'Editar Insumo' : 'Nuevo Insumo de Materia Prima'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-[color:var(--store-text-muted)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              
              {formError && (
                <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-[color:var(--store-text-muted)] mb-1">
                  Nombre de la Materia Prima:
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ej: Carne Picada Especial, Papas Blancas..."
                  required
                  className="w-full bg-black/30 border border-[color:var(--store-border)] rounded-xl px-3.5 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[var(--brand-primary,#e59324)] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[color:var(--store-text-muted)] mb-1">
                    Stock Actual:
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    required
                    className="w-full bg-black/30 border border-[color:var(--store-border)] rounded-xl px-3.5 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[var(--brand-primary,#e59324)] text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[color:var(--store-text-muted)] mb-1">
                    Unidad de Medida:
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-black/30 border border-[color:var(--store-border)] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[var(--brand-primary,#e59324)] text-sm"
                  >
                    {COMMON_UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[color:var(--store-text-muted)] mb-1">
                  Stock Mínimo (Umbral de Alerta Crítica):
                </label>
                <input
                  type="number"
                  step="any"
                  value={formMinStock}
                  onChange={(e) => setFormMinStock(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="ej: 10"
                  required
                  className="w-full bg-black/30 border border-[color:var(--store-border)] rounded-xl px-3.5 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[var(--brand-primary,#e59324)] text-sm font-mono"
                />
                <p className="text-[11px] text-[color:var(--store-text-muted)] mt-1">
                  Cuando el stock baje a este valor o menos, aparecerá en rojo en las alertas gerenciales.
                </p>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn-primary py-3 text-xs font-bold flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingItem ? 'Guardar Cambios' : 'Registrar Insumo'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary py-3 text-xs font-bold"
                >
                  Cancelar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: + Ingreso Rápido de Stock */}
      {refillModalItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setRefillModalItem(null)}
        >
          <div 
            className="bg-[color:var(--store-card-bg)] border border-[color:var(--store-border)] rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[color:var(--store-border)]">
              <div>
                <span className="badge-rustic text-[10px]">Recepción de Proveedor</span>
                <h3 className="font-rustic font-bold text-lg text-white mt-1">
                  + Ingreso de {refillModalItem.name}
                </h3>
              </div>
              <button 
                onClick={() => setRefillModalItem(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickRefillSubmit} className="space-y-4 text-xs">
              <p className="text-[color:var(--store-text-muted)] leading-relaxed">
                Stock actual: <strong className="text-white">{refillModalItem.quantity_available} {refillModalItem.unit}</strong>.
                Ingresa cuántas unidades/kilos estás recibiendo para sumarlas al inventario:
              </p>

              <div>
                <label className="block font-semibold text-[color:var(--store-text-muted)] mb-1">
                  Cantidad a ingresar ({refillModalItem.unit}):
                </label>
                <input
                  type="number"
                  step="any"
                  autoFocus
                  value={refillAmount}
                  onChange={(e) => setRefillAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="ej: 10"
                  required
                  className="w-full bg-black/30 border border-[color:var(--store-border)] rounded-xl px-3.5 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[var(--brand-primary,#e59324)] text-base font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={refilling}
                  className="flex-1 btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  {refilling && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Confirmar Ingreso</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRefillModalItem(null)}
                  className="btn-secondary py-2.5 text-xs font-bold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
