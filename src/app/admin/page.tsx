'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  CreditCard,
  Banknote,
  Truck,
  Store,
  Receipt,
  Search,
  Eye,
  X,
  Printer,
  CheckCircle2,
  Flame,
  Award,
  ArrowRight,
  RefreshCw,
  BellRing,
  UtensilsCrossed
} from 'lucide-react'
import {
  getGerenciaStats,
  getCriticalInventory,
  refillInventory,
  invalidateCache,
  type GerenciaStats,
  type TimePeriod
} from '@/lib/api'
import { subscribeToStoreRealtime } from '@/lib/realtime'
import { useAdminRestaurant, useAdminNavHref } from '@/lib/AdminContext'
import Link from 'next/link'

export default function AdminDashboard() {
  const restaurant = useAdminRestaurant()
  const adminHref = useAdminNavHref()
  const restaurantId = restaurant?.id
  const primaryColor = restaurant?.primary_color || '#e59324'

  const [period, setPeriod] = useState<TimePeriod>('today')
  const [stats, setStats] = useState<GerenciaStats | null>(null)
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [refillLoadingId, setRefillLoadingId] = useState<string | null>(null)
  const [refillToast, setRefillToast] = useState<string | null>(null)
  const [errorToast, setErrorToast] = useState<string | null>(null)

  // Live WebSocket state & notifications
  const [wsConnected, setWsConnected] = useState(false)
  const [liveOrderToast, setLiveOrderToast] = useState<string | null>(null)
  const [recentLiveOrderId, setRecentLiveOrderId] = useState<string | null>(null)

  // Refs to read latest period & restaurantId inside persistent WebSocket callbacks
  const periodRef = useRef<TimePeriod>(period)
  const restaurantIdRef = useRef<string | undefined>(restaurantId)

      useEffect(() => {
        periodRef.current = period
        restaurantIdRef.current = restaurantId
      }, [period, restaurantId])

      // Modals state
      const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
      const [isZReportOpen, setIsZReportOpen] = useState(false)

      // Filters for order history table
      const [orderSearch, setOrderSearch] = useState('')
      const [statusFilter, setStatusFilter] = useState('all')
      const [paymentFilter, setPaymentFilter] = useState('all')

      const loadData = useCallback(async (showRefreshing = false, bustCache = false) => {
        try {
          if (bustCache) {
            invalidateCache('orders')
            invalidateCache('today_orders')
            invalidateCache('critical_inventory')
            invalidateCache('all_inventory')
          }

          if (showRefreshing) setRefreshing(true)
      else setLoading(true)

  const activeRestaurantId = restaurantIdRef.current
  const activePeriod = periodRef.current

  const [statsData, inventoryData] = await Promise.all([
    getGerenciaStats(activeRestaurantId, activePeriod),
    getCriticalInventory(activeRestaurantId)
  ])
  setStats(statsData)
  setInventory(inventoryData || [])

  // Mantener sincronizada la comanda abierta en el modal si cambió su estado
  setSelectedOrder((prev: any | null) => {
    if (!prev) return null
    const updated = statsData?.orders?.find((o: any) => o.id === prev.id)
    return updated || prev
  })
} catch (error) {
  console.error("Error loading gerencia data", error)
} finally {
  setLoading(false)
  setRefreshing(false)
}
  }, [])

// Carga al montar o al cambiar de período / restaurante
useEffect(() => {
  loadData(false, false)
}, [restaurantId, period, loadData])

// Suscripción en tiempo real mediante WebSockets (pedidos nuevos, cambios de estado e inventario)
useEffect(() => {
  let trailingTimer: ReturnType<typeof setTimeout> | null = null
  let toastTimer: ReturnType<typeof setTimeout> | null = null
  let highlightTimer: ReturnType<typeof setTimeout> | null = null

  const unsubscribe = subscribeToStoreRealtime(
    restaurantId,
    (evt) => {
      // Actualizar inmediatamente en segundo plano sin recargar página
      loadData(true, true)

      // Segundo barrido corto para capturar order_items e inventario insertados milisegundos después de orders
      if (trailingTimer) clearTimeout(trailingTimer)
      trailingTimer = setTimeout(() => {
        loadData(true, true)
      }, 450)

      if (evt.type === 'new_order') {
        const code = evt.orderId ? `#${evt.orderId.slice(0, 6).toUpperCase()}` : ''
        const client = evt.guestName ? ` • ${evt.guestName}` : ''
        const amount =
          evt.totalAmount && evt.totalAmount > 0
            ? ` ($${Number(evt.totalAmount).toLocaleString('es-AR')})`
            : ''
        setLiveOrderToast(`¡Nuevo pedido en vivo! ${code}${client}${amount}`)

        if (toastTimer) clearTimeout(toastTimer)
        toastTimer = setTimeout(() => setLiveOrderToast(null), 5000)

        if (evt.orderId) {
          setRecentLiveOrderId(evt.orderId)
          if (highlightTimer) clearTimeout(highlightTimer)
          highlightTimer = setTimeout(() => setRecentLiveOrderId(null), 8000)
        }
      }
    },
    (connected) => {
      setWsConnected(connected)
    }
  )

  return () => {
    unsubscribe()
    if (trailingTimer) clearTimeout(trailingTimer)
    if (toastTimer) clearTimeout(toastTimer)
    if (highlightTimer) clearTimeout(highlightTimer)
  }
}, [restaurantId, loadData])

const handleRefill = async (itemId: string, itemName: string) => {
  try {
    setRefillLoadingId(itemId)
    await refillInventory(itemId, 10, restaurantId)
    setRefillToast(`+10 unidades cargadas a ${itemName}`)
    setTimeout(() => setRefillToast(null), 3500)
    loadData(true, true)
  } catch (error) {
    console.error("Error refilling inventory", error)
    setErrorToast('No se pudo recargar el insumo. Intenta nuevamente.')
    setTimeout(() => setErrorToast(null), 4000)
  } finally {
    setRefillLoadingId(null)
  }
}

const handlePrintZReport = () => {
  window.print()
}

// KPIs
const totalSales = stats?.totalSales || 0
const totalOrders = stats?.totalOrders || 0
const averageTicket = stats?.averageTicket || 0
const criticalCount = inventory.length

const kpis = [
  {
    name: period === 'today' ? 'Ventas de Hoy' : period === 'week' ? 'Ventas de la Semana' : period === 'month' ? 'Ventas del Mes' : 'Ventas Históricas',
    value: `$${totalSales.toLocaleString()}`,
    icon: DollarSign,
    trend: period === 'today' ? 'Jornada activa' : 'Consolidado',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10'
  },
  {
    name: 'Comandas / Pedidos',
    value: totalOrders.toString(),
    icon: ShoppingBag,
    trend: stats ? `${stats.completedOrders} completados` : 'En proceso',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10'
  },
  {
    name: 'Ticket Promedio',
    value: `$${averageTicket.toLocaleString()}`,
    icon: TrendingUp,
    trend: totalOrders > 0 ? 'Por comanda' : 'Sin órdenes',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10'
  },
  {
    name: 'Insumos Críticos',
    value: criticalCount.toString(),
    icon: AlertCircle,
    trend: criticalCount > 0 ? 'Reponer stock' : 'Stock óptimo',
    color: criticalCount > 0 ? 'text-rose-400' : 'text-emerald-400',
    bg: criticalCount > 0 ? 'bg-rose-400/10' : 'bg-emerald-400/10'
  },
]

// Chart max value for scaling bars
const maxSales = Math.max(...(stats?.chartData?.map(d => d.sales) || [1]), 1)

// Filter orders for the table
const filteredOrders = (stats?.orders || []).filter(order => {
  const matchesSearch =
    (order.guest_name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
    (order.id || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
    (order.guest_phone || '').includes(orderSearch)

  const matchesStatus = statusFilter === 'all' || order.status === statusFilter
  const matchesPayment = paymentFilter === 'all' ||
    (paymentFilter === 'cash' && ((order.payment_method || '').toLowerCase().includes('cash') || (order.payment_method || '').toLowerCase().includes('efectivo'))) ||
    (paymentFilter === 'card' && !((order.payment_method || '').toLowerCase().includes('cash') || (order.payment_method || '').toLowerCase().includes('efectivo')))

  return matchesSearch && matchesStatus && matchesPayment
})

// Format today's date nicely in Spanish
const todayFormatted = new Intl.DateTimeFormat('es-AR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
}).format(new Date())

return (
  <div className="max-w-7xl mx-auto space-y-8 print:p-0">

    {/* Toast Notifications */}
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-2.5 print:hidden">
      {liveOrderToast && (
        <div
          className="bg-[#1b1410]/95 backdrop-blur-md border px-4 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 text-white"
          style={{ borderColor: `${primaryColor}80` }}
        >
          <div
            className="p-2 rounded-xl text-[#151210] shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <BellRing className="w-4 h-4 animate-bounce" />
          </div>
          <div className="text-left">
            <p className="text-[11px] uppercase tracking-wider font-bold" style={{ color: primaryColor }}>
              Actualización en Tiempo Real
            </p>
            <p className="text-xs sm:text-sm font-semibold text-white">{liveOrderToast}</p>
          </div>
          <button
            onClick={() => setLiveOrderToast(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-[color:var(--store-text-muted)] hover:text-white ml-1"
            aria-label="Cerrar notificación"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {refillToast && (
        <div className="bg-emerald-950 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{refillToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="bg-rose-950 border border-rose-500/50 text-rose-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <span className="text-sm font-medium">{errorToast}</span>
        </div>
      )}
    </div>

    {/* Header & Controls */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[color:var(--store-border)] pb-6 print:hidden">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="badge-rustic text-xs capitalize">
            <Calendar className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span>{todayFormatted}</span>
          </span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-semibold border transition-colors ${wsConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              title={wsConnected ? 'Sincronización WebSocket activa en tiempo real' : 'Conectando WebSocket en tiempo real...'}
            >
              <span
                className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
                  }`}
              />
              <span>{wsConnected ? 'En Vivo • WebSocket' : 'Sincronizando...'}</span>
            </span>
        </div>
        <h1 className="text-3xl font-bold font-rustic text-white">
          Dashboard Gerencial & KPIs
        </h1>
        <p className="text-xs text-[color:var(--store-text-muted)] mt-1">
          La jornada activa se reinicia cada nuevo día automáticamente, preservando permanentemente todo el historial para control semanal y mensual.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Period Selector Tabs */}
        <div className="p-1 rounded-xl bg-[color:var(--store-subtle-bg)] border border-[color:var(--store-border)] flex items-center gap-1">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === 'today'
              ? 'text-white shadow-md'
              : 'text-[color:var(--store-text-muted)] hover:text-white'
              }`}
            style={period === 'today' ? { backgroundColor: primaryColor } : undefined}
          >
            Hoy
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === 'week'
              ? 'text-white shadow-md'
              : 'text-[color:var(--store-text-muted)] hover:text-white'
              }`}
            style={period === 'week' ? { backgroundColor: primaryColor } : undefined}
          >
            Semanal
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === 'month'
              ? 'text-white shadow-md'
              : 'text-[color:var(--store-text-muted)] hover:text-white'
              }`}
            style={period === 'month' ? { backgroundColor: primaryColor } : undefined}
          >
            Mensual
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === 'all'
              ? 'text-white shadow-md'
              : 'text-[color:var(--store-text-muted)] hover:text-white'
              }`}
            style={period === 'all' ? { backgroundColor: primaryColor } : undefined}
          >
            Histórico
          </button>
        </div>

        {/* Arqueo de Caja / Z Report */}
        <button
          onClick={() => setIsZReportOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all text-white hover:brightness-110 shadow-md"
          style={{
            backgroundColor: 'var(--store-card-bg)',
            borderColor: `color-mix(in srgb, ${primaryColor} 40%, var(--store-border))`
          }}
        >
          <Receipt className="w-4 h-4" style={{ color: primaryColor }} />
          <span>Arqueo & Cierre de Caja</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={() => loadData(true, true)}
          disabled={refreshing}
          className="p-2 rounded-xl border border-[color:var(--store-border)] hover:bg-white/5 text-[color:var(--store-text-muted)] hover:text-white transition-colors"
          title="Actualizar datos"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>

    {loading ? (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: primaryColor }} />
        <p className="text-xs text-[color:var(--store-text-muted)]">Calculando métricas y consolidando comandas...</p>
      </div>
    ) : (
      <>
        {/* KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {kpis.map((kpi) => (
            <div
              key={kpi.name}
              className="glass-panel p-6 rounded-2xl border-l-4 transition-all hover:-translate-y-0.5 shadow-lg"
              style={{ borderLeftColor: primaryColor }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-[color:var(--store-text-muted)] uppercase tracking-wider">{kpi.name}</p>
                  <p className="mt-2 text-3xl font-bold text-white font-rustic">{kpi.value}</p>
                </div>
                <div className={`p-3 rounded-2xl ${kpi.bg}`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs">
                <span className={`${kpi.color} font-medium`}>{kpi.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Charts & Breakdown Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Real Chart */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-[color:var(--store-border)]">
              <div>
                <h2 className="text-lg font-bold font-rustic text-white">
                  {period === 'today' && 'Ventas por Franja Horaria (Jornada de Hoy)'}
                  {period === 'week' && 'Ventas Diarias (Últimos 7 días)'}
                  {period === 'month' && 'Evolución por Semanas (Últimos 30 días)'}
                  {period === 'all' && 'Facturación Consolidada Histórica'}
                </h2>
                <p className="text-xs text-[color:var(--store-text-muted)] mt-0.5">
                  Calculado en base a {stats?.totalOrders || 0} comanda(s) registradas en este período.
                </p>
              </div>
              <span className="text-xs font-bold font-rustic text-white" style={{ color: primaryColor }}>
                Total: ${totalSales.toLocaleString()}
              </span>
            </div>

            {/* Chart Visualizer */}
            {(!stats?.chartData || stats.chartData.length === 0 || maxSales === 0) ? (
              <div className="h-64 flex flex-col items-center justify-center text-[color:var(--store-text-faint)] text-xs">
                <Clock className="w-8 h-8 mb-2 opacity-40" />
                <span>Sin ventas registradas en las franjas de este período.</span>
                <span className="text-[11px] mt-1 text-[color:var(--store-text-muted)]">Los nuevos pedidos ingresados desde POS o Tienda aparecerán aquí al instante.</span>
              </div>
            ) : (
              <div>
                <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
                  {stats.chartData.map((bar, i) => {
                    const heightPercent = maxSales > 0 ? Math.round((bar.sales / maxSales) * 100) : 0
                    const barHeight = Math.max(heightPercent, bar.sales > 0 ? 8 : 2)

                    return (
                      <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">

                        {/* Tooltip on hover */}
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 backdrop-blur-md border border-white/20 text-white text-[11px] py-1 px-2.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl z-20">
                          <p className="font-bold">{bar.fullLabel || bar.label}</p>
                          <p className="text-emerald-400 font-rustic">${bar.sales.toLocaleString()}</p>
                          <p className="text-[10px] text-gray-300">{bar.orders} pedido(s)</p>
                        </div>

                        {/* Bar Value above when high */}
                        {bar.sales > 0 && (
                          <span className="text-[10px] font-bold text-white/70 mb-1.5 hidden sm:block">
                            ${bar.sales >= 1000 ? `${Math.round(bar.sales / 1000)}k` : bar.sales}
                          </span>
                        )}

                        {/* Bar */}
                        <div
                          className="w-full rounded-t-lg transition-all duration-500 group-hover:brightness-125 shadow-md"
                          style={{
                            height: `${barHeight}%`,
                            backgroundColor: bar.sales > 0 ? primaryColor : 'var(--store-border, rgba(255,255,255,0.08))',
                            minHeight: '4px'
                          }}
                        />
                      </div>
                    )
                  })}
                </div>

                {/* Horizontal Labels */}
                <div className="flex justify-between text-xs text-[color:var(--store-text-muted)] mt-3 border-t border-[color:var(--store-border)] pt-2 px-1">
                  {stats.chartData.map((bar, i) => (
                    <span key={i} className="text-center font-medium text-[11px]">
                      {bar.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Insumos Críticos & Alertas */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[color:var(--store-border)]">
                <div>
                  <h2 className="text-lg font-bold font-rustic text-white">Alertas de Inventario</h2>
                  <p className="text-xs text-[color:var(--store-text-muted)]">Materias primas bajo stock mínimo</p>
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-bold border"
                  style={{
                    backgroundColor: `${primaryColor}20`,
                    borderColor: `${primaryColor}40`,
                    color: primaryColor
                  }}
                >
                  {inventory.length} Críticos
                </span>
              </div>

              {inventory.length === 0 ? (
                <div className="py-12 text-center text-[color:var(--store-text-muted)] text-xs">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-80" />
                  <p className="font-semibold text-white">Stock en niveles óptimos</p>
                  <p className="mt-1">No hay materias primas por debajo de su umbral mínimo.</p>
                </div>
              ) : (
                <ul className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
                  {inventory.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between items-center bg-[color:var(--store-subtle-bg)] p-3 rounded-xl border border-[color:var(--store-border)]"
                    >
                      <div>
                        <p className="font-semibold text-sm text-red-400">{item.name}</p>
                        <p className="text-xs text-[color:var(--store-text-muted)]">
                          Quedan <strong className="text-white">{item.quantity_available} {item.unit}</strong> (Mín: {item.min_stock})
                        </p>
                      </div>
                      <button
                        onClick={() => handleRefill(item.id, item.name)}
                        disabled={refillLoadingId === item.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all hover:bg-white/10 flex items-center gap-1.5 disabled:opacity-50"
                        style={{ borderColor: `${primaryColor}60`, color: primaryColor }}
                      >
                        {refillLoadingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>+10 {item.unit}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[color:var(--store-border)]">
              <Link
                href={adminHref('/admin/inventario')}
                className="text-xs font-semibold flex items-center justify-between text-[color:var(--store-text-muted)] hover:text-white transition-colors"
              >
                <span>Ver inventario completo y movimientos</span>
                <ArrowRight className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              </Link>
            </div>
          </div>

        </div>

        {/* Secondary Stats Row: Medios de Pago, Modalidad & Top Platos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Medios de Pago */}
          <div className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="font-rustic font-bold text-base text-white mb-1 flex items-center gap-2">
                <Banknote className="w-4 h-4" style={{ color: primaryColor }} />
                <span>Desglose por Medio de Pago</span>
              </h3>
              <p className="text-xs text-[color:var(--store-text-muted)] mb-4">Ingresos de este período</p>

              <div className="space-y-4">
                {/* Efectivo */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 text-emerald-400" /> Efectivo
                    </span>
                    <span className="font-rustic font-bold text-emerald-400">
                      ${stats?.cashSales.toLocaleString()} ({stats?.cashOrdersCount || 0} com.)
                    </span>
                  </div>
                  <div className="w-full bg-[color:var(--store-subtle-bg)] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${totalSales > 0 ? ((stats?.cashSales || 0) / totalSales) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Tarjetas / MercadoPago */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-400" /> Digital (Tarjeta/MP)
                    </span>
                    <span className="font-rustic font-bold text-blue-400">
                      ${stats?.cardSales.toLocaleString()} ({stats?.cardOrdersCount || 0} com.)
                    </span>
                  </div>
                  <div className="w-full bg-[color:var(--store-subtle-bg)] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${totalSales > 0 ? ((stats?.cardSales || 0) / totalSales) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[color:var(--store-border)] text-xs text-[color:var(--store-text-muted)] flex justify-between">
              <span>Total Facturado:</span>
              <span className="font-bold text-white font-rustic">${totalSales.toLocaleString()}</span>
            </div>
          </div>

          {/* Modalidad de Pedido */}
          <div className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="font-rustic font-bold text-base text-white mb-1 flex items-center gap-2">
                <Truck className="w-4 h-4" style={{ color: primaryColor }} />
                <span>Modalidad de Despacho</span>
              </h3>
              <p className="text-xs text-[color:var(--store-text-muted)] mb-4">Delivery vs Retiro en Local</p>

              <div className="space-y-4">
                {/* Delivery */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-amber-400" /> Delivery
                    </span>
                    <span className="font-rustic font-bold text-amber-400">
                      ${stats?.deliverySales.toLocaleString()} ({stats?.deliveryOrdersCount || 0} com.)
                    </span>
                  </div>
                  <div className="w-full bg-[color:var(--store-subtle-bg)] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${totalSales > 0 ? ((stats?.deliverySales || 0) / totalSales) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Retiro en Local */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-purple-400" /> Mostrador / Retiro
                    </span>
                    <span className="font-rustic font-bold text-purple-400">
                      ${stats?.pickupSales.toLocaleString()} ({stats?.pickupOrdersCount || 0} com.)
                    </span>
                  </div>
                  <div className="w-full bg-[color:var(--store-subtle-bg)] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all"
                      style={{ width: `${totalSales > 0 ? ((stats?.pickupSales || 0) / totalSales) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[color:var(--store-border)] text-xs text-[color:var(--store-text-muted)] flex justify-between">
              <span>Tasa de entrega completada:</span>
              <span className="font-bold text-emerald-400">
                {totalOrders > 0 ? `${Math.round(((stats?.completedOrders || 0) / totalOrders) * 100)}%` : '0%'}
              </span>
            </div>
          </div>

          {/* Platos Más Vendidos */}
          <div className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="font-rustic font-bold text-base text-white mb-1 flex items-center gap-2">
                <Award className="w-4 h-4" style={{ color: primaryColor }} />
                <span>Platos Más Pedidos</span>
              </h3>
              <p className="text-xs text-[color:var(--store-text-muted)] mb-3">Ranking de ventas del período</p>

              {(!stats?.topProducts || stats.topProducts.length === 0) ? (
                <p className="text-xs text-[color:var(--store-text-muted)] py-6 text-center">
                  Aún no hay platos registrados en este período.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {stats.topProducts.map((p, index) => (
                    <li key={index} className="flex items-center justify-between text-xs bg-[color:var(--store-subtle-bg)] p-2.5 rounded-xl border border-[color:var(--store-border)]">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                          style={{
                            backgroundColor: index === 0 ? `${primaryColor}` : 'rgba(255,255,255,0.1)',
                            color: index === 0 ? '#151210' : '#fff'
                          }}
                        >
                          {index + 1}
                        </span>
                        <span className="font-medium text-white truncate">{p.name}</span>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="font-bold text-white">{p.quantity} u.</span>
                        <span className="text-[10px] text-[color:var(--store-text-muted)] block font-rustic">
                          ${p.revenue.toLocaleString()}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[color:var(--store-border)]">
              <Link
                href={adminHref('/admin/productos')}
                className="text-xs font-semibold flex items-center justify-between text-[color:var(--store-text-muted)] hover:text-white transition-colors"
              >
                <span>Gestionar catálogo y recetas</span>
                <ArrowRight className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              </Link>
            </div>
          </div>

        </div>

        {/* Order History Table */}
        <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-[color:var(--store-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold font-rustic text-white">
                Historial de Comandas & Pedidos ({filteredOrders.length})
              </h2>
              <p className="text-xs text-[color:var(--store-text-muted)]">
                Registro cronológico detallado guardado permanentemente en la base de datos.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--store-text-faint)]" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Buscar comanda o cliente..."
                  className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[color:var(--store-subtle-bg)] border border-[color:var(--store-border)] text-white focus:outline-none focus:border-[var(--brand-primary,#e59324)]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs bg-[color:var(--store-subtle-bg)] border border-[color:var(--store-border)] text-white focus:outline-none"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="preparing">En Marcha</option>
                <option value="ready">Listos</option>
                <option value="completed">Entregados</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs bg-[color:var(--store-subtle-bg)] border border-[color:var(--store-border)] text-white focus:outline-none"
              >
                <option value="all">Todos los pagos</option>
                <option value="cash">Efectivo</option>
                <option value="card">Digital (Tarjeta/MP)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[color:var(--store-subtle-bg)] text-[color:var(--store-text-muted)] border-b border-[color:var(--store-border)]">
                  <th className="p-3.5 font-semibold">Comanda</th>
                  <th className="p-3.5 font-semibold">Fecha y Hora</th>
                  <th className="p-3.5 font-semibold">Cliente</th>
                  <th className="p-3.5 font-semibold">Modalidad</th>
                  <th className="p-3.5 font-semibold">Pago</th>
                  <th className="p-3.5 font-semibold">Estado</th>
                  <th className="p-3.5 font-semibold text-right">Total</th>
                  <th className="p-3.5 font-semibold text-center">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--store-border)]">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[color:var(--store-text-muted)]">
                      No se encontraron pedidos en este período con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const dateObj = new Date(order.created_at)
                    const isCash = (order.payment_method || '').toLowerCase().includes('cash') || (order.payment_method || '').toLowerCase().includes('efectivo')

                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-[color:var(--store-subtle-bg)] transition-colors cursor-pointer ${recentLiveOrderId === order.id ? 'bg-emerald-500/10' : ''
                          }`}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="p-3.5 font-mono font-bold text-white">
                          <span className="inline-flex items-center gap-1.5">
                            <span>#{order.id.slice(0, 6).toUpperCase()}</span>
                            {recentLiveOrderId === order.id && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                Nuevo
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="p-3.5 text-[color:var(--store-text-muted)]">
                          {dateObj.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} • {dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3.5 text-white font-medium">
                          {order.guest_name || 'Cliente en Mostrador'}
                        </td>
                        <td className="p-3.5">
                          {order.delivery_type === 'delivery' ? (
                            <span className="inline-flex items-center gap-1 text-amber-400">
                              <Truck className="w-3 h-3" /> Delivery
                            </span>
                          ) : order.delivery_type === 'dine_in' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400">
                              <UtensilsCrossed className="w-3 h-3" /> Salón
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-purple-400">
                              <Store className="w-3 h-3" /> Retiro
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {isCash ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Efectivo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              Digital
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {order.status === 'completed' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                              Entregado
                            </span>
                          )}
                          {order.status === 'ready' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                              ¡Listo!
                            </span>
                          )}
                          {order.status === 'preparing' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/20 text-orange-400">
                              En Marcha
                            </span>
                          )}
                          {order.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-rustic font-bold text-white text-sm">
                          ${Number(order.total_amount).toLocaleString()}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedOrder(order)
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-[color:var(--store-text-muted)] hover:text-white transition-colors"
                            title="Ver comanda completa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )}

    {/* MODAL 1: Detalle Completo de Comanda */}
    {selectedOrder && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        onClick={() => setSelectedOrder(null)}
      >
        <div
          className="print-active bg-[color:var(--store-card-bg)] border border-[color:var(--store-border)] rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4 pb-3 border-b border-[color:var(--store-border)]">
            <div>
              <span className="text-[10px] text-[color:var(--store-text-muted)] uppercase tracking-wider font-semibold">Comanda • {restaurant?.name || 'ComandApp'}</span>
              <h3 className="font-rustic font-bold text-2xl text-white">
                #{selectedOrder.id.slice(0, 8).toUpperCase()}
              </h3>
              <p className="text-xs text-[color:var(--store-text-muted)] mt-0.5">
                Registrada el {new Date(selectedOrder.created_at).toLocaleString('es-AR')}
              </p>
            </div>
            <button
              onClick={() => setSelectedOrder(null)}
              className="no-print p-1.5 rounded-xl hover:bg-white/10 text-[color:var(--store-text-muted)] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Client & Delivery Info */}
          <div className="bg-[color:var(--store-subtle-bg)] p-4 rounded-2xl border border-[color:var(--store-border)] mb-5 text-xs space-y-1.5">
            <p><strong className="text-white">Cliente:</strong> {selectedOrder.guest_name || 'Mostrador'}</p>
            {selectedOrder.guest_phone && <p><strong className="text-white">Teléfono:</strong> {selectedOrder.guest_phone}</p>}
            <p><strong className="text-white">Modalidad:</strong> {selectedOrder.delivery_type === 'delivery' ? 'Envío a Domicilio' : selectedOrder.delivery_type === 'dine_in' ? 'Salón / Mesa' : 'Retiro en Local'}</p>
            {selectedOrder.guest_address && <p><strong className="text-white">Dirección de Entrega:</strong> {selectedOrder.guest_address}</p>}
            <p><strong className="text-white">Medio de Pago:</strong> {selectedOrder.payment_method === 'cash' ? 'Efectivo' : selectedOrder.payment_method === 'transfer' ? 'Transferencia / MP' : 'Tarjeta / Digital'}</p>
            {selectedOrder.notes && (
              <p className="pt-2 text-amber-300 italic border-t border-white/10">
                <strong>Aclaración para cocina:</strong> &ldquo;{selectedOrder.notes}&rdquo;
              </p>
            )}
          </div>

          {/* Platos en la comanda */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-[color:var(--store-text-muted)] uppercase tracking-wider mb-2">Platos Solicitados</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {selectedOrder.order_items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-xs bg-[color:var(--store-subtle-bg)] p-2.5 rounded-xl">
                  <span className="text-white font-medium">
                    {item.quantity}x {item.products?.name || 'Plato del Menú'}
                  </span>
                  <span className="font-rustic font-bold text-white">
                    ${(Number(item.quantity) * Number(item.unit_price)).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-4 border-t border-[color:var(--store-border)] mb-6">
            <span className="text-sm font-semibold text-white">Total Abonado</span>
            <span className="text-2xl font-bold font-rustic" style={{ color: primaryColor }}>
              ${Number(selectedOrder.total_amount).toLocaleString()}
            </span>
          </div>

          <div className="no-print flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => window.print()}
              className="flex-1 btn-secondary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Comanda</span>
            </button>
            <button
              onClick={() => setSelectedOrder(null)}
              className="flex-1 btn-primary py-2.5 text-xs font-bold"
            >
              Cerrar Detalle
            </button>
          </div>
        </div>
      </div>
    )}

    {/* MODAL 2: Arqueo & Cierre de Caja del Día (Reporte Z) */}
    {isZReportOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
        onClick={() => setIsZReportOpen(false)}
      >
        <div
          className="print-active bg-[color:var(--store-card-bg)] border border-[color:var(--store-border)] rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4 pb-3 border-b border-[color:var(--store-border)]">
            <div>
              <span className="badge-rustic text-[10px]">Control de Caja & Auditoría</span>
              <h3 className="font-rustic font-bold text-2xl text-white mt-1">
                {period === 'today' ? 'Arqueo & Balance de Jornada' : period === 'week' ? 'Balance Consolidado Semanal' : period === 'month' ? 'Balance Consolidado Mensual' : 'Balance Consolidado Histórico'}
              </h3>
              <p className="text-xs text-[color:var(--store-text-muted)] mt-0.5">
                {restaurant?.name || 'ComandApp'} • {todayFormatted}
              </p>
            </div>
            <button
              onClick={() => setIsZReportOpen(false)}
              className="no-print p-1.5 rounded-xl hover:bg-white/10 text-[color:var(--store-text-muted)] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 my-6 text-xs">
            <div className="bg-[color:var(--store-subtle-bg)] p-4 rounded-2xl border border-[color:var(--store-border)] space-y-2.5">
              <div className="flex justify-between items-center text-sm font-bold text-white border-b border-white/10 pb-2">
                <span>
                  {period === 'today' ? 'Facturación Total de la Jornada:' : period === 'week' ? 'Facturación Últimos 7 Días:' : period === 'month' ? 'Facturación Últimos 30 Días:' : 'Facturación Histórica Total:'}
                </span>
                <span className="font-rustic text-lg" style={{ color: primaryColor }}>
                  ${totalSales.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-emerald-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Banknote className="w-4 h-4" /> Efectivo en Mano / Caja:
                </span>
                <span className="font-bold font-rustic text-sm">
                  ${stats?.cashSales.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-blue-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <CreditCard className="w-4 h-4" /> Tarjetas / MercadoPago:
                </span>
                <span className="font-bold font-rustic text-sm">
                  ${stats?.cardSales.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-[color:var(--store-text-muted)] pt-2 border-t border-white/10">
                <span>Cantidad de Comandas Procesadas:</span>
                <span className="font-bold text-white">{totalOrders}</span>
              </div>

              <div className="flex justify-between items-center text-[color:var(--store-text-muted)]">
                <span>Gasto Promedio por Cliente (Ticket):</span>
                <span className="font-bold text-white font-rustic">${averageTicket.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-[11px] leading-relaxed">
              ℹ️ <strong>Cierre automático:</strong> Los datos históricos quedan archivados de manera segura e inalterable en Supabase. A las 00:00 hs de cada día, el tablero operativo diario se restaura en $0 para la nueva jornada.
            </div>
          </div>

          <div className="no-print flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handlePrintZReport}
              className="flex-1 btn-primary py-3 text-xs font-bold flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Arqueo de Caja</span>
            </button>
            <button
              onClick={() => setIsZReportOpen(false)}
              className="btn-secondary py-3 text-xs font-bold text-center"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    )}

  </div>
)
}
