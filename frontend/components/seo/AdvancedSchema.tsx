import Script from 'next/script';

export function AdvancedSchema() {
    const schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": "https://mentha.ai/#organization",
                "name": "Mentha",
                "url": "https://mentha.ai",
                "logo": "https://mentha.ai/logo.png",
                "sameAs": [
                    "https://twitter.com/mentha_ai",
                    "https://github.com/mentha-ai"
                ],
                "description": "The first AEO (Answer Engine Optimization) platform for the generative AI era."
            },
            {
                "@type": "SoftwareApplication",
                "@id": "https://mentha.ai/#software",
                "name": "Mentha Platform",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Cloud",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                    "description": "Starter plan for AI visibility tracking"
                },
                "publisher": {
                    "@id": "https://mentha.ai/#organization"
                },
                "description": "A platform to analyze and optimize brand visibility across ChatGPT, Claude, Perplexity, and Gemini."
            },
            {
                "@type": "WebSite",
                "@id": "https://mentha.ai/#website",
                "url": "https://mentha.ai",
                "name": "Mentha",
                "publisher": {
                    "@id": "https://mentha.ai/#organization"
                }
            }
        ]
    };

    return (
        <Script
            id="aeo-schema-graph"
            type="application/ld+json"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(schema)
            }}
        />
    );
}
