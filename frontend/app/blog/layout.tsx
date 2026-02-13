import { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        default: 'Blog | Mentha',
        template: '%s | Blog Mentha',
    },
    description: 'Insights, estrategias y guías para la nueva era de la Optimización para Motores de Respuesta (AEO). Aprende a dominar tu visibilidad en ChatGPT, Claude, Perplexity y Gemini.',
    keywords: ['AEO', 'Answer Engine Optimization', 'SEO', 'ChatGPT', 'Claude', 'Perplexity', 'Gemini', 'AI Search', 'Visibilidad IA'],
    openGraph: {
        title: 'Blog | Mentha',
        description: 'Insights y guías para la nueva era de la Optimización para Motores de Respuesta (AEO).',
        type: 'website',
        siteName: 'Mentha',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Blog | Mentha',
        description: 'Insights y guías para la nueva era de AEO.',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
