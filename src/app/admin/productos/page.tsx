'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  UtensilsCrossed, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Loader2, 
  Package, 
  DollarSign, 
  Tag, 
  AlertCircle, 
  Sparkles, 
  Power,
  Image as ImageIcon,
  Upload,
  CheckCircle2
} from 'lucide-react'
import { 
  getAdminProducts, 
  saveProduct, 
  deleteProduct, 
  toggleProductAvailability, 
  getAllInventory,
  uploadRestaurantMedia,
  invalidateCache,
  type ProductItem 
} from '@/lib/api'
import { useAdminRestaurant } from '@/lib/AdminContext'
import { isLocalOnlyRestaurantId, subscribeToStoreRealtime } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'

interface RecipeRow {
  inventory_item_id: string
  quantity: number
}

const DEFAULT_IMAGES = [
  { label: 'Plato Casero / Horno', url: '/hero_rotiseria.jpg' },
  { label: 'Especialidades / Minutas', url: '/artisanal_dishes.jpg' },
]

const BADGE_PRESETS = [
  { label: '🚫 Sin etiqueta (Ocultar)', value: '' },
  { label: '🔥 Más pedido', value: '🔥 Más pedido' },
  { label: '✨ ¡Nuevo!', value: '✨ ¡Nuevo!' },
  { label: '🏷️ Oferta', value: '🏷️ Oferta' },
  { label: '⭐ Recomendado', value: '⭐ Recomendado' },
  { label: '👑 Especialidad', value: '👑 Especialidad' },
  { label: '⚡ Promo del Día', value: '⚡ Promo del Día' },
]

export default function AdminProductsPage() {
  const restaurant = useAdminRestaurant()
  const restaurantId = restaurant?.id
  const primaryColor = restaurant?.primary_color || '#e59324'

  const [products, setProducts] = useState<ProductItem[]>([])
  const [inventoryList, setInventoryList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form State
  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formPrice, setFormPrice] = useState<number | ''>('')
  const [formDescription, setFormDescription] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formBadge, setFormBadge] = useState('')
  const [formIsAvailable, setFormIsAvailable] = useState(true)
  const [formRecipe, setFormRecipe] = useState<RecipeRow[]>([])
  const [formError, setFormError] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showManualUrl, setShowManualUrl] = useState(false)
  const [actionToast, setActionToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setActionToast({ type, message })
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setActionToast(null), 3500)
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setFormError('')
    try {
      const url = await uploadRestaurantMedia(file, 'product', restaurantId || 'default')
      setFormImageUrl(url)
    } catch (err: any) {
      console.error('Error uploading product image:', err)
      setFormError('No se pudo procesar la imagen del plato.')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const [prods, inv] = await Promise.all([
        getAdminProducts(restaurantId),
        getAllInventory(restaurantId)
      ])
      setProducts(prods || [])
      setInventoryList(inv || [])
    } catch (err) {
      console.error('Error loading products/inventory:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(false)
    if (!restaurantId) return

    const unsubStore = subscribeToStoreRealtime(restaurantId, (evt) => {
      if (evt.type === 'inventory_update' || evt.type === 'product_update') {
        invalidateCache('admin_products')
        invalidateCache('products')
        invalidateCache('all_inventory')
        loadData(true)
      }
    })

    if (isLocalOnlyRestaurantId(restaurantId)) {
      return () => {
        unsubStore()
      }
    }

    const channel = supabase
      .channel(`admin-products-sync-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products', filter: `restaurant_id=eq.${restaurantId}` },
        () => {
          invalidateCache('admin_products')
          invalidateCache('products')
          loadData(true)
        }
      )
      .subscribe()

    return () => {
      unsubStore()
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId])

  const openCreateModal = () => {
    setEditingId(null)
    setFormName('')
    setFormCode('')
    setFormCategory('Platos Principales')
    setFormPrice('')
    setFormDescription('')
    setFormImageUrl('/hero_rotiseria.jpg')
    setFormBadge('')
    setFormIsAvailable(true)
    setFormRecipe([])
    setFormError('')
    setUploadingImage(false)
    setShowManualUrl(false)
    setIsModalOpen(true)
  }

  const openEditModal = (product: ProductItem) => {
    setEditingId(product.id)
    setFormName(product.name || '')
    setFormCode(product.code || '')
    setFormCategory(product.category || 'Varios')
    setFormPrice(Number(product.price) || 0)
    setFormDescription(product.description || '')
    setFormImageUrl(product.image_url || '')
    setFormBadge(product.badge || '')
    setFormIsAvailable(product.is_available)
    setUploadingImage(false)
    setShowManualUrl(false)
    
    // Cargar receta existente
    const initialRecipe: RecipeRow[] = (product.product_ingredients || []).map(pi => ({
      inventory_item_id: pi.inventory_item_id,
      quantity: Number(pi.quantity) || 1
    }))
    setFormRecipe(initialRecipe)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleAddRecipeItem = () => {
    if (inventoryList.length === 0) {
      setFormError('Primero debes agregar insumos en la sección de Inventario.')
      return
    }
    // Seleccionar por defecto el primer insumo que aún no esté en la receta
    const available = inventoryList.find(inv => !formRecipe.some(r => r.inventory_item_id === inv.id))
    const itemToAdd = available || inventoryList[0]
    setFormRecipe([...formRecipe, { inventory_item_id: itemToAdd.id, quantity: 1 }])
  }

  const handleRemoveRecipeItem = (index: number) => {
    setFormRecipe(formRecipe.filter((_, i) => i !== index))
  }

  const handleRecipeChange = (index: number, field: 'inventory_item_id' | 'quantity', val: any) => {
    const updated = [...formRecipe]
    if (field === 'quantity') {
      updated[index].quantity = Math.max(0.001, parseFloat(val) || 0)
    } else {
      updated[index].inventory_item_id = val
    }
    setFormRecipe(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      setFormError('Por favor ingresa un nombre para el plato.')
      return
    }
    if (!formPrice || Number(formPrice) <= 0) {
      setFormError('Por favor ingresa un precio válido.')
      return
    }

    if (!restaurantId) {
      setFormError('No se encontró el ID del restaurante asignado.')
      return
    }

    setSaving(true)
    setFormError('')

    try {
      await saveProduct(
        {
          id: editingId || undefined,
          name: formName.trim(),
          code: formCode.trim() || undefined,
          category: formCategory.trim() || 'Varios',
          price: Number(formPrice),
          description: formDescription.trim(),
          image_url: formImageUrl.trim(),
          badge: formBadge.trim(),
          is_available: formIsAvailable
        },
        formRecipe,
        restaurantId
      )

      setIsModalOpen(false)
      showToast('success', editingId ? 'Plato actualizado con éxito.' : 'Nuevo plato incorporado a la carta.')
      loadData(true)
    } catch (err: any) {
      console.error('Error saving product:', err)
      setFormError(err.message || 'Error al guardar el plato.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAvailable = async (product: ProductItem) => {
    try {
      await toggleProductAvailability(product.id, !product.is_available, restaurantId)
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_available: !p.is_available } : p))
      showToast('success', !product.is_available ? `"${product.name}" activado en la carta.` : `"${product.name}" pausado temporalmente.`)
    } catch (err) {
      console.error('Error toggling availability:', err)
      showToast('error', 'No se pudo cambiar la disponibilidad.')
    }
  }

  const handleDelete = async (product: ProductItem) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${product.name}" del catálogo?`)) return

    try {
      await deleteProduct(product.id, restaurantId)
      setProducts(prev => prev.filter(p => p.id !== product.id))
      showToast('success', `"${product.name}" eliminado del catálogo.`)
    } catch (err) {
      console.error('Error deleting product:', err)
      showToast('error', 'No se pudo eliminar el plato.')
    }
  }

  // Filtrado seguro ante valores nulos
  const categories = ['Todas', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch = !q ||
                          (p.name || '').toLowerCase().includes(q) || 
                          (p.code || '').toLowerCase().includes(q) ||
                          (p.category || '').toLowerCase().includes(q)
    const matchesCategory = categoryFilter === 'Todas' || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {actionToast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2 text-xs font-semibold ${actionToast.type === 'success' ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200' : 'bg-rose-950/95 border-rose-500/50 text-rose-200'}`}>
            {actionToast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{actionToast.message}</span>
          </div>
        </div>
      )}
      
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
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-rustic text-white tracking-wide">
                Catálogo de Platos & Recetas
              </h1>
              <p className="text-xs text-[color:var(--store-text-muted)]">
                Gestiona tu carta y configura qué insumos del inventario consume cada venta automáticamente.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center justify-center gap-2 py-2.5 px-5 text-sm font-semibold shadow-lg shadow-orange-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Plato</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[color:var(--store-card-bg)] border border-[color:var(--store-border)] rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="w-full rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[var(--brand-primary,#e59324)] transition-colors border"
            style={{
              backgroundColor: 'var(--store-bg, #151210)',
              borderColor: 'var(--store-border, #382b21)'
            }}
          />
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                categoryFilter === cat
                  ? 'text-white shadow-md'
                  : 'hover:text-white'
              }`}
              style={categoryFilter === cat ? {
                backgroundColor: primaryColor,
                borderColor: primaryColor
              } : {
                backgroundColor: 'var(--store-card-bg, #241a14)',
                borderColor: 'var(--store-border, #382b21)',
                color: 'var(--store-text-muted, #a88a70)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div 
          className="rounded-2xl p-12 text-center border"
          style={{
            backgroundColor: 'var(--store-card-bg, #1b1511)',
            borderColor: 'var(--store-border, #382b21)'
          }}
        >
          <UtensilsCrossed className="w-12 h-12 text-[color:var(--store-text-faint)] mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-rustic text-white mb-1">No se encontraron platos</h3>
          <p className="text-xs max-w-sm mx-auto mb-6" style={{ color: 'var(--store-text-muted, #a88a70)' }}>
            {searchQuery ? 'Prueba con otros términos de búsqueda o cambia la categoría.' : 'Aún no tienes platos en tu catálogo. Agrega el primero con el botón superior.'}
          </p>
          <button
            onClick={openCreateModal}
            className="btn-amber text-xs py-2 px-4 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Plato Ahora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const hasRecipe = product.product_ingredients && product.product_ingredients.length > 0

            return (
              <div 
                key={product.id}
                className="rounded-2xl overflow-hidden shadow-lg transition-all flex flex-col justify-between group border"
                style={{
                  backgroundColor: 'var(--store-card-bg, #1b1511)',
                  borderColor: `color-mix(in srgb, ${primaryColor} 18%, var(--store-border, #382b21))`
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = `${primaryColor}60`}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = `color-mix(in srgb, ${primaryColor} 18%, var(--store-border, #382b21))`}
              >
                <div>
                  {/* Image & Badges */}
                  <div 
                    className="relative h-44 w-full overflow-hidden"
                    style={{ backgroundColor: 'var(--store-subtle-bg, #130f0c)' }}
                  >
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90 group-hover:brightness-100"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex flex-col items-center justify-center gap-1"
                        style={{ color: 'var(--store-text-muted, #6e5443)' }}
                      >
                        <ImageIcon className="w-8 h-8 opacity-40" />
                        <span className="text-[11px]">Sin imagen</span>
                      </div>
                    )}

                    {/* Price Tag */}
                    <div 
                      className="absolute top-3 right-3 backdrop-blur-sm border text-white font-rustic font-bold px-3 py-1 rounded-xl shadow-lg flex items-center gap-1"
                      style={{ 
                        backgroundColor: 'var(--store-bg, #151210)',
                        borderColor: `${primaryColor}40` 
                      }}
                    >
                      <span className="text-xs" style={{ color: primaryColor }}>$</span>
                      <span className="text-base">{Number(product.price).toLocaleString()}</span>
                    </div>

                    {/* Category */}
                    <div 
                      className="absolute top-3 left-3 backdrop-blur-sm border text-[10px] px-2.5 py-1 rounded-lg font-medium"
                      style={{
                        backgroundColor: 'var(--store-badge-bg, rgba(30,23,19,0.85))',
                        borderColor: `${primaryColor}30`,
                        color: primaryColor
                      }}
                    >
                      {product.category}
                    </div>

                    {/* Availability Switch */}
                    <button
                      onClick={() => handleToggleAvailable(product)}
                      title={product.is_available ? 'Disponible en la carta (Click para pausar)' : 'Pausado (Click para activar)'}
                      className={`absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-sm transition-all ${
                        product.is_available 
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900' 
                          : 'bg-red-950/80 text-red-300 border border-red-500/40 hover:bg-red-900'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{product.is_available ? 'En Carta' : 'Pausado'}</span>
                    </button>

                    {/* Promotional Badge */}
                    {product.badge && (
                      <div
                        className="absolute bottom-3 right-3 backdrop-blur-sm border text-[10px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 shadow-md"
                        style={{
                          backgroundColor: 'rgba(18,14,11,0.88)',
                          borderColor: `${primaryColor}55`,
                          color: primaryColor,
                        }}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{product.badge}</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-rustic font-bold text-white text-lg transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                        <span 
                          className="text-[10px] font-mono shrink-0"
                          style={{ color: 'var(--store-text-muted, #806754)' }}
                        >
                          {product.code}
                        </span>
                      </div>
                      {product.description && (
                        <p 
                          className="text-xs line-clamp-2 mt-1 leading-relaxed"
                          style={{ color: 'var(--store-text-muted, #a88a70)' }}
                        >
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Recipe Inventory Deduction Details */}
                    <div 
                      className="rounded-xl p-2.5 space-y-1.5 border"
                      style={{
                        backgroundColor: 'var(--store-subtle-bg, #140e0b)',
                        borderColor: 'var(--store-border, #2e2119)'
                      }}
                    >
                      <div 
                        className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase"
                        style={{ color: 'var(--store-text-muted, #8c6f59)' }}
                      >
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" style={{ color: primaryColor }} />
                          Consumo de Inventario
                        </span>
                        <span>{hasRecipe ? `${product.product_ingredients?.length} insumos` : '0'}</span>
                      </div>

                      {hasRecipe ? (
                        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
                          {product.product_ingredients?.map((pi, idx) => {
                            const invName = pi.inventory_items?.name || 
                              inventoryList.find(i => i.id === pi.inventory_item_id)?.name || 
                              'Insumo'
                            const unit = pi.inventory_items?.unit || 
                              inventoryList.find(i => i.id === pi.inventory_item_id)?.unit || 
                              'u'
                            return (
                              <span 
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 border"
                                style={{
                                  backgroundColor: 'var(--store-card-bg, #241a13)',
                                  borderColor: 'var(--store-border, #3d2c20)',
                                  color: 'var(--store-badge-text, #e8caa4)'
                                }}
                              >
                                <span className="font-semibold text-white">{pi.quantity} {unit}</span>
                                <span style={{ color: 'var(--store-text-muted, #a88a70)' }}>{invName}</span>
                              </span>
                            )
                          })}
                        </div>
                      ) : (
                        <p 
                          className="text-[11px] italic"
                          style={{ color: 'var(--store-text-muted, #735d4d)' }}
                        >
                          Sin receta asociada (no descuenta stock).
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div 
                  className="p-4 pt-0 border-t mt-3 flex items-center justify-end gap-2"
                  style={{ borderColor: 'var(--store-border, #291f17)' }}
                >
                  <button
                    onClick={() => openEditModal(product)}
                    className="p-2 text-[color:var(--store-text-soft)] hover:bg-white/5 rounded-xl transition-colors flex items-center gap-1 text-xs"
                    onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--store-text-soft, #c7af9a)'}
                    title="Editar plato y receta"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="p-2 text-[color:var(--store-text-faint)] hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-1 text-xs"
                    title="Eliminar plato"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR / EDITAR PLATO Y RECETA */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[color:var(--store-card-bg)] border border-[color:var(--store-border)] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[color:var(--store-border)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[color:var(--brand-primary,#e59324)] rounded-xl text-white shadow-md">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-rustic text-white">
                    {editingId ? 'Editar Plato & Receta' : 'Nuevo Plato para la Carta'}
                  </h2>
                  <p className="text-xs text-[color:var(--store-text-muted)]">
                    Configura los detalles de venta y los insumos que consumirá del inventario.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-[color:var(--store-text-faint)] hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-950/40 border border-red-900/60 text-red-300 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Sección 1: Datos Básicos */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: primaryColor }}>
                  1. Información General del Plato
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-[color:var(--store-text-soft)]">Nombre del Plato *</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ej: Hamburguesa Doble con Queso, Empanada Criolla..."
                      className="w-full bg-[color:var(--store-subtle-bg)] border border-[color:var(--store-border)] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--brand-primary,#e59324)] transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[color:var(--store-text-soft)]">Precio de Venta ($) *</label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--store-text-faint)]" />
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="Ej: 12500"
                        className="w-full bg-[color:var(--store-subtle-bg)] border border-[color:var(--store-border)] rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--brand-primary,#e59324)] transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[color:var(--store-text-soft)]">Categoría *</label>
                    <div className="relative">
                      <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--store-text-faint)]" />
                      <input
                        type="text"
                        list="categories-list"
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        placeholder="Ej: Hamburguesas, Minutas, Pizzas..."
                        className="w-full bg-[color:var(--store-subtle-bg)] border border-[color:var(--store-border)] rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--brand-primary,#e59324)] transition-colors"
                        required
                      />
                      <datalist id="categories-list">
                        <option value="🔥 Del Horno & Spiedo" />
                        <option value="🥟 Empanadas Caseras" />
                        <option value="🥩 Minutas & Platos Fuertes" />
                        <option value="🍔 Hamburguesas Caseras" />
                        <option value="🍕 Pizzas Artesanales" />
                        <option value="🍝 Pastas Artesanales" />
                        <option value="🥗 Tartas & Guarniciones" />
                        <option value="🥤 Bebidas" />
                      </datalist>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[color:var(--store-text-soft)]">Código / SKU (opcional)</label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="Ej: HAMB-DOBLE (auto-generado si se omite)"
                      className="w-full bg-[color:var(--store-subtle-bg)] border border-[color:var(--store-border)] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--brand-primary,#e59324)] transition-colors font-mono text-xs"
                    />
                  </div>

                  {/* ETIQUETA DESTACADA DEL PRODUCTO */}
                  <div className="space-y-2 sm:col-span-2 bg-[color:var(--store-subtle-bg)] p-4 rounded-2xl border border-[color:var(--store-border)]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[color:var(--store-text-soft)] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                        <span>Etiqueta Destacada (Ej: ¡Nuevo!, Oferta, Más pedido)</span>
                      </label>
                      {formBadge && (
                        <button
                          type="button"
                          onClick={() => setFormBadge('')}
                          className="text-[10px] text-rose-400 hover:underline flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Desactivar etiqueta
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {BADGE_PRESETS.map((preset) => {
                        const isSelected = formBadge === preset.value
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setFormBadge(preset.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                              isSelected
                                ? 'text-white shadow-md'
                                : 'bg-[color:var(--store-card-bg)] text-[color:var(--store-text-muted)] border-[color:var(--store-border)] hover:text-white'
                            }`}
                            style={
                              isSelected
                                ? {
                                    backgroundColor: preset.value === '' ? '#dc2626' : primaryColor,
                                    borderColor: preset.value === '' ? '#dc2626' : primaryColor,
                                  }
                                : undefined
                            }
                          >
                            {preset.label}
                          </button>
                        )
                      })}
                    </div>

                    <input
                      type="text"
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                      placeholder="O escribe tu propia etiqueta personalizada (déjalo vacío para ocultarla)"
                      className="w-full bg-[color:var(--store-card-bg)] border border-[color:var(--store-border)] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[var(--brand-primary,#e59324)]"
                    />
                  </div>

                  {/* SECCIÓN DE IMAGEN CON SUBIDA DIRECTA */}
                  <div className="space-y-2 sm:col-span-2 bg-[color:var(--store-subtle-bg)] p-4 rounded-2xl border border-[color:var(--store-border)]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[color:var(--store-text-soft)] flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                        <span>Foto del Plato o Producto</span>
                      </label>
                      {formImageUrl && (
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="text-[10px] text-rose-400 hover:underline flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Quitar foto
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Vista previa / Dropzone */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-28 h-24 rounded-2xl border-2 border-dashed border-[color:var(--store-border)] hover:border-[var(--brand-primary,#e59324)] bg-black/40 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all relative group shrink-0"
                        title="Haz clic para subir una foto desde tu equipo"
                      >
                        {uploadingImage ? (
                          <div className="flex flex-col items-center gap-1" style={{ color: primaryColor }}>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-[9px]">Subiendo...</span>
                          </div>
                        ) : formImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={formImageUrl}
                            alt="Vista previa"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="text-center p-2">
                            <Upload className="w-6 h-6 text-[color:var(--store-text-faint)] mx-auto mb-1 group-hover:text-white" />
                            <span className="text-[10px] text-[color:var(--store-text-faint)] group-hover:text-white font-medium">Subir foto</span>
                          </div>
                        )}
                      </div>

                      {/* Botones de acción */}
                      <div className="flex-1 w-full space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={uploadingImage}
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-secondary py-2 px-3 text-xs flex items-center justify-center gap-1.5 font-semibold"
                          >
                            <Upload className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                            <span>{uploadingImage ? 'Procesando...' : 'Subir Foto desde PC / Celular'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowManualUrl(!showManualUrl)}
                            className="text-xs text-[color:var(--store-text-muted)] hover:text-white px-2.5 py-1.5 rounded-lg border border-[color:var(--store-border)] hover:border-[color:var(--brand-primary)] transition-all"
                          >
                            {showManualUrl ? 'Ocultar URL' : 'O pegar URL'}
                          </button>
                        </div>

                        {/* Presets rápidos */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-[color:var(--store-text-faint)]">Fotos rápidas:</span>
                          {DEFAULT_IMAGES.map((img, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setFormImageUrl(img.url)}
                              className="text-[10px] bg-[color:var(--store-card-bg)] hover:bg-white/5 px-2 py-0.5 rounded-lg border border-[color:var(--store-border)] transition-colors"
                              style={{ color: primaryColor }}
                            >
                              {img.label}
                            </button>
                          ))}
                        </div>

                        {showManualUrl && (
                          <input
                            type="text"
                            value={formImageUrl}
                            onChange={(e) => setFormImageUrl(e.target.value)}
                            placeholder="https://... o ruta de archivo"
                            className="w-full bg-[color:var(--store-card-bg)] border border-[color:var(--store-border)] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--brand-primary,#e59324)] font-mono"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-[color:var(--store-text-soft)]">Descripción del Plato</label>
                    <textarea
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Ej: Doble medallón de carne 120g, pan brioche artesanal, doble queso cheddar fundido y panceta crocante."
                      className="w-full bg-[color:var(--store-subtle-bg)] border border-[color:var(--store-border)] rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[var(--brand-primary,#e59324)] transition-colors resize-none"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isAvailableCheckbox"
                      checked={formIsAvailable}
                      onChange={(e) => setFormIsAvailable(e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer"
                      style={{ accentColor: primaryColor }}
                    />
                    <label htmlFor="isAvailableCheckbox" className="text-xs text-[color:var(--store-text-soft)] cursor-pointer font-medium">
                      Activo y visible en la carta online y Punto de Venta
                    </label>
                  </div>
                </div>
              </div>

              {/* Sección 2: Receta / Insumos del Inventario */}
              <div className="space-y-3 pt-4 border-t border-[color:var(--store-border)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: primaryColor }}>
                      <Package className="w-4 h-4" />
                      <span>2. Insumos que consumirá del Inventario</span>
                    </h3>
                    <p className="text-[11px] text-[color:var(--store-text-muted)] mt-0.5">
                      Al venderse 1 unidad de este plato, se descontarán estas cantidades automáticamente de tu stock.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRecipeItem}
                    className="btn-amber text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Insumo</span>
                  </button>
                </div>

                {formRecipe.length === 0 ? (
                  <div className="bg-[color:var(--store-subtle-bg)] border border-dashed border-[color:var(--store-border)] rounded-2xl p-6 text-center space-y-2">
                    <Package className="w-8 h-8 text-[color:var(--store-text-faint)] mx-auto opacity-50" />
                    <p className="text-xs text-[color:var(--store-text-muted)]">
                      No has seleccionado insumos todavía.
                    </p>
                    <p className="text-[11px] text-[color:var(--store-text-faint)]">
                      Si este plato requiere insumos (ej: pan, carne, queso), pulsa en <strong>&quot;Agregar Insumo&quot;</strong> para asociarlos.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {formRecipe.map((recipeItem, index) => {
                      const selectedInv = inventoryList.find(inv => inv.id === recipeItem.inventory_item_id)
                      const unit = selectedInv?.unit || 'unidades'
                      const stockAvailable = selectedInv ? Number(selectedInv.quantity_available) : 0

                      return (
                        <div 
                          key={index}
                          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-[color:var(--store-subtle-bg)] border border-[color:var(--store-border)] p-3 rounded-xl"
                        >
                          {/* Selector de Insumo */}
                          <div className="flex-1">
                            <label className="text-[10px] text-[color:var(--store-text-faint)] block mb-1 font-semibold uppercase">
                              Insumo del Inventario
                            </label>
                            <select
                              value={recipeItem.inventory_item_id}
                              onChange={(e) => handleRecipeChange(index, 'inventory_item_id', e.target.value)}
                              className="w-full bg-[color:var(--store-card-bg)] border border-[color:var(--store-border)] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--brand-primary,#e59324)]"
                            >
                              {inventoryList.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.name} (Stock: {inv.quantity_available} {inv.unit})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Cantidad consumida */}
                          <div className="w-full sm:w-40">
                            <label className="text-[10px] text-[color:var(--store-text-faint)] block mb-1 font-semibold uppercase">
                              Consume por Plato
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0.001"
                                step="any"
                                value={recipeItem.quantity}
                                onChange={(e) => handleRecipeChange(index, 'quantity', e.target.value)}
                                className="w-full bg-[color:var(--store-card-bg)] border border-[color:var(--store-border)] text-white text-xs rounded-lg pl-3 pr-14 py-2 focus:outline-none focus:border-[var(--brand-primary,#e59324)]"
                                required
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[color:var(--store-text-muted)] pointer-events-none font-semibold">
                                {unit}
                              </span>
                            </div>
                          </div>

                          {/* Botón Quitar */}
                          <div className="sm:self-end pt-1 sm:pt-0">
                            <button
                              type="button"
                              onClick={() => handleRemoveRecipeItem(index)}
                              className="p-2 text-[color:var(--store-text-faint)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Quitar este insumo de la receta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-[color:var(--store-border)] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="btn-secondary py-2.5 px-5 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2 shadow-lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingId ? 'Guardar Cambios' : 'Crear Plato & Receta'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}
