import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ThemeScript } from '@/components/theme-script'
import { CommandPalette } from '@/components/command-palette'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mentha',
  description: 'Analiza la visibilidad de marcas en motores de IA y asistentes conversacionales.',
  generator: 'Mentha',
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
        <CommandPalette />
        {children}
        <Analytics />
      </body>
    </html>
  )
}


