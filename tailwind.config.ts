import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: '#0b0b0b',
        card: '#101012',
        muted: '#9ca3af',
        accent: {
          gold1: '#facc15',
          gold2: '#f59e0b',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,.45)',
        glow: '0 10px 30px rgba(245, 158, 11, .35)',
        book: '0 12px 40px rgba(0,0,0,.55)',
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        arabic: ['Amiri', 'Noto Sans Arabic', 'serif', 'Inter'],
      },
    },
  },
  plugins: [],
} satisfies Config
