import { headers } from 'next/headers'
import { getProducts, getRestaurant } from '@/lib/api'
import StoreFrontClient from '../components/StoreFrontClient'

export const dynamic = 'force-dynamic'

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
