'use client'

import Link from 'next/link'
import { ShoppingCart, Utensils, Flame, Sparkles } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useState, useEffect } from 'react'

export default function EcommerceLayout({ children }: { children: React.ReactNode }) {
  const { items } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0)

  useEffect(() => setMounted(true), [])

  return (
    <div className="flex flex-col min-h-screen bg-[#151210] text-[#fcf9f5]">
      {/* Top Notice Bar */}
      <div className="bg-[#241a14] border-b border-[#3d2c20] px-4 py-1.5 text-xs text-center text-[#e8caa4] flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Horno encendido y cocina despachando pedidos en vivo</span>
        <span className="hidden md:inline text-[#8a6b52]">•</span>
        <Link href="/" className="hidden md:inline text-[#e59324] hover:underline font-medium">
          ¿Tienes una rotisería? Conoce ComandApp ➔
        </Link>
      </div>

      {/* Main Store Header */}
      <header className="sticky top-0 z-50 bg-[#1e1713]/90 backdrop-blur-md border-b border-[#44372e] shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo / Brand */}
            <Link href="/tienda" className="flex items-center space-x-3 group">
              <div className="bg-gradient-to-br from-[#d34e2c] to-[#992c10] p-2.5 rounded-xl group-hover:rotate-6 transition-all duration-300 shadow-md shadow-orange-950/50 border border-amber-500/20">
                <Flame className="w-6 h-6 text-[#ffd5a8]" />
              </div>
              <div className="flex flex-col">
                <span className="font-rustic text-2xl font-bold tracking-tight text-[#fcf9f5]">
                  La <span className="text-[#e59324]">Rotisería</span>
                </span>
                <span className="text-[11px] text-[#bda086] -mt-1 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3 text-[#e59324]" />
                  ComandApp • Sabor Casero
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                href="/tienda" 
                className="text-[#ddcfc2] hover:text-[#e59324] transition-colors font-medium text-sm flex items-center gap-1.5"
              >
                <Utensils className="w-4 h-4 text-[#e59324]" />
                Carta & Menú
              </Link>
              <Link 
                href="/seguimiento" 
                className="text-[#ddcfc2] hover:text-[#e59324] transition-colors font-medium text-sm"
              >
                Seguimiento en Vivo
              </Link>
              <Link 
                href="/" 
                className="text-xs text-[#a88a70] hover:text-[#fcf9f5] px-3 py-1.5 rounded-lg border border-[#44372e] hover:border-[#e59324]/40 transition-all"
              >
                Sobre ComandApp
              </Link>
            </nav>

            {/* Actions: Cart */}
            <div className="flex items-center space-x-4">
              <Link 
                href="/carrito" 
                className="relative flex items-center gap-2 bg-[#2d221b] hover:bg-[#3b2d24] text-[#fcf9f5] px-4 py-2 rounded-xl border border-[#e59324]/30 transition-all duration-200 active:scale-95 shadow-md"
              >
                <ShoppingCart className="w-5 h-5 text-[#e59324]" />
                <span className="hidden sm:inline text-sm font-semibold">Mi Comanda</span>
                {mounted && cartCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold leading-none text-white bg-[#d34e2c] rounded-full shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      {/* Rustic Warm Footer */}
      <footer className="bg-[#120e0c] border-t border-[#382b22] py-12 text-[#9e836d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
            <div>
              <p className="font-rustic text-xl font-bold text-[#fcf9f5] mb-1">
                ComandApp • Tienda Online
              </p>
              <p className="text-sm text-[#b59982] max-w-md">
                Hecho en casa con amor y dedicación. Cocina tradicional, recetas familiares y entrega directa sin intermediarios.
              </p>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-2">
              <div className="badge-rustic">
                <span>⚡ 0% Comisiones • Software Gastronómico</span>
              </div>
              <p className="text-xs text-[#735e4e]">
                Potenciado por <Link href="/" className="text-[#e59324] hover:underline font-semibold">ComandApp</Link> © {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
