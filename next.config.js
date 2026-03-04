/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  /* Оптимизация для работы на Timeweb теперь не является основной, Vercel handle-ит это автоматически */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Отключаем проверку типов и линтинг при сборке для ускорения деплоя на слабых VPS
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
