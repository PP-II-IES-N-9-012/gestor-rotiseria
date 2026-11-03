import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Next 16 bloquea en dev los assets/HMR pedidos desde otro origen. Cada
  // subdominio (ej: trippburger.localhost:3000) cuenta como origen distinto,
  // sin esto la página carga sin JS y "no funciona".
  allowedDevOrigins: ['*.localhost', 'localhost'],
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/icon.svg',
      },
    ];
  },
};

export default nextConfig;
