import './globals.css'
import { Inter } from 'next/font/google'
import ClientProviders from '@/components/ClientProviders'
import TopBar from '@/components/TopBar'
import SettingsSidebar from '@/components/SettingsSidebar'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
})




export const metadata = {
  title: 'مكتبة السعادة',
  description: 'Comprehensive Shia Library – UI recreation',
  // Performance and SEO improvements
  robots: {
    index: true,
    follow: true,
  },
  // Preload critical resources
  other: {
    'X-UA-Compatible': 'IE=edge',
  }
}

// Next 14+ requires viewport to be exported separately using the `viewport` export
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable}`} data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.thaqalayn-api.net" />
        <link rel="dns-prefetch" href="https://thaqalayn.net" />
        {/*
          Inline sanitizer script: remove known dev/preview injected classes that may be
          added by editor preview tools or extensions (for example: vsc-domain-localhost,
          vsc-initialized). Running this before React hydration prevents hydration
          mismatch errors caused by external tooling injecting classes onto <body> or <html>.

          This intentionally only strips classes matching the /^vsc-/ prefix or the
          exact 'vsc-initialized' token to avoid removing legitimate classes.
        */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var strip=/^vsc-/;var also='vsc-initialized';var elm=document.documentElement;var body=document.body;function clean(node){if(!node||!node.className) return;var list=Array.from(node.className.split(/\s+/));for(var i=0;i<list.length;i++){var c=list[i];if(!c) continue;if(strip.test(c)||c===also){node.classList.remove(c)}}}clean(elm);clean(body);}catch(e){} })();` }} />
      </head>
      <body>
        <ClientProviders>
          <div className="antialiased duration-200 min-h-screen flex flex-col bg-color">
            <SettingsSidebar />
            <TopBar />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </ClientProviders>
      </body>
    </html>
  )
}
