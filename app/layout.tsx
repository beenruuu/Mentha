import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ThemeScript } from '@/components/theme-script'
import { CommandPalette } from '@/components/command-palette'
import { DemoBanner } from '@/components/demo-banner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mentha - AI Engine Optimization Platform',
  description: 'Optimiza tu visibilidad en motores de IA como ChatGPT, Claude, Perplexity y Gemini. Análisis AEO completo para mejorar tu presencia digital.',
  generator: 'Mentha',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeScript />
        <DemoBanner />
        <CommandPalette />
        {children}
        <Analytics />
      </body>
    </html>
  )
}


