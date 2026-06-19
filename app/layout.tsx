import './globals.css'
import { Inter, Lora, Merriweather, Noto_Sans_Arabic, Space_Mono } from 'next/font/google'
import ClientProviders from '@/components/ClientProviders'
import TopBar from '@/components/TopBar'
import SettingsSidebar from '@/components/SettingsSidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import favicon from './favicon.ico'

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
  description: 'Comprehensive Shia Library – UI recreation',
  robots: { index: true, follow: true },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${lora.variable} ${merriweather.variable} ${notoSansArabic.variable} ${spaceMono.variable}`}
      data-motion="full"
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href={favicon.src} />
        <link
          rel="preload"
          href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/fonts/UthmanicHafs1Ver18.woff2`}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ClientProviders>
          <TooltipProvider delayDuration={300}>
            <div className="flex min-h-screen flex-col">
              <TopBar />
              <main className="flex-1">{children}</main>
              <SettingsSidebar />
            </div>
          </TooltipProvider>
        </ClientProviders>
      </body>
    </html>
  )
}
