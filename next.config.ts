/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'thaqalayn.net' }
    ]
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['clsx'],
  },
  // Enable gzip compression
  compress: true,
  // Power off source maps in production for better performance
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
