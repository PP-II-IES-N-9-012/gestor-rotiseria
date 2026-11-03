import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { extractSubdomain, normalizeTenantSlug } from '@/lib/tenant'

export default function proxy(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // "don-carlos.comandapp.com" / "don-carlos.localhost:3000" -> "don-carlos"
  // "comandapp-weld.vercel.app" / "localhost:3000" -> null (landing)
  let tenantSubdomain: string | null = extractSubdomain(hostname)

  // Soporte adicional: ?negocio=xxx o ?subdomain=xxx (hosts sin subdominios propios)
  const queryTenant = url.searchParams.get('negocio') || url.searchParams.get('subdomain')
  if (queryTenant && !tenantSubdomain) {
    tenantSubdomain = normalizeTenantSlug(queryTenant) || null
  }

  // Clientes con subdominio propio:
  // Si el usuario accede a "don-carlos.comandapp.com/"
  // reescribimos internamente hacia la tienda de ese cliente
  if (tenantSubdomain) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-tenant-subdomain', tenantSubdomain)

    // La raíz y /tienda de un subdominio muestran la tienda de ese comercio.
    // /carrito, /seguimiento, /login y /admin siguen siendo las mismas rutas;
    // resuelven el comercio con el header / el host (ver lib/tenant.ts).
    if (url.pathname === '/' || url.pathname === '/tienda') {
      return NextResponse.rewrite(new URL(`/tienda/${tenantSubdomain}`, request.url), {
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
     * Coincidir con todas las rutas de navegación excepto:
     * 1. /api (rutas de API)
     * 2. /_next y /_static (bundles e imágenes optimizadas)
     * 3. Archivos estáticos en raíz o subcarpetas (.png, .jpg, .svg, .woff2, etc.)
     */
    '/((?!api|_next|_static|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|css|js|map)$).*)',
  ],
}
