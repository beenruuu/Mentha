import './globals.css';

import type { Metadata } from 'next';
import { Instrument_Serif, Inter, Space_Mono } from 'next/font/google';
import Script from 'next/script';

import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeSync } from '@/components/ThemeSync';

const instrumentSerif = Instrument_Serif({
    weight: ['400'],
    style: ['normal', 'italic'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-instrument-serif',
});

const inter = Inter({
    weight: ['300', '400', '500', '600'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

const spaceMono = Space_Mono({
    weight: ['400', '700'],
    style: ['normal', 'italic'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-space-mono',
});

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: 'Mentha | AEO & GEO Agency',
    description:
        "Master Answer Engine Optimization (AEO) with Mentha. Understand your brand's visibility in AI-generated answers, LLMs, and the future of search.",
    icons: {
        icon: '/favicon.svg',
    },
    keywords: [
        'AEO',
        'Answer Engine Optimization',
        'SEO',
        'AI Search',
        'LLM Optimization',
        'Search Intelligence',
        'Open Source Analytics',
    ],
    openGraph: {
        title: 'Mentha | AEO & GEO Agency',
        description:
            'The platform for tracking and optimizing your presence in the age of AI search.',
        url: 'https://mentha.ai',
        siteName: 'Mentha',
        images: [
            {
                url: '/pexels-codioful-7134995.jpg',
                width: 1200,
                height: 630,
                alt: 'Mentha AEO Analytics Dashboard Preview',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Mentha | AEO Intelligence',
        description: 'Optimize your brand for AI-generated answers.',
        images: ['/pexels-codioful-7134995.jpg'],
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {process.env.NODE_ENV === 'development' && (
                    <Script
                        src="https://unpkg.com/react-scan/dist/auto.global.js"
                        strategy="lazyOnload"
                    />
                )}
            </head>
            <body
                className={`${instrumentSerif.variable} ${inter.variable} ${spaceMono.variable} font-sans`}
                suppressHydrationWarning
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem={false}
                    storageKey="mentha_theme"
                    disableTransitionOnChange={false}
                    forcedTheme={undefined}
                >
                    <ThemeSync>
                        <div className="min-h-screen bg-mentha-beige text-mentha-forest dark:bg-mentha-dark dark:text-mentha-beige transition-colors duration-300">
                            {children}
                        </div>
                        <div className="bg-noise" />
                    </ThemeSync>
                </ThemeProvider>
            </body>
        </html>
    );
}
