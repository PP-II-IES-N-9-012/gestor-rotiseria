import { notFound } from 'next/navigation'
import { getProducts, getRestaurantStrict } from '@/lib/api'
import StoreFrontClient from '../../components/StoreFrontClient'

export const dynamic = 'force-dynamic'

export default async function TenantTiendaPage({ 
  params 
}: { 
  params: Promise<{ tenant: string }> 
}) {
  const { tenant } = await params
  const restaurant = await getRestaurantStrict(tenant)
  if (!restaurant) notFound()
  const products = await getProducts(restaurant.id)

  return (
    <StoreFrontClient 
      initialRestaurant={restaurant}
      initialProducts={products}
      showSubdomainBadge={true}
    />
  )
}
