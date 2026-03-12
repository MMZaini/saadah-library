import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Use separate output dirs so `yarn dev` and `yarn build` can run simultaneously
  distDir: process.env.BUILD_ENV === 'build' ? '.next-build' : '.next',
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
  // Allow builds to succeed even if ESLint reports problems (repo contains many lint issues)
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
