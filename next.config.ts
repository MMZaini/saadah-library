import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Serve the app under /read so all routes are prefixed (e.g. /read/al-kafi)
  basePath: '/read',
  // Expose basePath to client code for manual uses (fetch, share links, etc.)
  env: { NEXT_PUBLIC_BASE_PATH: '/read' },
  images: {
    // Covers are bundled locally and served unoptimized, so no remote image
    // hosts are needed.
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
  // Narrator APIs read local JSON from data/ rather than public/. Include the
  // one-time dataset in traced server bundles so deployment does not depend on
  // static public assets.
  outputFileTracingIncludes: {
    '/api/narrators/[id]': ['./data/rijal/khoei/**/*'],
    '/api/narrators/search': ['./data/rijal/khoei/**/*'],
  },
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
      // Fallback for the bare /scans entry point. In production an edge rewrite
      // (vercel.json) serves /read/scans at /scans and keeps the clean URL, so
      // this redirect never fires there. Locally (next dev/start) there is no
      // edge layer and Next's basePath gate blocks internal cross-basePath
      // rewrites, so /scans can only redirect to the real route — this keeps the
      // /scans link working in local dev instead of 404ing.
      {
        source: '/scans',
        destination: '/read/scans',
        permanent: false,
        basePath: false as const,
      },
      {
        source: '/scans/:path*',
        destination: '/read/scans/:path*',
        permanent: false,
        basePath: false as const,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/data/thaqalayn/current/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
        ],
      },
      {
        source: '/data/thaqalayn/:version/runtime/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
  // Run ESLint during `next build`, scoped to the same dirs as `yarn lint`.
  // Builds fail on lint errors (warnings are still allowed through).
  eslint: {
    dirs: ['app', 'components', 'lib'],
  },
}

export default nextConfig
