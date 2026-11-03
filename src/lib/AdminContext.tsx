'use client'

import { createContext, useContext } from 'react'
import type { RestaurantInfo } from '@/lib/api'

export type UserRole = 'admin' | 'seller' | 'cook' | 'customer'

export interface AdminUserProfile {
  id: string
  role: UserRole
  full_name?: string
  restaurant_id: string
}

/** Restaurante (tenant) del panel admin. null = modo demo general sin local. */
export const AdminRestaurantContext = createContext<RestaurantInfo | null>(null)
export const AdminSetRestaurantContext = createContext<((r: RestaurantInfo | null) => void) | null>(null)
export const AdminUserRoleContext = createContext<UserRole>('admin')
export const AdminUserProfileContext = createContext<AdminUserProfile | null>(null)

export function useAdminRestaurant() {
  return useContext(AdminRestaurantContext)
}

export function useSetAdminRestaurant() {
  return useContext(AdminSetRestaurantContext)
}

export function useAdminRole() {
  return useContext(AdminUserRoleContext)
}

export function useAdminUserProfile() {
  return useContext(AdminUserProfileContext)
}
