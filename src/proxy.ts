import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Subdominios reservados que no corresponden a un comercio
const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'admin',
  'app',
  'mail',
  'ftp',
  'localhost',
  '127',
  'test',
  'staging'
])

// Dominios raíz propios cuyos subdominios representan comercios.
// Configurable con NEXT_PUBLIC_ROOT_DOMAINS (separados por coma).
// Hosts como "*.vercel.app" NO están acá: el subdominio ahí es el nombre del
// proyecto, no un comercio. En esos casos se usa /tienda/<slug> o ?negocio=<slug>.
const ROOT_DOMAINS = (process.env.NEXT_PUBLIC_ROOT_DOMAINS || 'comandapp.com,localhost')
  .split(',')
  .map(d => d.trim().toLowerCase())
  .filter(Boolean)

export default function proxy(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''
  
  // Extraer el host sin puerto (ej: "don-carlos.localhost:3000" -> "don-carlos.localhost")
  const hostWithoutPort = hostname.split(':')[0].toLowerCase()

  // Detectar subdominio solo si el host termina en alguno de los dominios raíz
  // "don-carlos.comandapp.com" -> "don-carlos"
  // "don-carlos.localhost" -> "don-carlos"
  // "comandapp-weld.vercel.app" -> null (landing)
  let tenantSubdomain: string | null = null

  for (const root of ROOT_DOMAINS) {
    if (hostWithoutPort.endsWith(`.${root}`)) {
      const sub = hostWithoutPort.slice(0, -(root.length + 1))
      // Solo un nivel de subdominio, no reservado
      if (sub && !sub.includes('.') && !RESERVED_SUBDOMAINS.has(sub) && isNaN(Number(sub))) {
        tenantSubdomain = sub
      }
      break
    }
  }

  // Soporte adicional: Si se pasa ?negocio=xxx o ?subdomain=xxx en query params
  const queryTenant = url.searchParams.get('negocio') || url.searchParams.get('subdomain')
  if (queryTenant && !tenantSubdomain) {
    tenantSubdomain = queryTenant
  }

  // Clientes con subdominio propio:
  // Si el usuario accede a "don-carlos.comandapp.com/"
  // reescribimos internamente hacia la tienda de ese cliente
  if (tenantSubdomain) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-tenant-subdomain', tenantSubdomain)

    // Si accede a la raíz de su subdominio, mostramos la tienda de ese cliente
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL(`/tienda/${tenantSubdomain}`, request.url), {
        request: { headers: requestHeaders }
      })
    }

    // Rutas internas de la tienda
    if (url.pathname === '/carrito') {
      return NextResponse.rewrite(new URL(`/tienda/${tenantSubdomain}/carrito`, request.url), {
        request: { headers: requestHeaders }
      })
    }

    if (url.pathname === '/seguimiento') {
      return NextResponse.rewrite(new URL(`/tienda/${tenantSubdomain}/seguimiento`, request.url), {
        request: { headers: requestHeaders }
      })
    }

    return NextResponse.next({
      request: { headers: requestHeaders }
    })
  }

  // Dominio raíz base (ej: comandapp.com, localhost:3000):
  // "/" renderiza la Landing Page de ComandApp
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto:
     * 1. /api (rutas de API)
     * 2. /_next (archivos de Next.js)
     * 3. /_static (archivos estáticos)
     * 4. /favicon.ico, archivos con extensión (.jpg, .png, etc.)
     */
    '/((?!api|_next|_static|[\\w-]+\\.\\w+).*)',
  ],
}
