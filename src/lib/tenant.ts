// Resolución de "tenant" (comercio) a partir del host. Es seguro importarlo desde
// el proxy (edge), componentes de servidor y componentes de cliente.

// Subdominios reservados que no corresponden a un comercio
export const RESERVED_SUBDOMAINS = new Set([
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

/**
 * Normaliza un slug de subdominio eliminando acentos, espacios, símbolos
 * y guiones sobrantes al inicio o al final.
 */
export function normalizeTenantSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Dominios raíz propios cuyos subdominios representan comercios.
// Configurable con NEXT_PUBLIC_ROOT_DOMAINS (separados por coma).
// Hosts como "*.vercel.app" NO están acá: el subdominio ahí es el nombre del
// proyecto, no un comercio. En esos casos se usa ?negocio=<slug>.
export const ROOT_DOMAINS = (process.env.NEXT_PUBLIC_ROOT_DOMAINS || 'comandapp.com,localhost')
  .split(',')
  .map(d => d.trim().toLowerCase())
  .filter(Boolean)

/** Quita el puerto de un host ("a.localhost:3000" -> "a.localhost"), soporta IPv6. */
export function stripPort(host: string): string {
  const h = host.trim().toLowerCase()
  if (h.startsWith('[')) return h.slice(0, h.indexOf(']') + 1)
  return h.split(':')[0]
}

/** Devuelve el dominio raíz propio al que pertenece el host (o null). */
export function matchRootDomain(host: string): string | null {
  const h = stripPort(host)
  for (const root of ROOT_DOMAINS) {
    if (h === root || h.endsWith(`.${root}`)) return root
  }
  return null
}

/**
 * "don-carlos.comandapp.com" -> "don-carlos"
 * "trippburger.localhost:3000" -> "trippburger"
 * "localhost:3000" / "x.vercel.app" -> null
 */
export function extractSubdomain(host: string): string | null {
  const h = stripPort(host)
  for (const root of ROOT_DOMAINS) {
    if (h.endsWith(`.${root}`)) {
      const sub = h.slice(0, -(root.length + 1))
      if (sub && !sub.includes('.') && !RESERVED_SUBDOMAINS.has(sub) && isNaN(Number(sub))) {
        return sub
      }
      return null
    }
  }
  return null
}

/**
 * Tenant actual en el navegador. Orden: subdominio -> ?negocio= -> /tienda/<slug> -> sessionStorage.
 * Solo usar en el cliente.
 */
export function getClientTenant(): string | null {
  if (typeof window === 'undefined') return null
  const fromHost = extractSubdomain(window.location.host)
  if (fromHost) {
    try { window.sessionStorage.setItem('comandapp_active_tenant', fromHost) } catch { }
    return fromHost
  }

  const params = new URLSearchParams(window.location.search)
  const fromQuery = params.get('negocio') || params.get('subdomain')
  if (fromQuery) {
    const clean = normalizeTenantSlug(fromQuery)
    if (clean) {
      try { window.sessionStorage.setItem('comandapp_active_tenant', clean) } catch { }
      return clean
    }
  }

  const match = window.location.pathname.match(/^\/tienda\/([^/]+)/)
  if (match) {
    const clean = normalizeTenantSlug(decodeURIComponent(match[1]))
    if (clean) {
      try { window.sessionStorage.setItem('comandapp_active_tenant', clean) } catch { }
      return clean
    }
  }

  // En /tienda raíz (sin subdominio ni ?negocio=), es la Tienda Demo: limpiar tenant previo
  if (window.location.pathname === '/tienda') {
    try { window.sessionStorage.removeItem('comandapp_active_tenant') } catch { }
    return null
  }

  if (window.location.pathname.startsWith('/carrito') || window.location.pathname.startsWith('/seguimiento')) {
    try {
      const saved = window.sessionStorage.getItem('comandapp_active_tenant')
      if (saved) return saved
    } catch { }
  }

  return null
}

/** True si el navegador está parado en un subdominio propio de un comercio. */
export function isOnTenantHost(): boolean {
  return typeof window !== 'undefined' && !!extractSubdomain(window.location.host)
}

/**
 * Construye la URL para ir a una ruta de un comercio.
 * - En dominio propio (comandapp.com / localhost): usa el subdominio.
 * - En otros hosts (vercel.app, etc.): usa ?negocio=<slug>.
 * Solo usar en el cliente.
 */
export function buildTenantUrl(subdomain: string, path = '/'): string {
  const cleanSub = normalizeTenantSlug(subdomain) || subdomain
  const { protocol, host } = window.location
  const root = matchRootDomain(host)
  if (root) {
    const port = host.includes(':') && !host.startsWith('[') ? `:${host.split(':')[1]}` : ''
    return `${protocol}//${cleanSub}.${root}${port}${path}`
  }
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}negocio=${encodeURIComponent(cleanSub)}`
}

/**
 * Link interno que conserva el tenant: sin cambios en subdominio propio,
 * agrega ?negocio= cuando el tenant viene de la query/path.
 */
export function tenantPath(path: string, tenant: string | null): string {
  if (!tenant || isOnTenantHost()) return path
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}negocio=${encodeURIComponent(tenant)}`
}
