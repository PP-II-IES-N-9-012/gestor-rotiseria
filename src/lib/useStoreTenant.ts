'use client'

import { useEffect, useState } from 'react'
import { getRestaurantStrict, type RestaurantInfo } from '@/lib/api'
import { getClientTenant, tenantPath } from '@/lib/tenant'

/**
 * Resuelve el comercio de la tienda pública en el cliente (subdominio,
 * ?negocio= o /tienda/<slug>) y expone helpers para armar links que no
 * pierdan el tenant.
 */
export function useStoreTenant() {
  const [tenant, setTenant] = useState<string | null>(null)
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const slug = getClientTenant()
    setTenant(slug)
    if (!slug) {
      setReady(true)
      return
    }
    getRestaurantStrict(slug).then(r => {
      if (cancelled) return
      setRestaurant(r)
      setReady(true)
    })
    return () => {
      cancelled = true
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
