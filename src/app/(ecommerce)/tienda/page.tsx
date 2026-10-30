import { getProducts, getRestaurant } from '@/lib/api'
import StoreFrontClient from '../components/StoreFrontClient'

export const dynamic = 'force-dynamic'

export default async function TiendaPage() {
  const restaurant = await getRestaurant()
  const products = await getProducts(restaurant.id)

  return (
    <StoreFrontClient 
      initialRestaurant={restaurant}
      initialProducts={products}
      showSubdomainBadge={false}
    />
  )
}
