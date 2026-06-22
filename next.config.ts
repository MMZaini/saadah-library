import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The library stays canonical under /read through middleware rewrites while
  // selected tools (narrators, scans) remain root-level routes.
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
  // The /api/scan-page route rasterizes PDF pages with the native @napi-rs/canvas
  // binding and the pdf.js legacy build. Keep them out of the bundler so the
  // native .node addon is required at runtime (and traced into the function)
  // rather than (incorrectly) bundled.
  serverExternalPackages: ['@napi-rs/canvas', 'pdfjs-dist'],
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
    // The scan-page rasterizer reads the pdf.js wasm/cmap/font decoders from disk
    // (file:// — see scan-raster). Small (~5MB); the big PDFs stay static and are
    // fetched at runtime, never bundled. We must ALSO force-include pdf.js's worker
    // build: in Node, pdf.js loads `pdf.worker.mjs` via a dynamic import that nft
    // can't follow, so it ships missing and every render throws "Cannot find module
    // …pdf.worker.mjs" on Vercel (it only "works" locally because node_modules is
    // present). `serverExternalPackages` keeps pdfjs unbundled, so trace it here.
    '/api/scan-page': [
      './public/pdf/**/*',
      './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
      './node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs',
    ],
  },
  // Development optimizations
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),
  // Redirect the bare domain to the main library. Middleware owns the /read
  // namespace and legacy tool redirects so the routes work in local Next too.
  async redirects() {
    return [
      {
        source: '/',
        destination: '/read',
        permanent: true,
        basePath: false as const,
      },
      {
        source: '/read/narrators',
        destination: '/narrators',
        permanent: true,
        basePath: false as const,
      },
      {
        source: '/read/narrators/:path*',
        destination: '/narrators/:path*',
        permanent: true,
        basePath: false as const,
      },
      {
        source: '/read/scans',
        destination: '/scans',
        permanent: true,
        basePath: false as const,
      },
      {
        source: '/read/scans/:path*',
        destination: '/scans/:path*',
        permanent: true,
        basePath: false as const,
      },
      {
        source: '/read/bookmarks',
        destination: '/bookmarks',
        permanent: true,
        basePath: false as const,
      },
      {
        source: '/read/bookmarks/:path*',
        destination: '/bookmarks/:path*',
        permanent: true,
        basePath: false as const,
      },
      {
        source: '/reads/scans',
        destination: '/scans',
        permanent: true,
        basePath: false as const,
      },
      {
        source: '/reads/scans/:path*',
        destination: '/scans/:path*',
        permanent: true,
        basePath: false as const,
      },
      {
        source: '/reads/bookmarks',
        destination: '/bookmarks',
        permanent: true,
        basePath: false as const,
      },
      {
        source: '/reads/bookmarks/:path*',
        destination: '/bookmarks/:path*',
        permanent: true,
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
