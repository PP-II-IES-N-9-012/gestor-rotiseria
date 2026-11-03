import { getProducts, getRestaurant } from '@/lib/api'
import StoreFrontClient from '../../components/StoreFrontClient'

export const dynamic = 'force-dynamic'

export default async function TenantTiendaPage({ 
  params 
}: { 
  params: Promise<{ tenant: string }> 
}) {
  const { tenant } = await params
  const restaurant = await getRestaurant(tenant)
  const products = await getProducts(restaurant.id)

  return (
    <StoreFrontClient 
      initialRestaurant={restaurant}
      initialProducts={products}
      showSubdomainBadge={true}
    />
  )
}
