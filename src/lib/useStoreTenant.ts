'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getRestaurant, mergeBranding, invalidateCache, type RestaurantInfo } from '@/lib/api'
import { getClientTenant, tenantPath } from '@/lib/tenant'
import { isLocalOnlyRestaurantId, subscribeToStoreRealtime } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'

// Caché en memoria compartida en cliente para evitar doble fetch entre Layout y StoreFrontClient
const primedStoreCache = new Map<string, RestaurantInfo>()

export function primeStoreTenantCache(slug: string | null | undefined, info: RestaurantInfo | null | undefined) {
  if (!info) return
  const key = (slug || info.subdomain || 'don-carlos').toLowerCase()
  const merged = mergeBranding(info)
  primedStoreCache.set(key, merged)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('comandapp-tenant-primed', { detail: { key, restaurant: merged } }))
  }
}

/**
 * Resuelve el comercio de la tienda pública en el cliente (subdominio,
 * ?negocio= o /tienda/<slug>) y expone helpers para armar links que no
 * pierdan el tenant. También sincroniza en vivo los cambios del panel de Admin.
 */
export function useStoreTenant() {
  const pathname = usePathname()
  const [tenant, setTenant] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return getClientTenant()
  })
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(() => {
    if (typeof window === 'undefined') return null
    const slug = getClientTenant()
    const key = (slug || 'don-carlos').toLowerCase()
    return primedStoreCache.get(key) || null
  })
  const [ready, setReady] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const slug = getClientTenant()
    const key = (slug || 'don-carlos').toLowerCase()
    return primedStoreCache.has(key)
  })

  useEffect(() => {
    let cancelled = false
    const slug = getClientTenant()
    const key = (slug || 'don-carlos').toLowerCase()
    setTenant(slug)

        const cached = primedStoreCache.get(key)
        if (cached) {
          setRestaurant(cached)
          setReady(true)
        }

        const load = async (forceRefresh = false) => {
          if (!forceRefresh && primedStoreCache.has(key)) {
            const hit = primedStoreCache.get(key)!
            if (!cancelled) {
              setRestaurant(hit)
              setReady(true)
            }
            return hit
          }
          const r = await getRestaurant(slug || 'don-carlos')
          if (cancelled) return null
          const merged = r ? mergeBranding(r) : null
          if (merged) {
            primedStoreCache.set(key, merged)
          }
          setRestaurant(merged)
          setReady(true)
          return merged
        }

        let pgChannel: ReturnType<typeof supabase.channel> | null = null
        let unsubscribeRealtime: (() => void) | null = null

        void load().then((loaded) => {
          if (cancelled || !loaded?.id) return
          unsubscribeRealtime = subscribeToStoreRealtime(loaded.id, (evt) => {
            if (evt.type === 'store_config_update') {
              primedStoreCache.delete(key)
              invalidateCache('restaurant')
              invalidateCache('restaurant_strict')
              void load(true)
            }
          })

          if (!isLocalOnlyRestaurantId(loaded.id)) {
            const uid = Math.random().toString(36).slice(2, 8)
            pgChannel = supabase
              .channel(`store-tenant-sync-${loaded.id}-${uid}`)
              .on(
                'postgres_changes',
                {
                  event: '*',
                  schema: 'public',
                  table: 'restaurants',
                  filter: `id=eq.${loaded.id}`
                },
                () => {
                  primedStoreCache.delete(key)
                  invalidateCache('restaurant')
                  invalidateCache('restaurant_strict')
                  void load(true)
                }
              )
              .subscribe()
          }
        })

        const handleBrandingUpdate = () => {
          primedStoreCache.delete(key)
          invalidateCache('restaurant')
          invalidateCache('restaurant_strict')
          void load(true)
        }

        const handlePrimed = (e: Event) => {
          const detail = (e as CustomEvent<{ key: string; restaurant: RestaurantInfo }>).detail
          if (detail?.key === key && detail.restaurant && !cancelled) {
            setRestaurant(detail.restaurant)
            setReady(true)
          }
        }

        window.addEventListener('comandapp-branding-updated', handleBrandingUpdate)
        window.addEventListener('comandapp-tenant-primed', handlePrimed)
        window.addEventListener('storage', handleBrandingUpdate)

        return () => {
          cancelled = true
          window.removeEventListener('comandapp-branding-updated', handleBrandingUpdate)
          window.removeEventListener('comandapp-tenant-primed', handlePrimed)
          window.removeEventListener('storage', handleBrandingUpdate)
          if (unsubscribeRealtime) unsubscribeRealtime()
          if (pgChannel) {
            supabase.removeChannel(pgChannel).catch(() => { })
          }
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
