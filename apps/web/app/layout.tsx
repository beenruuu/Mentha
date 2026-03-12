import './globals.css';

import type { Metadata } from 'next';

import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
    title: 'Mentha | AEO & GEO Agency',
    description:
        "Master Answer Engine Optimization (AEO) with Mentha. Understand your brand's visibility in AI-generated answers, LLMs, and the future of search.",
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
        url: 'https://mentha.ai', // Placeholder, change to real domain if known
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
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="font-sans">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem={false}
                    storageKey="mentha_theme"
                >
                    <div className="min-h-screen bg-mentha-beige text-mentha-forest transition-colors duration-500 ease-in-out dark:bg-mentha-dark dark:text-mentha-beige">
                        {children}
                    </div>
                    <div className="bg-noise" />
                </ThemeProvider>
            </body>
        </html>
    );
}
