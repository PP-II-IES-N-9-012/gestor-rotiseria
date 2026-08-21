'use client'

import Link from 'next/link'
import { ShoppingCart, UtensilsCrossed, Menu } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useState, useEffect } from 'react'

export default function EcommerceLayout({ children }: { children: React.ReactNode }) {
  const { items } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0)

  useEffect(() => setMounted(true), [])

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="bg-red-500 p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <span className="font-outfit text-2xl font-bold tracking-tight">Roti<span className="text-red-500">Express</span></span>
            </Link>

            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-300 hover:text-white transition-colors font-medium">Catálogo</Link>
              <Link href="/seguimiento" className="text-gray-300 hover:text-white transition-colors font-medium">Seguimiento</Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Link href="/carrito" className="relative p-2 text-gray-300 hover:text-white transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {mounted && cartCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button className="md:hidden text-gray-300 hover:text-white">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-[#13151a] border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p className="font-outfit text-lg mb-2">RotiExpress © 2026</p>
          <p className="text-sm">Sistema Integral de Gestión para Rotiserías</p>
        </div>
      </footer>
    </div>
  )
}
