import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
    title: "Mentha | The Open-Source AEO Analytics Platform",
    description: "Master Answer Engine Optimization (AEO) with Mentha. Understand your brand's visibility in AI-generated answers, LLMs, and the future of search.",
    keywords: ["AEO", "Answer Engine Optimization", "SEO", "AI Search", "LLM Optimization", "Search Intelligence", "Open Source Analytics"],
    openGraph: {
        title: "Mentha | Open-Source AEO Analytics",
        description: "The platform for tracking and optimizing your presence in the age of AI search.",
        url: "https://mentha.ai", // Placeholder, change to real domain if known
        siteName: "Mentha",
        images: [
            {
                url: "/pexels-codioful-7134995.jpg", // Using existing image as preview for now
                width: 1200,
                height: 630,
                alt: "Mentha AEO Analytics Dashboard Preview",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Mentha | AEO Intelligence",
        description: "Optimize your brand for AI-generated answers.",
        images: ["/pexels-codioful-7134995.jpg"],
    },
    robots: {
        index: true,
        follow: true,
    }
};

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={GeistSans.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
