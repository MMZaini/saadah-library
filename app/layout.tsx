import './globals.css'
import { Inter, Lora, Merriweather, Noto_Sans_Arabic, Space_Mono } from 'next/font/google'
import ClientProviders from '@/components/ClientProviders'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import SettingsSidebar from '@/components/SettingsSidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import favicon from './favicon.ico'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
})

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
})

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-merriweather',
  display: 'swap',
})

// Self-hosted (build-time) instead of a runtime Google Fonts request, keeping
// the app free of external calls. Noto Sans Arabic is the fallback for glyphs
// the primary Uthman Taha face excludes; Space Mono is used in a few UI spots.
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-arabic',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
})

export const metadata = {
  title: 'Saadah Library',
  description: 'Saadah Library - The Comprehensive Shia Library',
  robots: { index: true, follow: true },
  other: {
    google: 'notranslate',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0b0b0b',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      translate="no"
      className={`notranslate ${inter.variable} ${lora.variable} ${merriweather.variable} ${notoSansArabic.variable} ${spaceMono.variable}`}
      data-motion="full"
      suppressHydrationWarning
    >
      <head>
        <meta name="google" content="notranslate" />
        <meta httpEquiv="Content-Language" content="en" />
        <link rel="icon" href={favicon.src} />
        <link
          rel="preload"
          href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/fonts/UthmanicHafs1Ver18.woff2`}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="notranslate font-sans antialiased" suppressHydrationWarning>
        <ClientProviders>
          <TooltipProvider delayDuration={300}>
            <div className="flex min-h-screen flex-col">
              <TopBar />
              <main className="flex-1">{children}</main>
              <BottomNav />
              <SettingsSidebar />
            </div>
          </TooltipProvider>
        </ClientProviders>
        <SpeedInsights />
      </body>
    </html>
  )
}
