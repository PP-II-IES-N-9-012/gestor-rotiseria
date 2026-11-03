'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getRestaurant, getRestaurantStrict, mergeBranding, invalidateCache, type RestaurantInfo } from '@/lib/api'
import { getClientTenant, tenantPath } from '@/lib/tenant'
import { supabase } from '@/lib/supabase'

/**
 * Resuelve el comercio de la tienda pública en el cliente (subdominio,
 * ?negocio= o /tienda/<slug>) y expone helpers para armar links que no
 * pierdan el tenant. También sincroniza en vivo los cambios del panel de Admin.
 */
export function useStoreTenant() {
  const pathname = usePathname()
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

    const channel = supabase
      .channel(`store-tenant-sync-${slug || 'default'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurants' },
        () => handleBrandingUpdate()
      )
      .subscribe()

    return () => {
      cancelled = true
      window.removeEventListener('comandapp-branding-updated', handleBrandingUpdate)
      window.removeEventListener('storage', handleBrandingUpdate)
      supabase.removeChannel(channel)
    }
  }, [pathname])

  return {
    tenant,
    restaurant,
    ready,
    /** Path de la tienda del comercio actual (sin tenant -> tienda general). */
    storePath: tenant ? tenantPath('/tienda', tenant) : '/tienda',
    href: (path: string) => tenantPath(path, tenant)
  }
}
