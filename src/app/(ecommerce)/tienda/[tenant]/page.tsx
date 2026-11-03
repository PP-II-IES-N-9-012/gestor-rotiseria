import type { Metadata } from 'next'
import { getProducts, getRestaurant } from '@/lib/api'
import StoreFrontClient from '../../components/StoreFrontClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
    params
  }: {
    params: Promise<{ tenant: string }>
  }): Promise<Metadata> {
  const { tenant } = await params
  const restaurant = await getRestaurant(tenant)
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
