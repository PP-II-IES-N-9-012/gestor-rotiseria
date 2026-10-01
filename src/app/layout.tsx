import type { Metadata } from 'next'
import { Inter, Outfit, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' })

export const metadata: Metadata = {
  title: 'ComandApp | El Sistema Gastronómico Hecho en Casa',
  description: 'ComandApp: Sistema integral de gestión, comandas de cocina en vivo y e-commerce para rotiserías, casas de comida y locales gastronómicos.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${outfit.variable} ${playfair.variable} font-sans antialiased min-h-screen flex flex-col bg-[#151210] text-[#fcf9f5]`}>
        {children}
      </body>
    </html>
  )
}

