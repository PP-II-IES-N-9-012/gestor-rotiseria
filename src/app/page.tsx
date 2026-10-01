'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Flame, 
  ChefHat, 
  Utensils, 
  ShoppingBag, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone, 
  Clock, 
  BarChart3, 
  Package, 
  Monitor, 
  Globe, 
  ChevronRight, 
  Star, 
  HelpCircle,
  TrendingUp,
  Receipt,
  Layers,
  HeartHandshake
} from 'lucide-react'

export default function LandingPage() {
  const [testSubdomain, setTestSubdomain] = useState('don-carlos')
  const [activeTab, setActiveTab] = useState<'tienda' | 'cocina' | 'pos' | 'inventario'>('tienda')

  const sanitizeSubdomain = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
  }

  return (
    <div className="min-h-screen bg-[#151210] text-[#fcf9f5] flex flex-col selection:bg-[#d34e2c] selection:text-white">
      
      {/* Top Banner Notice */}
      <div className="bg-[#241a14] border-b border-[#3d2c20] px-4 py-2 text-xs text-center text-[#e8caa4] flex items-center justify-center gap-2">
        <span className="badge-rustic text-[11px] py-0.5 px-2">Novedad</span>
        <span>ComandApp: El sistema gastronómico que huele a comida de verdad • <strong>0% comisiones en tus pedidos</strong></span>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-50 bg-[#1a1411]/90 backdrop-blur-md border-b border-[#3d2f25]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="bg-gradient-to-br from-[#d34e2c] to-[#992c10] p-2.5 rounded-xl group-hover:rotate-6 transition-all duration-300 shadow-md shadow-orange-950/50 border border-amber-500/20">
                <Flame className="w-6 h-6 text-[#ffd5a8]" />
              </div>
              <div className="flex flex-col">
                <span className="font-rustic text-2xl font-bold tracking-tight text-[#fcf9f5]">
                  Comand<span className="text-[#e59324]">App</span>
                </span>
                <span className="text-[10px] text-[#bda086] -mt-1 font-semibold uppercase tracking-wider">
                  Software Gastronómico Artesanal
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium text-[#dcd0c5]">
              <a href="#solucion" className="hover:text-[#e59324] transition-colors">¿Por qué ComandApp?</a>
              <a href="#modulos" className="hover:text-[#e59324] transition-colors">Módulos</a>
              <a href="#subdominio" className="hover:text-[#e59324] transition-colors">Tu Subdominio</a>
              <a href="#precios" className="hover:text-[#e59324] transition-colors">Planes</a>
              <a href="#testimonios" className="hover:text-[#e59324] transition-colors">Rotiserías Reales</a>
              <a href="#faq" className="hover:text-[#e59324] transition-colors">Preguntas</a>
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <Link 
                href="/tienda" 
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#faede0] bg-[#2b211a] hover:bg-[#382b22] px-3.5 py-2 rounded-xl border border-[#4d3a2c] transition-all font-medium"
              >
                <Utensils className="w-3.5 h-3.5 text-[#e59324]" />
                <span>Ver Tienda Demo</span>
              </Link>
              <Link 
                href="/login" 
                className="btn-primary text-xs sm:text-sm py-2 sm:py-2.5 px-4 font-semibold flex items-center gap-1.5"
              >
                <span>Acceso Clientes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 border-b border-[#382b21]">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-[#d34e2c]/15 to-[#e59324]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="max-w-3xl mx-auto text-center mb-12">
            
            <div className="badge-rustic mb-6 animate-in fade-in duration-500">
              <Sparkles className="w-3.5 h-3.5 text-[#e59324]" />
              <span>La plataforma definitiva para rotiserías, casas de comida y bodegones</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold font-rustic text-[#fcf9f5] leading-[1.1] mb-6 drop-shadow-sm">
              Tu rotisería online, comandas en vivo y <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e59324] via-[#f7b045] to-[#d34e2c]">0% comisiones.</span>
            </h1>

            <p className="text-lg sm:text-xl text-[#d4bfae] mb-10 leading-relaxed max-w-2xl mx-auto">
              Dile adiós a los cuadernos manchados de grasa, los pedidos perdidos por WhatsApp y el 35% de comisión de las apps de delivery. 
              <strong> ComandApp</strong> te da tu propia web con subdominio, pantalla de cocina en tiempo real y punto de venta ultra ágil.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/tienda" 
                className="btn-amber w-full sm:w-auto text-center py-4 px-8 text-base font-bold flex items-center justify-center gap-2 shadow-xl"
              >
                <Utensils className="w-5 h-5 text-[#151210]" />
                <span>Probar Tienda de Ejemplo</span>
              </Link>
              
              <Link 
                href="/login" 
                className="btn-secondary w-full sm:w-auto text-center py-4 px-8 text-base font-semibold flex items-center justify-center gap-2"
              >
                <ChefHat className="w-5 h-5 text-[#e59324]" />
                <span>Entrar a mi Negocio</span>
              </Link>
            </div>

            {/* Quick Guarantees */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#a88a70]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> Sin comisiones por plato
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> Anda en cualquier celular o PC
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> Subdominio propio en minutos
              </span>
            </div>

          </div>

          {/* Interactive Feature Visualizer */}
          <div className="relative max-w-5xl mx-auto rounded-3xl p-3 bg-gradient-to-b from-[#4d3a2c]/60 to-[#221813]/60 border border-[#5c4636] shadow-2xl">
            <div className="bg-[#191310] rounded-2xl p-6 border border-[#382b21] overflow-hidden">
              
              {/* Tab Selector */}
              <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-[#382b21] justify-center md:justify-start">
                <button 
                  onClick={() => setActiveTab('tienda')}
                  className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'tienda' 
                      ? 'bg-[#d34e2c] text-white shadow-md' 
                      : 'bg-[#241a14] text-[#bfa38c] hover:bg-[#2e2119] border border-[#3d2f25]'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>1. Tienda con tu Subdominio</span>
                </button>

                <button 
                  onClick={() => setActiveTab('cocina')}
                  className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'cocina' 
                      ? 'bg-[#d34e2c] text-white shadow-md' 
                      : 'bg-[#241a14] text-[#bfa38c] hover:bg-[#2e2119] border border-[#3d2f25]'
                  }`}
                >
                  <ChefHat className="w-4 h-4" />
                  <span>2. Comandera de Cocina (KDS)</span>
                </button>

                <button 
                  onClick={() => setActiveTab('pos')}
                  className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'pos' 
                      ? 'bg-[#d34e2c] text-white shadow-md' 
                      : 'bg-[#241a14] text-[#bfa38c] hover:bg-[#2e2119] border border-[#3d2f25]'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>3. Mostrador & Caja (POS)</span>
                </button>

                <button 
                  onClick={() => setActiveTab('inventario')}
                  className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'inventario' 
                      ? 'bg-[#d34e2c] text-white shadow-md' 
                      : 'bg-[#241a14] text-[#bfa38c] hover:bg-[#2e2119] border border-[#3d2f25]'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>4. Inventario & Alertas</span>
                </button>
              </div>

              {/* Tab Display Contents */}
              <div className="min-h-[360px] flex items-center justify-center">
                
                {/* TAB 1: TIENDA ONLINE */}
                {activeTab === 'tienda' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full animate-in fade-in duration-300">
                    <div>
                      <div className="badge-rustic mb-3 text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-[#e59324]" />
                        <span>don-carlos.comandapp.com</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-rustic font-bold text-white mb-3">
                        Tu Carta Digital y Carrito Sin Comisiones
                      </h3>
                      <p className="text-[#c7af9a] text-sm leading-relaxed mb-6">
                        Tus comensales escanean tu QR o entran a tu subdominio propio. Miran las fotos de tus empanadas, pollos y minutas, eligen si quieren Delivery o Take Away, y confirman su orden en segundos sin tener que crearse una cuenta con contraseñas.
                      </p>
                      <ul className="space-y-2.5 text-xs text-[#e8caa4] mb-6">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> Catálogo categorizado con fotos reales y precios al día.
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> Checkout simple: Nombre, Teléfono y Dirección.
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> Seguimiento de preparación en tiempo real para el cliente.
                        </li>
                      </ul>
                      <Link href="/tienda" className="btn-amber inline-flex items-center gap-2 text-xs py-2.5 px-5">
                        <span>Ver tienda interactiva ahora</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>

                    <div className="bg-[#120e0b] rounded-2xl p-4 border border-[#3d2f25] shadow-inner">
                      <div className="bg-[#1f1712] rounded-xl p-3 border border-[#4d3a2c] mb-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                          <span className="font-semibold text-white">doncarlos.comandapp.com</span>
                        </div>
                        <span className="text-[#a88a70]">En Vivo</span>
                      </div>
                      <div className="space-y-2.5">
                        <div className="p-3 bg-[#17120e] rounded-lg border border-[#382b21] flex justify-between items-center">
                          <div>
                            <p className="font-rustic font-bold text-sm text-white">Pollo al Spiedo con Papas Rústicas</p>
                            <p className="text-[11px] text-[#a88a70]">Receta casera al romero y limón</p>
                          </div>
                          <span className="font-rustic font-bold text-[#e59324] text-sm">$12.500</span>
                        </div>
                        <div className="p-3 bg-[#17120e] rounded-lg border border-[#382b21] flex justify-between items-center">
                          <div>
                            <p className="font-rustic font-bold text-sm text-white">Empanada Criolla a Cuchillo (x12)</p>
                            <p className="text-[11px] text-[#a88a70]">Horno de barro tradicional</p>
                          </div>
                          <span className="font-rustic font-bold text-[#e59324] text-sm">$16.500</span>
                        </div>
                        <div className="p-3 bg-[#241a14] rounded-lg border border-[#e59324]/30 flex justify-between items-center">
                          <span className="text-xs text-[#fcf9f5] font-semibold">Total comanda (2 ítems)</span>
                          <span className="text-sm font-bold text-[#e59324]">$29.000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: COMANDERA DE COCINA */}
                {activeTab === 'cocina' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full animate-in fade-in duration-300">
                    <div>
                      <div className="badge-rustic mb-3 text-xs">
                        <Flame className="w-3.5 h-3.5 text-[#e59324]" />
                        <span>KDS (Kitchen Display System)</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-rustic font-bold text-white mb-3">
                        Comandera de Cocina en Tiempo Real
                      </h3>
                      <p className="text-[#c7af9a] text-sm leading-relaxed mb-6">
                        Coloca una tablet o pantalla en la pared de tu cocina. Cuando un cliente pide en la web o se cobra en mostrador, la orden aparece sola con sonido de campana y detalles claros.
                      </p>
                      <ul className="space-y-2.5 text-xs text-[#e8caa4] mb-6">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> Sincronización instantánea con WebSockets (cero F5).
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> Estados claros: 🟡 Pendiente ➔ 🔵 En Marcha ➔ 🟢 ¡Listo!
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> Aclaraciones especiales (ej: &quot;Sin cebolla&quot;) bien visibles.
                        </li>
                      </ul>
                      <Link href="/login" className="btn-amber inline-flex items-center gap-2 text-xs py-2.5 px-5">
                        <span>Ver panel de cocina</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>

                    <div className="bg-[#120e0b] rounded-2xl p-4 border border-[#3d2f25]">
                      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                        <div className="bg-[#2a1a12] p-3 rounded-xl border border-amber-500/30">
                          <span className="text-[10px] text-amber-400 font-bold uppercase">⏳ Pendiente (#9A2B)</span>
                          <p className="font-rustic font-bold text-white mt-1">1x Pollo al Spiedo</p>
                          <p className="font-rustic font-bold text-white">6x Empanadas Carne</p>
                          <p className="text-[10px] text-[#bfa38c] mt-2 italic">&quot;Bien cocido por favor&quot;</p>
                        </div>
                        <div className="bg-[#13231c] p-3 rounded-xl border border-emerald-500/30">
                          <span className="text-[10px] text-emerald-400 font-bold uppercase">🔥 En Marcha (#8F41)</span>
                          <p className="font-rustic font-bold text-white mt-1">1x Milanesa Napolitana</p>
                          <p className="font-rustic font-bold text-white">1x Papas Provenzal</p>
                          <p className="text-[10px] text-emerald-300 mt-2 font-medium">Hace 12 min</p>
                        </div>
                      </div>
                      <p className="text-center text-[11px] text-[#8a6b52]">Pantalla táctil: el cocinero pulsa un botón y avanza la comanda</p>
                    </div>
                  </div>
                )}

                {/* TAB 3: POS MOSTRADOR */}
                {activeTab === 'pos' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full animate-in fade-in duration-300">
                    <div>
                      <div className="badge-rustic mb-3 text-xs">
                        <Receipt className="w-3.5 h-3.5 text-[#e59324]" />
                        <span>Punto de Venta Mostrador</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-rustic font-bold text-white mb-3">
                        Cobra en Mostrador y Teléfono al Toque
                      </h3>
                      <p className="text-[#c7af9a] text-sm leading-relaxed mb-6">
                        ¿Llega un cliente al local o llama por teléfono? El operador busca platos con el teclado o la pantalla táctil, suma bebidas o postres y dispara la venta a cocina con 1 toque.
                      </p>
                      <ul className="space-y-2.5 text-xs text-[#e8caa4] mb-6">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> Buscador dinámico de empanadas, tartas y minutas.
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> Selección rápida de pago en Efectivo o Tarjeta/Transferencia.
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> Cálculo automático del ticket promedio y caja del día.
                        </li>
                      </ul>
                      <Link href="/login" className="btn-amber inline-flex items-center gap-2 text-xs py-2.5 px-5">
                        <span>Probar Punto de Venta</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>

                    <div className="bg-[#120e0b] rounded-2xl p-4 border border-[#3d2f25] text-xs">
                      <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#382b21]">
                        <span className="font-semibold text-white">Ticket Mostrador</span>
                        <span className="text-[#e59324] font-bold">Cobro Express</span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-[#d4bfae]">
                          <span>1x Tarta Pascualina</span>
                          <span className="text-white font-semibold">$7.200</span>
                        </div>
                        <div className="flex justify-between text-[#d4bfae]">
                          <span>1x Porción Fritas Provenzal</span>
                          <span className="text-white font-semibold">$4.900</span>
                        </div>
                      </div>
                      <div className="bg-[#1f1712] p-3 rounded-xl border border-[#44352a] flex justify-between items-center font-bold text-sm">
                        <span>Total a Cobrar:</span>
                        <span className="text-[#e59324]">$12.100</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: INVENTARIO */}
                {activeTab === 'inventario' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full animate-in fade-in duration-300">
                    <div>
                      <div className="badge-rustic mb-3 text-xs">
                        <Package className="w-3.5 h-3.5 text-[#e59324]" />
                        <span>Control de Insumos</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-rustic font-bold text-white mb-3">
                        Nunca te Quedes sin Papas ni Pollo
                      </h3>
                      <p className="text-[#c7af9a] text-sm leading-relaxed mb-6">
                        No hay nada peor que un domingo al mediodía quedarse sin stock de muzzarella o carne picada. ComandApp monitorea tus insumos y te avisa en rojo cuando estás por debajo del stock de seguridad.
                      </p>
                      <ul className="space-y-2.5 text-xs text-[#e8caa4] mb-6">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> Alertas visuales de insumos críticos en el Dashboard.
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> Botón de ingreso rápido para sumar bolsas, kilos o unidades.
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> Ahorra costos al controlar mermas y sobrantes.
                        </li>
                      </ul>
                      <Link href="/login" className="btn-amber inline-flex items-center gap-2 text-xs py-2.5 px-5">
                        <span>Explorar Inventario</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>

                    <div className="bg-[#120e0b] rounded-2xl p-4 border border-[#3d2f25] text-xs space-y-2.5">
                      <div className="p-3 bg-[#1e1713] rounded-xl border border-red-500/30 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-white">Carne Picada Especial</p>
                          <p className="text-[10px] text-red-400">Stock actual: 4 kg (Mínimo: 10 kg)</p>
                        </div>
                        <span className="bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded text-[10px]">¡CRÍTICO!</span>
                      </div>
                      <div className="p-3 bg-[#1e1713] rounded-xl border border-emerald-500/20 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-white">Papas Blancas p/ Fritas</p>
                          <p className="text-[10px] text-[#a88a70]">Stock actual: 65 kg (Mínimo: 20 kg)</p>
                        </div>
                        <span className="bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px]">NORMAL</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* WHY COMANDAPP SECTION */}
      <section id="solucion" className="py-20 md:py-28 border-b border-[#382b21] bg-[#1a1410]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="badge-rustic mb-3 text-xs">Hecho por y para gastronómicos</span>
            <h2 className="text-3xl sm:text-5xl font-rustic font-bold text-white mb-4">
              ¿Por qué las apps tradicionales te dejan sin margen?
            </h2>
            <p className="text-[#c7af9a] text-base leading-relaxed">
              Las plataformas de delivery cobran comisiones exorbitantes de hasta un 35% y se quedan con los datos de tus propios clientes. 
              <strong> ComandApp cambia las reglas de juego.</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="bg-[#1f1712] border border-[#3d2f25] p-8 rounded-3xl hover:border-[#e59324]/40 transition-all duration-300 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#3b2114] border border-[#e59324]/30 flex items-center justify-center text-[#e59324] mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-rustic font-bold text-2xl text-white mb-3">0% Comisiones por Pedido</h3>
                <p className="text-sm text-[#bfa38c] leading-relaxed mb-4">
                  Todo lo que cocinas y vendes es 100% tuyo. Sin tarifas ocultas por cada comanda. Pagas una suscripción plana y transparente.
                </p>
              </div>
              <div className="pt-4 border-t border-[#31251e] text-xs text-[#e59324] font-semibold flex items-center gap-1">
                <span>Tu trabajo, tu ganancia</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#1f1712] border border-[#3d2f25] p-8 rounded-3xl hover:border-[#e59324]/40 transition-all duration-300 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#3b2114] border border-[#e59324]/30 flex items-center justify-center text-[#e59324] mb-6">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="font-rustic font-bold text-2xl text-white mb-3">Ritmo Real de Cocina</h3>
                <p className="text-sm text-[#bfa38c] leading-relaxed mb-4">
                  El sistema está diseñado para la grasa, el apuro y el calor de la cocina. Botones gigantes, letras grandes y sonidos para que los cocineros no pierdan tiempo.
                </p>
              </div>
              <div className="pt-4 border-t border-[#31251e] text-xs text-[#e59324] font-semibold flex items-center gap-1">
                <span>Cero complicaciones técnicas</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#1f1712] border border-[#3d2f25] p-8 rounded-3xl hover:border-[#e59324]/40 transition-all duration-300 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#3b2114] border border-[#e59324]/30 flex items-center justify-center text-[#e59324] mb-6">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="font-rustic font-bold text-2xl text-white mb-3">Tu Marca Propia</h3>
                <p className="text-sm text-[#bfa38c] leading-relaxed mb-4">
                  Cada local tiene su propio subdominio como <code>doncarlos.comandapp.com</code>. Tus clientes te buscan a ti, no a una lista de competidores en una app genérica.
                </p>
              </div>
              <div className="pt-4 border-t border-[#31251e] text-xs text-[#e59324] font-semibold flex items-center gap-1">
                <span>Fideliza a tu barrio</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SUBDOMAIN SIMULATOR SECTION */}
      <section id="subdominio" className="py-20 md:py-28 border-b border-[#382b21] relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <span className="badge-rustic mb-4 text-xs">Arquitectura Multi-Inquilino</span>
          <h2 className="text-3xl sm:text-5xl font-rustic font-bold text-white mb-4">
            Comprueba cómo se verá tu negocio
          </h2>
          <p className="text-[#c7af9a] max-w-xl mx-auto mb-10 text-sm md:text-base leading-relaxed">
            Escribe el nombre de tu rotisería, casa de empanadas o bodegón y mira la URL personalizada que tendrás lista para imprimir en volantes, cajas y stickers.
          </p>

          <div className="bg-[#1f1712] border border-[#4d3a2b] p-6 md:p-10 rounded-3xl max-w-2xl mx-auto shadow-2xl">
            <label className="block text-xs font-semibold text-[#c7af9a] mb-2 text-left">
              Escribe el nombre o alias de tu local:
            </label>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
              <div className="relative flex-grow w-full">
                <input 
                  type="text" 
                  value={testSubdomain}
                  onChange={(e) => setTestSubdomain(sanitizeSubdomain(e.target.value))}
                  placeholder="ej: don-carlos o la-nonna"
                  className="w-full bg-[#151210] border border-[#44352a] rounded-xl px-4 py-3.5 text-white font-mono text-base focus:outline-none focus:border-[#e59324] transition-colors"
                />
              </div>
              <span className="text-[#e59324] font-bold text-sm hidden sm:inline whitespace-nowrap">
                .comandapp.com
              </span>
            </div>

            <div className="p-4 bg-[#151210] border border-[#382b21] rounded-2xl mb-6 text-left flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#8c6f59] uppercase tracking-wider block font-semibold">Tu Tienda Pública Será:</span>
                <span className="font-mono text-sm md:text-base text-[#e59324] font-bold break-all">
                  https://{testSubdomain || 'tunegocio'}.comandapp.com
                </span>
              </div>
              <span className="badge-rustic text-[10px]">SSL Seguro</span>
            </div>

            <Link 
              href={`/tienda/${testSubdomain || 'don-carlos'}`}
              className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2"
            >
              <span>Ver Tienda de Prueba con este Subdominio</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="precios" className="py-20 md:py-28 border-b border-[#382b21] bg-[#1a1410]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="badge-rustic mb-3 text-xs">Precios Honestos</span>
            <h2 className="text-3xl sm:text-5xl font-rustic font-bold text-white mb-4">
              Planes pensados para la realidad gastronómica
            </h2>
            <p className="text-[#c7af9a] text-sm md:text-base leading-relaxed">
              Tarifa mensual fija en pesos. Sin porcentaje sobre tus ventas. Sin sorpresas a fin de mes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Plan 1 */}
            <div className="bg-[#1f1712] border border-[#3d2f25] p-8 rounded-3xl flex flex-col justify-between shadow-xl">
              <div>
                <span className="text-xs text-[#a88a70] font-semibold uppercase tracking-wider">Inicial</span>
                <h3 className="font-rustic font-bold text-2xl text-white mt-1 mb-2">Rotisería de Barrio</h3>
                <p className="text-xs text-[#bfa38c] mb-6">Para locales que quieren empezar a recibir pedidos online organizados.</p>
                
                <div className="mb-6 pb-6 border-b border-[#31251e]">
                  <span className="text-4xl font-rustic font-bold text-white">$14.900</span>
                  <span className="text-xs text-[#8c6f59]"> / mes</span>
                </div>

                <ul className="space-y-3 text-xs text-[#dcd0c5] mb-8">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" /> Tienda Online con Subdominio Propio
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" /> Hasta 300 pedidos mensuales
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" /> Carta Digital con fotos y categorías
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" /> 0% de comisiones
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" /> Soporte por WhatsApp
                  </li>
                </ul>
              </div>

              <Link href="/login" className="btn-secondary w-full text-center py-3 text-xs font-bold">
                Elegir Plan Inicial
              </Link>
            </div>

            {/* Plan 2: HIGHLIGHT */}
            <div className="bg-[#241a14] border-2 border-[#e59324] p-8 rounded-3xl flex flex-col justify-between shadow-2xl relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#e59324] text-[#151210] text-[11px] font-bold uppercase tracking-wider py-1 px-4 rounded-full shadow-md">
                ⭐ Más Elegido por Rotiserías
              </div>

              <div>
                <span className="text-xs text-[#e59324] font-semibold uppercase tracking-wider">Integral</span>
                <h3 className="font-rustic font-bold text-2xl text-white mt-1 mb-2">Cocina a Pleno</h3>
                <p className="text-xs text-[#bfa38c] mb-6">El sistema completo: Tienda, Comandera KDS y Punto de Venta en mostrador.</p>
                
                <div className="mb-6 pb-6 border-b border-[#3d2f25]">
                  <span className="text-4xl font-rustic font-bold text-[#e59324]">$24.900</span>
                  <span className="text-xs text-[#8c6f59]"> / mes</span>
                </div>

                <ul className="space-y-3 text-xs text-[#fcf9f5] mb-8">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#e59324] shrink-0" /> <strong>Pedidos Ilimitados</strong> sin costo extra
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#e59324] shrink-0" /> <strong>Comandera de Cocina KDS</strong> en tiempo real
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#e59324] shrink-0" /> <strong>Punto de Venta Mostrador (POS)</strong>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#e59324] shrink-0" /> <strong>Control de Inventario</strong> y alertas críticas
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#e59324] shrink-0" /> Seguimiento en vivo para los clientes
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#e59324] shrink-0" /> 0% de comisiones por orden
                  </li>
                </ul>
              </div>

              <Link href="/login" className="btn-amber w-full text-center py-3.5 text-xs font-bold shadow-lg">
                Comenzar Prueba Gratis (14 Días)
              </Link>
            </div>

            {/* Plan 3 */}
            <div className="bg-[#1f1712] border border-[#3d2f25] p-8 rounded-3xl flex flex-col justify-between shadow-xl">
              <div>
                <span className="text-xs text-[#a88a70] font-semibold uppercase tracking-wider">Multi-Local</span>
                <h3 className="font-rustic font-bold text-2xl text-white mt-1 mb-2">Franquicias & Bodegones</h3>
                <p className="text-xs text-[#bfa38c] mb-6">Para negocios con varias sucursales o alto volumen diario.</p>
                
                <div className="mb-6 pb-6 border-b border-[#31251e]">
                  <span className="text-4xl font-rustic font-bold text-white">$44.900</span>
                  <span className="text-xs text-[#8c6f59]"> / mes</span>
                </div>

                <ul className="space-y-3 text-xs text-[#dcd0c5] mb-8">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" /> Múltiples sucursales y subdominios
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" /> Usuarios ilimitados (Cajeros, Cocineros, Gerentes)
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" /> Reportes consolidados y métricas avanzadas
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" /> Asesor gastronómico dedicado
                  </li>
                </ul>
              </div>

              <Link href="/login" className="btn-secondary w-full text-center py-3 text-xs font-bold">
                Consultar por Franquicias
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section id="testimonios" className="py-20 md:py-28 border-b border-[#382b21]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="badge-rustic mb-3 text-xs">Casos de Éxito</span>
            <h2 className="text-3xl sm:text-5xl font-rustic font-bold text-white mb-4">
              Rotiserías de barrio que ya recuperaron su ganancia
            </h2>
            <p className="text-[#c7af9a] text-sm md:text-base leading-relaxed">
              Dueños de locales gastronómicos que dejaron el caos y ganaron tranquilidad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-[#1f1712] border border-[#3d2f25] p-8 rounded-3xl shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-[#e59324] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#e59324]" />
                  ))}
                </div>
                <p className="text-sm text-[#d4bfae] italic leading-relaxed mb-6">
                  &quot;Antes los domingos al mediodía eran un infierno de audios de WhatsApp y papeles que se manchaban con salsa en la plancha. Con ComandApp los pedidos entran solos y salen en orden en la pantalla de cocina. Facturamos un 30% más.&quot;
                </p>
              </div>
              <div className="pt-4 border-t border-[#31251e] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#d34e2c] text-white flex items-center justify-center font-rustic font-bold">
                  DC
                </div>
                <div>
                  <h4 className="font-rustic font-bold text-white text-sm">Carlos Gómez</h4>
                  <p className="text-xs text-[#a88a70]">Rotisería Don Carlos • 28 años en el barrio</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1f1712] border border-[#3d2f25] p-8 rounded-3xl shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-[#e59324] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#e59324]" />
                  ))}
                </div>
                <p className="text-sm text-[#d4bfae] italic leading-relaxed mb-6">
                  &quot;Dejamos de regalarle el 35% de cada comanda a las apps famosas de delivery. Ahora le decimos a nuestros clientes: &apos;Entrá a nuestro link directo&apos; y la plata de nuestro trabajo se queda con nuestra familia.&quot;
                </p>
              </div>
              <div className="pt-4 border-t border-[#31251e] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e59324] text-[#151210] flex items-center justify-center font-rustic font-bold">
                  LN
                </div>
                <div>
                  <h4 className="font-rustic font-bold text-white text-sm">Marisa Rossi</h4>
                  <p className="text-xs text-[#a88a70]">Pastas & Empanadas La Nonna</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1f1712] border border-[#3d2f25] p-8 rounded-3xl shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-[#e59324] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#e59324]" />
                  ))}
                </div>
                <p className="text-sm text-[#d4bfae] italic leading-relaxed mb-6">
                  &quot;El control de inventario nos salvó: antes nos dábamos cuenta de que no quedaba muzzarella un sábado a las 10 de la noche. Ahora el sistema nos avisa con tiempo para reponer. Es oro puro para la cocina.&quot;
                </p>
              </div>
              <div className="pt-4 border-t border-[#31251e] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#16a34a] text-white flex items-center justify-center font-rustic font-bold">
                  RC
                </div>
                <div>
                  <h4 className="font-rustic font-bold text-white text-sm">Martín Castelli</h4>
                  <p className="text-xs text-[#a88a70]">Rotisería Castelli • Especialistas en Spiedo</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 md:py-28 border-b border-[#382b21] bg-[#1a1410]/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="badge-rustic mb-3 text-xs">Dudas Gastronómicas</span>
            <h2 className="text-3xl sm:text-5xl font-rustic font-bold text-white mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-[#c7af9a] text-sm leading-relaxed">
              Todo lo que necesitas saber antes de empezar a cocinar con ComandApp.
            </p>
          </div>

          <div className="space-y-4">
            
            <div className="bg-[#1f1712] border border-[#3d2f25] rounded-2xl p-6">
              <h3 className="font-rustic font-bold text-lg text-white mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#e59324]" />
                ¿Necesito comprar computadoras caras o impresoras térmicas?
              </h3>
              <p className="text-sm text-[#bfa38c] leading-relaxed">
                ¡No! ComandApp es 100% web en la nube. Puedes usar cualquier celular, tablet vieja o computadora que ya tengas en el local con conexión a internet.
              </p>
            </div>

            <div className="bg-[#1f1712] border border-[#3d2f25] rounded-2xl p-6">
              <h3 className="font-rustic font-bold text-lg text-white mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#e59324]" />
                ¿Cómo acceden mis clientes a mi tienda?
              </h3>
              <p className="text-sm text-[#bfa38c] leading-relaxed">
                Cada local recibe su propio enlace web con subdominio (ej: <code>doncarlos.comandapp.com</code>). Puedes poner ese link en tu perfil de Instagram, en el estado de WhatsApp y en un código QR en tus cajas de empanadas o en el mostrador.
              </p>
            </div>

            <div className="bg-[#1f1712] border border-[#3d2f25] rounded-2xl p-6">
              <h3 className="font-rustic font-bold text-lg text-white mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#e59324]" />
                ¿Cobran comisión por cada empanada o plato que vendo?
              </h3>
              <p className="text-sm text-[#bfa38c] leading-relaxed">
                Absolutamente <strong>0% comisiones</strong>. Tu facturación mensual es tuya. Solo abonas la suscripción fija mensual de ComandApp.
              </p>
            </div>

            <div className="bg-[#1f1712] border border-[#3d2f25] rounded-2xl p-6">
              <h3 className="font-rustic font-bold text-lg text-white mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#e59324]" />
                ¿Puedo usar la comandera de cocina y el mostrador a la vez?
              </h3>
              <p className="text-sm text-[#bfa38c] leading-relaxed">
                Sí, están completamente sincronizados en vivo. El cajero anota un pedido en mostrador y al instante suena y aparece en la tablet de cocina sin retrasos.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-[#2a1a12] via-[#1f140e] to-[#151210]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="badge-rustic mb-6">
            <Flame className="w-4 h-4 text-[#e59324]" />
            <span>Empieza hoy mismo</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-rustic font-bold text-white mb-6 leading-tight">
            Pon tu cocina a marchar con <span className="text-[#e59324]">ComandApp</span>
          </h2>

          <p className="text-lg text-[#d4bfae] mb-10 max-w-2xl mx-auto leading-relaxed">
            Sin contratos de permanencia, sin comisiones y con soporte humano para que tu negocio de comida crezca como se merece.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/tienda" 
              className="btn-amber w-full sm:w-auto text-center py-4 px-8 text-base font-bold shadow-2xl"
            >
              Probar Tienda Demo Ahora
            </Link>
            
            <Link 
              href="/login" 
              className="btn-secondary w-full sm:w-auto text-center py-4 px-8 text-base font-semibold"
            >
              Iniciar Sesión en mi Panel
            </Link>
          </div>

        </div>
      </section>

      {/* RUSTIC FOOTER */}
      <footer className="bg-[#100c0a] border-t border-[#2e221a] py-16 text-[#9e836d] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            
            {/* Col 1: Brand */}
            <div className="space-y-4 md:col-span-2">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="bg-[#d34e2c] p-2 rounded-xl text-white">
                  <Flame className="w-5 h-5 text-[#ffd5a8]" />
                </div>
                <span className="font-rustic text-2xl font-bold tracking-tight text-white">
                  Comand<span className="text-[#e59324]">App</span>
                </span>
              </Link>
              <p className="text-sm text-[#b59982] max-w-md leading-relaxed">
                El sistema integral de gestión y e-commerce para la gastronomía tradicional. Desarrollado con dedicación para rotiserías, casas de empanadas, pizzerías y bodegones familiares.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <span className="badge-rustic text-[11px]">🥘 Hecho en Casa</span>
                <span className="badge-rustic text-[11px]">⚡ 0% Comisiones</span>
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div>
              <h4 className="font-rustic font-bold text-white text-sm uppercase tracking-wider mb-4">
                Plataforma
              </h4>
              <ul className="space-y-2.5">
                <li><Link href="/tienda" className="hover:text-[#e59324] transition-colors">Tienda Online Demo</Link></li>
                <li><Link href="/login" className="hover:text-[#e59324] transition-colors">Panel Administrador</Link></li>
                <li><Link href="/seguimiento" className="hover:text-[#e59324] transition-colors">Seguimiento en Vivo</Link></li>
                <li><Link href="/carrito" className="hover:text-[#e59324] transition-colors">Carrito & Comanda</Link></li>
              </ul>
            </div>

            {/* Col 3: Subdominios & Contact */}
            <div>
              <h4 className="font-rustic font-bold text-white text-sm uppercase tracking-wider mb-4">
                Subdominios
              </h4>
              <p className="text-xs text-[#a88a70] mb-3 leading-relaxed">
                Cada cliente dispone de su espacio aislado y seguro:
              </p>
              <div className="p-3 bg-[#17120e] rounded-xl border border-[#382b21] font-mono text-[11px] text-[#e59324]">
                tunegocio.comandapp.com
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-[#2e221a] flex flex-col sm:flex-row justify-between items-center gap-4 text-[#7a6452]">
            <p>ComandApp © {new Date().getFullYear()} — Todos los derechos reservados.</p>
            <p className="flex items-center gap-1.5">
              <span>Diseñado con pasión por la buena comida y la tecnología cercana</span>
            </p>
          </div>

        </div>
      </footer>

    </div>
  )
}
