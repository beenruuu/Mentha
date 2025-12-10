import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ThemeScript } from '@/components/shared/theme-script'
import { ThemeInit } from '@/components/shared/theme-init'
import { LanguageInit } from '@/components/shared/language-init'
import { CommandPalette } from '@/components/shared/command-palette'

import { CookieConsent } from '@/components/shared/cookie-consent'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'
import { RootProvider } from '@/components/layout/root-provider'

export const metadata: Metadata = {
  title: 'Mentha - AI Engine Optimization Platform',
  description: 'Optimiza tu visibilidad en motores de IA como ChatGPT, Claude, Perplexity y Gemini. Análisis AEO completo para mejorar tu presencia digital.',
  generator: 'Mentha',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Mentha — AI Engine Optimization',
    description: 'Controla y mejora tu presencia en motores de IA como ChatGPT, Claude y Gemini. Análisis y recomendaciones AEO.',
    url: 'https://mentha.ai',
    siteName: 'Mentha',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Mentha — AI Engine Optimization'
      }
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mentha — AI Engine Optimization',
    description: 'Optimiza tu visibilidad en motores de IA como ChatGPT y Claude.',
    images: ['/og-image.svg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`min-h-screen bg-black antialiased font-sans ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
        <LanguageInit />
        <ThemeInit />

        <RootProvider>
          <CommandPalette />
          {children}
          <CookieConsent />
          <Toaster position="top-right" expand={true} richColors />
          <Analytics />
        </RootProvider>
      </body>
    </html>
  )
}


