'use client'

import { useState, useEffect } from 'react'
import { 
  PackageSearch, 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  X, 
  Save, 
  Check 
} from 'lucide-react'
import { 
  getAllInventory, 
  refillInventory, 
  createInventoryItem, 
  updateInventoryItem, 
  deleteInventoryItem 
} from '@/lib/api'
import { useAdminRestaurant } from '@/lib/AdminContext'

const UNIT_OPTIONS = [
  'kg',
  'gramos',
  'unidades',
  'docenas',
  'litros',
  'ml',
  'paquetes',
  'latas',
  'porciones'
]

export default function InventoryPage() {
  const restaurant = useAdminRestaurant()
  const restaurantId = restaurant?.id
  const primaryColor = restaurant?.primary_color || '#e59324'
  const secondaryColor = restaurant?.secondary_color || '#d34e2c'

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    quantity_available: 0,
    unit: 'kg',
    min_stock: 5
  })

  const showNotice = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 3500)
  }

  const loadInventory = async () => {
    try {
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
    setFormData({
      name: '',
      quantity_available: 0,
      unit: 'kg',
      min_stock: 5
    })
    setModalOpen(true)
  }

  const openEditModal = (item: any) => {
    setEditingItem(item)
    setFormData({
      name: item.name || '',
      quantity_available: Number(item.quantity_available) || 0,
      unit: item.unit || 'kg',
      min_stock: Number(item.min_stock) || 0
    })
    setModalOpen(true)
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      showNotice('error', 'Por favor ingresa el nombre del insumo.')
      return
    }
    setSaving(true)
    try {
      if (editingItem) {
        await updateInventoryItem(
          editingItem.id,
          {
            name: formData.name,
            quantity_available: Number(formData.quantity_available),
            unit: formData.unit,
            min_stock: Number(formData.min_stock)
          },
          restaurantId
        )
        showNotice('success', `Insumo "${formData.name}" actualizado correctamente.`)
      } else {
        await createInventoryItem(
          {
            name: formData.name,
            quantity_available: Number(formData.quantity_available),
            unit: formData.unit,
            min_stock: Number(formData.min_stock)
          },
          restaurantId
        )
        showNotice('success', `Insumo "${formData.name}" agregado al inventario.`)
      }
      setModalOpen(false)
      await loadInventory()
    } catch (error: any) {
      console.error('Error saving inventory item:', error)
      showNotice('error', error?.message || 'No se pudo guardar el insumo.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: any) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el insumo "${item.name}"?`)) {
      return
    }
    setDeletingId(item.id)
    try {
      await deleteInventoryItem(item.id, restaurantId)
      setItems(prev => prev.filter(i => i.id !== item.id))
      showNotice('success', `Insumo "${item.name}" eliminado.`)
    } catch (error: any) {
      console.error('Error deleting inventory item:', error)
      showNotice('error', error?.message || 'Error al eliminar el insumo.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleRefill = async (id: string, name: string) => {
    const amountStr = window.prompt(`¿Cuántas unidades de "${name}" deseas agregar al stock actual?`)
    if (!amountStr) return
    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) {
      showNotice('error', 'Por favor ingresa un número válido mayor a 0.')
      return
    }

    try {
      await refillInventory(id, amount)
      showNotice('success', `Se sumaron +${amount} a "${name}".`)
      loadInventory()
    } catch (error) {
      console.error("Error refilling inventory", error)
      showNotice('error', 'Error al actualizar el stock.')
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-white">Inventario de Insumos</h1>
          <p className="text-[color:var(--store-text-muted)] mt-1">
            Gestión de materia prima, control de stock mínimo y reposición.
          </p>
        </div>
        <button 
          type="button"
          onClick={openCreateModal}
          className="btn-primary flex items-center justify-center gap-2 py-2.5 px-5 font-semibold shadow-lg"
        >
          <Plus className="w-4 h-4" /> Nuevo Insumo
        </button>
      </div>

      {feedback && (
        <div 
          className={`mb-4 p-3.5 rounded-2xl border text-xs font-medium flex items-center gap-2 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="glass-panel rounded-2xl flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[color:var(--store-border)] bg-[color:var(--store-subtle-bg)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[color:var(--store-text-muted)] font-medium">
            <PackageSearch className="w-5 h-5" style={{ color: primaryColor }} />
            <span>Insumos Registrados ({items.length})</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-0">
          {loading ? (
            <div className="flex justify-center items-center h-full py-16">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[color:var(--store-subtle-bg)] text-[color:var(--store-text-muted)] text-sm">
                  <th className="p-4 font-medium border-b border-[color:var(--store-border)]">Insumo</th>
                  <th className="p-4 font-medium border-b border-[color:var(--store-border)]">Stock Actual</th>
                  <th className="p-4 font-medium border-b border-[color:var(--store-border)]">Unidad</th>
                  <th className="p-4 font-medium border-b border-[color:var(--store-border)]">Stock Mínimo</th>
                  <th className="p-4 font-medium border-b border-[color:var(--store-border)]">Estado</th>
                  <th className="p-4 font-medium border-b border-[color:var(--store-border)] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-[color:var(--store-text-faint)]">
                      No hay insumos registrados. Haz clic en <strong>&quot;+ Nuevo Insumo&quot;</strong> para comenzar.
                    </td>
                  </tr>
                ) : (
                  items.map(item => {
                    const isCritical = Number(item.quantity_available) <= Number(item.min_stock)
                    return (
                      <tr key={item.id} className="hover:bg-[color:var(--store-subtle-bg)] border-b border-[color:var(--store-border)] transition-colors">
                        <td className="p-4 font-medium text-white">{item.name}</td>
                        <td className="p-4">
                          <span className={`font-bold ${isCritical ? 'text-red-400' : 'text-[color:var(--store-text-soft)]'}`}>
                            {item.quantity_available}
                          </span>
                        </td>
                        <td className="p-4 text-[color:var(--store-text-muted)]">{item.unit}</td>
                        <td className="p-4 text-[color:var(--store-text-muted)]">{item.min_stock}</td>
                        <td className="p-4">
                          {isCritical ? (
                            <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full w-fit font-semibold">
                              <AlertCircle className="w-3 h-3" /> Crítico
                            </span>
                          ) : (
                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full w-fit font-semibold">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <button 
                            type="button"
                            onClick={() => handleRefill(item.id, item.name)}
                            className="border border-[color:var(--store-border)] bg-[color:var(--store-card-bg)] hover:brightness-125 text-white text-xs px-3 py-1.5 rounded-lg mr-2 transition-all font-medium"
                          >
                            + Ingreso
                          </button>
                          <button 
                            type="button"
                            onClick={() => openEditModal(item)}
                            title="Editar insumo"
                            className="text-[color:var(--store-text-muted)] hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 mr-1 inline-flex items-center"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item)}
                            title="Eliminar insumo"
                            className="text-[color:var(--store-text-muted)] hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 inline-flex items-center disabled:opacity-50"
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
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

      {/* Modal Crear / Editar Insumo */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div 
            className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden"
            style={{
              backgroundColor: 'var(--store-card-bg, #1f1712)',
              borderColor: `color-mix(in srgb, ${primaryColor} 30%, var(--store-border, #3d2f25))`
            }}
          >
            <div 
              className="p-5 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--store-border, #3d2f25)' }}
            >
              <h3 className="text-xl font-bold font-rustic text-white">
                {editingItem ? 'Editar Insumo' : 'Agregar Nuevo Insumo'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-[color:var(--store-text-muted)] hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[color:var(--store-text-soft)] mb-1.5">
                  Nombre del Insumo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Muzzarella en Barra, Carne Picada, Harina 0000"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[color:var(--store-subtle-bg)] border border-[color:var(--store-border)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--brand-primary,#e59324)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--store-text-soft)] mb-1.5">
                    Stock Disponible
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.quantity_available}
                    onChange={e => setFormData({ ...formData, quantity_available: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[color:var(--store-subtle-bg)] border border-[color:var(--store-border)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--brand-primary,#e59324)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[color:var(--store-text-soft)] mb-1.5">
                    Unidad de Medida
                  </label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-[color:var(--store-subtle-bg)] border border-[color:var(--store-border)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--brand-primary,#e59324)]"
                  >
                    {UNIT_OPTIONS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[color:var(--store-text-soft)] mb-1.5">
                  Stock Mínimo de Alerta
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.min_stock}
                  onChange={e => setFormData({ ...formData, min_stock: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[color:var(--store-subtle-bg)] border border-[color:var(--store-border)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--brand-primary,#e59324)]"
                />
                <p className="text-[11px] text-[color:var(--store-text-faint)] mt-1">
                  Cuando el stock sea igual o menor a este valor, se marcará como <strong>Crítico</strong>.
                </p>
              </div>

              <div className="pt-4 border-t border-[color:var(--store-border)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[color:var(--store-text-muted)] hover:text-white border border-[color:var(--store-border)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                  }}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{editingItem ? 'Guardar Cambios' : 'Crear Insumo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
