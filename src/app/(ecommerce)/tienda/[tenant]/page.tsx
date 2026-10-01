import { getProducts, getRestaurant } from '@/lib/api'
import AddToCartButton from '../../components/AddToCartButton'
import { Flame, Clock, Heart, Award, Sparkles, MapPin, Phone } from 'lucide-react'

export const revalidate = 0

export default async function TenantTiendaPage({ 
  params 
}: { 
  params: Promise<{ tenant: string }> 
}) {
  const { tenant } = await params
  const restaurant = await getRestaurant(tenant)
  const products = await getProducts(restaurant.id)

  const categories = Array.from(new Set(products.map(p => p.category)))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Rustic Restaurant Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-14 border border-[#4d3a2c] bg-gradient-to-r from-[#2a1a13] via-[#1f1612] to-[#17120e] p-8 md:p-12 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(#e59324_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="max-w-2xl text-center md:text-left">
            <div className="badge-rustic mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#e59324]" />
              <span>Tienda Oficial • {restaurant.subdomain}.comandapp.com</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold font-rustic text-[#fcf9f5] mb-4 leading-tight">
              {restaurant.name}
            </h1>
            
            <p className="text-lg text-[#d1bea9] mb-6 leading-relaxed">
              {restaurant.description || 'Comida recién hecha a mano, respetando los tiempos y el amor de la cocina tradicional. Pide online y recíbelo humeante en tu casa.'}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-[#b89b82]">
              {restaurant.address && (
                <span className="flex items-center gap-1.5 bg-[#2b211a] px-3 py-1.5 rounded-lg border border-[#44372e]">
                  <MapPin className="w-3.5 h-3.5 text-[#e59324]" />
                  {restaurant.address}
                </span>
              )}
              {restaurant.phone && (
                <span className="flex items-center gap-1.5 bg-[#2b211a] px-3 py-1.5 rounded-lg border border-[#44372e]">
                  <Phone className="w-3.5 h-3.5 text-[#e59324]" />
                  {restaurant.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5 bg-[#2b211a] px-3 py-1.5 rounded-lg border border-[#44372e]">
                <Clock className="w-3.5 h-3.5 text-[#16a34a]" />
                Demora estimada: 35-45 min
              </span>
            </div>
          </div>

          {/* Rustic Highlights Box */}
          <div className="w-full md:w-auto bg-[#1a1410]/80 border border-[#e59324]/20 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col gap-4 text-sm text-[#e6d3c0]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#3b2419] text-[#e59324]">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-white">Horno a Leña & Fuego</p>
                <p className="text-xs text-[#a88a70]">Cocción lenta para más sabor</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#3b2419] text-[#e59324]">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-white">100% Casero</p>
                <p className="text-xs text-[#a88a70]">Sin conservantes industriales</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#3b2419] text-[#e59324]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-white">Atención Directa</p>
                <p className="text-xs text-[#a88a70]">Sin intermediarios ni sobreprecios</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Catalog Categories */}
      {categories.length === 0 && (
        <div className="text-center text-[#ab9079] py-16">
          <p className="text-xl font-rustic">El horno está preparándose para hoy...</p>
          <p className="text-sm mt-2">No hay platos disponibles en este momento.</p>
        </div>
      )}

      {categories.map(category => (
        <section key={category} className="mb-16">
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#3d2e23]">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e59324]"></span>
              <h2 className="text-2xl md:text-3xl font-bold font-rustic text-[#fcf9f5]">
                {category}
              </h2>
            </div>
            <span className="text-xs text-[#a88a70] bg-[#241c16] px-3 py-1 rounded-full border border-[#3d2e23]">
              {products.filter(p => p.category === category).length} especialidades
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.filter(p => p.category === category).map(product => (
              <div 
                key={product.id} 
                className="bg-[#1f1814] border border-[#3d2f25] hover:border-[#e59324]/40 rounded-2xl overflow-hidden hover:-translate-y-1.5 transition-all duration-300 flex flex-col group shadow-lg"
              >
                {/* Image & Price */}
                <div className="relative h-52 w-full bg-[#181310] overflow-hidden">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-95 group-hover:brightness-100" 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[#7a6452] font-medium text-sm">
                      Foto en preparación
                    </div>
                  )}
                  
                  {/* Rustic Price Tag */}
                  <div className="absolute top-3 right-3 bg-[#151210]/90 backdrop-blur-sm border border-[#e59324]/40 text-[#fcf9f5] font-bold py-1.5 px-3 rounded-xl shadow-lg flex items-center gap-1">
                    <span className="text-xs text-[#e59324]">$</span>
                    <span className="text-lg font-rustic">{Number(product.price).toLocaleString()}</span>
                  </div>

                  {/* Artisanal Badge */}
                  <div className="absolute bottom-3 left-3 bg-[#1e1713]/85 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 text-[11px] text-[#fad4a7] font-medium">
                    Receta Casera
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold font-rustic text-[#fcf9f5] mb-2 group-hover:text-[#e59324] transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-[#b89e89] line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#31251e]">
                    <AddToCartButton product={{ id: product.id, name: product.name, price: Number(product.price) }} />
                  </div>
                </div>

              </div>
            ))}
          </div>
        </section>
      ))}

    </div>
  )
}
