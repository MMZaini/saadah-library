import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Serve the app under /read so all routes are prefixed (e.g. /read/al-kafi)
  basePath: '/read',
  // Expose basePath to client code for manual uses (fetch, share links, etc.)
  env: { NEXT_PUBLIC_BASE_PATH: '/read' },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'thaqalayn.net' },
    ],
    // Allow larger image sizes for better quality
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 640, 750, 828, 1080, 1200],
    // Declare all quality values used by <Image> components (required from Next.js 16)
    qualities: [75, 95],
    // Always disable Next.js image optimizer to prevent upstream timeouts and reduce usage
    unoptimized: true,
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['clsx'],
  },
  // Enable gzip compression
  compress: true,
  // Power off source maps in production for better performance
  productionBrowserSourceMaps: false,
  // Development optimizations
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),
  // Redirect bare domain to /read
  async redirects() {
    return [
      {
        source: '/',
        destination: '/read',
        permanent: true,
        basePath: false as const,
      },
    ]
  },
  // Allow builds to succeed even if ESLint reports problems (repo contains many lint issues)
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
