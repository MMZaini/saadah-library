import './globals.css'
import { Inter, Lora, Merriweather } from 'next/font/google'
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
      className={`${inter.variable} ${lora.variable} ${merriweather.variable}`}
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.thaqalayn-api.net" />
        <link rel="dns-prefetch" href="https://thaqalayn.net" />
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
