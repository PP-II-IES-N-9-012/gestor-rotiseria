import { supabase } from '@/lib/supabase'
import AddToCartButton from './components/AddToCartButton'

export const revalidate = 0

// Mock data as fallback
const mockProducts = [
  { id: '1', code: 'EMP-CAR', name: 'Empanada de Carne', description: 'Carne cortada a cuchillo con cebolla, huevo duro y aceitunas.', price: 1500, category: 'Empanadas', image_url: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?q=80&w=600&auto=format&fit=crop' },
  { id: '2', code: 'EMP-JYQ', name: 'Empanada de Jamón y Queso', description: 'Clásica con abundante jamón y queso muzzarella.', price: 1400, category: 'Empanadas', image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=600&auto=format&fit=crop' },
  { id: '3', code: 'PIZ-MUZ', name: 'Pizza Muzzarella', description: 'Salsa de tomate, queso muzzarella, orégano y aceitunas.', price: 8500, category: 'Pizzas', image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=600&auto=format&fit=crop' },
  { id: '4', code: 'MIN-MIL', name: 'Milanesa con Papas Fritas', description: 'Milanesa de ternera acompañada de papas fritas crujientes.', price: 9500, category: 'Minutas', image_url: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=600&auto=format&fit=crop' }
]

export default async function CatalogPage() {
  let products = mockProducts
  try {
    const { data } = await supabase.from('products').select('*').eq('is_available', true)
    if (data && data.length > 0) products = data
  } catch (error) {
    console.warn("Using mock data as Supabase is not configured yet.")
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
