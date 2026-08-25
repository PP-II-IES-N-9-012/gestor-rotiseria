'use client'

import { useState } from 'react'
import { Save, Store, Globe, MapPin, Phone, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // This would typically come from the database (restaurants table)
  const [formData, setFormData] = useState({
    name: 'Rotisería Central',
    subdomain: 'central',
    address: 'Av. Corrientes 1234, Buenos Aires',
    phone: '+54 11 1234-5678',
    description: 'Comida casera de calidad.'
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    
    // Simulate API call to save to 'restaurants' and 'profiles'
    setTimeout(() => {
      setLoading(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 1000)
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-outfit text-white">Configuración del Local</h1>
        <p className="text-gray-400 mt-1">Administra los detalles públicos y preferencias de tu rotisería.</p>
      </div>

      <div className="glass-panel rounded-2xl p-8">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Store className="w-4 h-4 text-red-500" />
                Nombre del Local
              </label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-red-500" />
                Subdominio Público
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.subdomain}
                  onChange={e => setFormData({...formData, subdomain: e.target.value})}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-4 pr-32 py-3 focus:outline-none focus:border-red-500 transition-colors"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm">
                  .tu-dominio.com
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-500" />
                Teléfono de Contacto
              </label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" />
                Dirección
              </label>
              <input 
                type="text" 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Descripción Breve
            </label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors resize-none"
            />
          </div>

          <div className="pt-6 border-t border-white/5 flex justify-end items-center gap-4">
            {saved && (
              <span className="text-emerald-400 text-sm animate-in fade-in">
                ¡Cambios guardados exitosamente!
              </span>
            )}
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary py-3 px-8 flex items-center justify-center gap-2 min-w-[200px]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" /> Guardar Cambios
                </>
              )}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  )
}
