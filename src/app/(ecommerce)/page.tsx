import { getProducts } from '@/lib/api'
import AddToCartButton from './components/AddToCartButton'

export const revalidate = 0

export default async function CatalogPage() {
  let products: any[] = []
  try {
    products = await getProducts()
  } catch (error) {
    console.warn("Error fetching products from Supabase", error)
  }

  const categories = Array.from(new Set(products.map(p => p.category)))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden mb-16 glass-panel border-none bg-gradient-to-r from-red-900/40 to-slate-900/80 p-12 text-center md:text-left">
        <h1 className="text-4xl md:text-6xl font-extrabold font-outfit mb-4 text-white drop-shadow-lg">
          Sabor casero, <span className="text-red-500">al instante.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
          Descubre nuestra selección de comidas preparadas con los ingredientes más frescos. 
          Pide online y disfruta en casa.
        </p>
      </div>

      {products.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          No hay productos disponibles en este momento.
        </div>
      )}

      {categories.map(category => (
        <section key={category} className="mb-16">
          <h2 className="text-3xl font-bold font-outfit mb-8 pb-2 border-b border-white/10 flex items-center">
            {category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.filter(p => p.category === category).map(product => (
              <div key={product.id} className="glass-panel rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                <div className="relative h-48 w-full bg-slate-800 overflow-hidden">
                  {product.image_url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">Sin imagen</div>
                  )}
                  <div className="absolute top-3 right-3 bg-red-500 text-white font-bold py-1 px-3 rounded-full shadow-lg">
                    ${product.price}
                  </div>
                </div>
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{product.description}</p>
                  </div>
                  <AddToCartButton product={{ id: product.id, name: product.name, price: product.price }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
