import type { Metadata } from 'next'
import { Inter, Outfit, Playfair_Display, Oswald, Courier_Prime } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif', display: 'swap' })
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald', display: 'swap' })
const courierPrime = Courier_Prime({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-courier', display: 'swap' })

export const metadata: Metadata = {
  title: 'ComandApp | El Sistema Gastronómico Hecho en Casa',
  description: 'ComandApp: Sistema integral de gestión, comandas de cocina en vivo y e-commerce para rotiserías, casas de comida y locales gastronómicos.',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon',
  },
  metadataBase: new URL('https://comandapp.com'),
  other: {
    'theme-color': '#151210',
    'msapplication-TileColor': '#d34e2c',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${outfit.variable} ${playfair.variable} ${oswald.variable} ${courierPrime.variable} font-sans antialiased min-h-screen flex flex-col bg-[#151210] text-[#fcf9f5]`}>
        {children}
      </body>
    </html>
  )
}

