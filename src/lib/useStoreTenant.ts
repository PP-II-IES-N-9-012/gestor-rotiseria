'use client'

import { useEffect, useState } from 'react'
import { getRestaurant, getRestaurantStrict, mergeBranding, invalidateCache, type RestaurantInfo } from '@/lib/api'
import { getClientTenant, tenantPath } from '@/lib/tenant'

/**
 * Resuelve el comercio de la tienda pública en el cliente (subdominio,
 * ?negocio= o /tienda/<slug>) y expone helpers para armar links que no
 * pierdan el tenant. También sincroniza en vivo los cambios del panel de Admin.
 */
export function useStoreTenant() {
  const [tenant, setTenant] = useState<string | null>(null)
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const slug = getClientTenant()
    setTenant(slug)

    const load = async () => {
      if (!slug) {
        const def = await getRestaurant()
        if (cancelled) return
        setRestaurant(mergeBranding(def))
        setReady(true)
        return
      }
      const r = await getRestaurantStrict(slug)
      if (cancelled) return
      setRestaurant(r ? mergeBranding(r) : null)
      setReady(true)
    }

    load()

    const handleBrandingUpdate = () => {
      invalidateCache('restaurant')
      invalidateCache('restaurant_strict')
      load()
    }

    window.addEventListener('comandapp-branding-updated', handleBrandingUpdate)
    window.addEventListener('storage', handleBrandingUpdate)

    return () => {
      cancelled = true
      window.removeEventListener('comandapp-branding-updated', handleBrandingUpdate)
      window.removeEventListener('storage', handleBrandingUpdate)
    }
  }, [])

  return {
    tenant,
    restaurant,
    ready,
    /** Path de la tienda del comercio actual (sin tenant -> tienda general). */
    storePath: tenant ? tenantPath('/tienda', tenant) : '/tienda',
    href: (path: string) => tenantPath(path, tenant)
  }
}
