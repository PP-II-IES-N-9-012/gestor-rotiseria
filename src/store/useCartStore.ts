import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface CartStore {
  tenantId: string | null
  items: CartItem[]
  cartsByTenant: Record<string, CartItem[]>
  hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  ensureTenant: (tenantId: string) => void
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: () => number
}

function clampQty(qty: number): number {
  const n = Math.floor(Number(qty) || 1)
  return Math.min(99, Math.max(1, n))
}

function sanitizePrice(price: number): number {
  const p = Number(price)
  return Number.isFinite(p) && p >= 0 ? p : 0
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      tenantId: null,
      items: [],
      cartsByTenant: {},
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      ensureTenant: (nextTenantId) =>
        set((state) => {
          if (!nextTenantId) return state
          if (state.tenantId === nextTenantId) return state
          const updatedMap = { ...(state.cartsByTenant || {}) }
          if (state.tenantId) {
            updatedMap[state.tenantId] = state.items
          }
          const nextItems = updatedMap[nextTenantId] || []
          return {
            tenantId: nextTenantId,
            items: nextItems,
            cartsByTenant: updatedMap,
          }
        }),
      addItem: (item) =>
        set((state) => {
          const cleanPrice = sanitizePrice(item.price)
          const addQty = clampQty(item.quantity)
          const existing = state.items.find((i) => i.id === item.id)
          const nextItems = existing
            ? state.items.map((i) =>
              i.id === item.id ? { ...i, price: cleanPrice, quantity: clampQty(i.quantity + addQty) } : i
            )
            : [...state.items, { ...item, price: cleanPrice, quantity: addQty }]

          const updatedMap = { ...(state.cartsByTenant || {}) }
          if (state.tenantId) {
            updatedMap[state.tenantId] = nextItems
          }
          return { items: nextItems, cartsByTenant: updatedMap }
        }),
      removeItem: (id) =>
        set((state) => {
          const nextItems = state.items.filter((i) => i.id !== id)
          const updatedMap = { ...(state.cartsByTenant || {}) }
          if (state.tenantId) {
            updatedMap[state.tenantId] = nextItems
          }
          return { items: nextItems, cartsByTenant: updatedMap }
        }),
      updateQuantity: (id, quantity) =>
        set((state) => {
          const safeQty = clampQty(quantity)
          const nextItems = state.items.map((i) => (i.id === id ? { ...i, quantity: safeQty } : i))
          const updatedMap = { ...(state.cartsByTenant || {}) }
          if (state.tenantId) {
            updatedMap[state.tenantId] = nextItems
          }
          return { items: nextItems, cartsByTenant: updatedMap }
        }),
      clearCart: () =>
        set((state) => {
          const updatedMap = { ...(state.cartsByTenant || {}) }
          if (state.tenantId) {
            updatedMap[state.tenantId] = []
          }
          return { items: [], cartsByTenant: updatedMap }
        }),
      total: () =>
        get().items.reduce(
          (acc, item) => acc + sanitizePrice(item.price) * clampQty(item.quantity),
          0
        ),
    }),
    {
      name: 'comandapp-cart',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
