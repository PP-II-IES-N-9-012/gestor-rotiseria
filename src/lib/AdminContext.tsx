'use client'

import { createContext, useContext } from 'react'
import type { RestaurantInfo } from '@/lib/api'

/** Restaurante (tenant) del panel admin. null = modo demo general sin local. */
export const AdminRestaurantContext = createContext<RestaurantInfo | null>(null)
export const AdminSetRestaurantContext = createContext<((r: RestaurantInfo | null) => void) | null>(null)

export function useAdminRestaurant() {
  return useContext(AdminRestaurantContext)
}

export function useSetAdminRestaurant() {
  return useContext(AdminSetRestaurantContext)
}
