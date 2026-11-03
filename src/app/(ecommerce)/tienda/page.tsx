import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getProducts, getRestaurant } from '@/lib/api'
import StoreFrontClient from '../components/StoreFrontClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<{ negocio?: string; subdomain?: string }>
}): Promise<Metadata> {
  const sp = await searchParams
  const headerList = await headers()
  const tenantSlug =
    headerList.get('x-tenant-subdomain') ||
    sp?.negocio ||
    sp?.subdomain ||
    'don-carlos'

  const restaurant = await getRestaurant(tenantSlug)
  const title = `${restaurant.name} | Pedidos Online`
  const description =
    restaurant.description ||
    `Pedí online en ${restaurant.name} sin comisiones. Recién hecho y directo a tu mesa.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: restaurant.logo_url ? [restaurant.logo_url] : undefined
    }
  }
}

export default async function TiendaPage({
  searchParams
}: {
  searchParams: Promise<{ negocio?: string; subdomain?: string }>
}) {
  const sp = await searchParams
  const headerList = await headers()
  const tenantSlug =
    headerList.get('x-tenant-subdomain') ||
    sp?.negocio ||
    sp?.subdomain ||
    'don-carlos'

  const restaurant = await getRestaurant(tenantSlug)
  const products = await getProducts(restaurant.id)

  return (
      <StoreFrontClient
      initialRestaurant={restaurant}
      initialProducts={products}
      showSubdomainBadge={true}
    />
  )
}
