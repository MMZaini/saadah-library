import './globals.css'
import { Inter } from 'next/font/google'
import ClientProviders from '@/components/ClientProviders'
import TopBar from '@/components/TopBar'
import SettingsSidebar from '@/components/SettingsSidebar'
import favicon from './favicon.ico'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
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
  },
}

// Next 14+ requires viewport to be exported separately using the `viewport` export
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href={favicon.src} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.thaqalayn-api.net" />
        <link rel="dns-prefetch" href="https://thaqalayn.net" />
      </head>
      <body suppressHydrationWarning>
        {/* Clean up VS Code injected classes immediately */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function(){
            try {
              function cleanVSCodeClasses() {
                var body = document.body;
                var html = document.documentElement;
                if (body && body.className) {
                  body.className = body.className.replace(/\\bvsc-[^\\s]*\\b/g, '').replace(/\\bvsc-initialized\\b/g, '').trim();
                }
                if (html && html.className) {
                  html.className = html.className.replace(/\\bvsc-[^\\s]*\\b/g, '').replace(/\\bvsc-initialized\\b/g, '').trim();
                }
              }
              // Clean immediately
              cleanVSCodeClasses();
              // Clean after a short delay in case classes are added asynchronously
              setTimeout(cleanVSCodeClasses, 0);
              setTimeout(cleanVSCodeClasses, 100);
            } catch(e) {}
          })();
        `,
          }}
        />
        <ClientProviders>
          <div className="bg-color flex min-h-screen flex-col antialiased duration-200">
            <SettingsSidebar />
            <TopBar />
            <main className="flex-1">{children}</main>
          </div>
        </ClientProviders>
      </body>
    </html>
  )
}
