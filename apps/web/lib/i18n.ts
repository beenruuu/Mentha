'use client';

import React, { createContext, use, useCallback, useEffect, useState } from 'react';

const en = {
    // Hero
    heroTag: "[ Est. 2026 — Europe's First AEO Firm ]",
    heroTitle: 'Traditional SEO is',
    heroTitleDead: 'dead',
    heroTitleSuffix: '. Your audience now',
    heroTitleHighlight: 'asks AI.',
    heroDescription:
        "We optimize your brand's presence for ChatGPT, Perplexity, Gemini, and Claude. Stop chasing clicks, start owning the answer.",
    heroScroll: 'SCROLL TO DISCOVER',

    // FAQ
    faqTitle: 'Frequently Asked Questions.',
    faqSubtitle: 'Understanding the paradigm shift is not easy. Here we simplify it.',
    faqQ1: 'Does this replace my current SEO strategy?',
    faqA1: 'No, it complements it. SEO captures existing demand on Google. AEO/GEO captures conversational intent on ChatGPT and Perplexity. You need both to survive the transition.',
    faqQ2: 'Which models do you optimize for?',
    faqA2: 'We currently cover OpenAI (GPT-4o), Google (Gemini 1.5 Pro/Flash), Anthropic (Claude 3.5 Sonnet), and Perplexity AI. We constantly monitor new players like Mistral and Llama.',
    faqQ3: 'How long does it take to see results?',
    faqA3: 'Unlike traditional SEO (6-12 months), changes in LLM perception can be noticed in 4-8 weeks due to the frequency of re-training and dynamic context windows.',
    faqQ4: 'Is it ethical to manipulate AI responses?',
    faqA4: "We don't manipulate; we clarify. We help models understand the truth about your brand by reducing hallucinations and connecting structured data.",

    // Social Proof
    socialProofMentions: 'Increase in Brand Mentions on Perplexity',
    socialProofImpressions: 'Generated Organic Impressions via LLMs',

    // Services
    service1Title: 'LLM Brand Mapping',
    service1Desc:
        'We audit how you are perceived by GPT-4, Claude 3.5, and Gemini. We identify hallucinations and negative biases in real-time.',
    service1Metric: 'SENTIMENT ANALYSIS',
    service2Title: 'RAG Readiness',
    service2Desc:
        'We restructure your data (JSON-LD, Knowledge Graphs) to be easily ingested by Retrieval-Augmented Generation systems.',
    service2Metric: 'DATA STRUCTURE',
    service3Title: 'Citation Optimization',
    service3Desc:
        'We insert your brand into authority sources (Whitepapers, News, Wikis) that models use to substantiate their answers.',
    service3Metric: 'AUTHORITY SCORE',

    // Methodology
    methodologyTitle: 'The Mentha Protocol.',
    methodologyTag: '[ SYSTEM ARCHITECTURE ]',
    step1Title: 'Semantic Dissection',
    step1Desc:
        'We break down your brand into entities and attributes understandable by vector models.',
    step2Title: 'Context Injection',
    step2Desc:
        'We create layers of context in authoritative sources that LLMs already trust (Wikis, Papers).',
    step3Title: 'Prompt Engineering',
    step3Desc:
        'We simulate thousands of queries to adjust how the AI associates your product with user intent.',
    step4Title: 'Feedback Loop',
    step4Desc: 'Constant monitoring of hallucinations and readjustment of content strategy.',

    // The Shift
    shiftMarquee: 'FROM SEARCH TO ANSWER /// OPTIMIZE FOR INTENT',
    shiftTag: '[ 02 — Paradigm Shift ]',
    shiftTitle: 'The Age of the',
    shiftTitleHighlight: 'Answer.',
    shiftLegacyHeader: 'Search Engine (Legacy)',
    shiftLegacyDesc:
        '10 blue links. Fragmentation. The user manually searches, filters, and synthesizes.',
    shiftCurrentHeader: 'Answer Engine (Current)',
    shiftCurrentDesc:
        'A single answer. Synthesis. The AI processes authority and delivers the truth.',
    shiftMockQuestion: 'How is search different now?',
    shiftMockAnswer:
        'The Answer Engine marks a paradigm shift in search. Instead of presenting users with 10 blue links and fragmented information, it synthesizes authority and delivers a single, trusted answer. The AI processes vast sources, evaluates credibility, and provides direct responses—so users no longer need to manually search, filter, or synthesize. This transition empowers brands to optimize for intent and become the source of truth in the age of the Answer.',
    shiftMockPlaceholder: 'Ask me anything...',

    // Interactive Teaser
    teaserTitle: 'How does AI see you right now?',
    teaserDesc: 'Simulate a real-time GEO query using Gemini 1.5.',
    teaserBrandLabel: 'Your Brand',
    teaserCategoryLabel: 'Product / Category',
    teaserBtnLoading: 'ANALYZING NEURAL PATHS...',
    teaserBtnRun: 'RUN DIAGNOSTIC',
    teaserReportHeader: 'Audit Report:',
    teaserGeneratedVia: 'Generated via Gemini',
    teaserVisibilityScore: 'Visibility Score',
    teaserSentiment: 'Sentiment',
    teaserTopAssociation: 'Top Association',
    teaserSimulatedResponse: 'Simulated LLM Response',
    teaserStrategicRec: 'Strategic Recommendation',
    teaserMockSentiment: 'Neutral',
    teaserMockAssociation: 'Legacy Provider',
    teaserMockOutput:
        'While {brand} is known in the {category} space, it is rarely mentioned as a top-tier modern solution compared to its competitors.',
    teaserMockRec:
        'Focus on feature parity content and modernize the developer documentation to improve AI retrieval.',

    // Footer
    footerNewsletter: 'Newsletter',
    footerNewsletterTitle: 'Insights for the Generative Age.',
    footerEmailPlaceholder: 'Email Address',
    footerSubmit: 'SUBMIT',
    footerProduct: 'Product',
    footerSolutions: 'Solutions',
    footerResources: 'Resources',
    footerCompany: 'Company',
    footerVisibilityTracking: 'Visibility Tracking',
    footerPromptDiscovery: 'Prompt Discovery',
    footerInsights: 'Insights',
    footerSentimentAnalysis: 'Sentiment Analysis',
    footerMenthaMCP: 'Mentha MCP',
    footerSEOManagers: 'SEO Managers',
    footerInHouseMarketers: 'In-house Marketers',
    footerAgencies: 'Agencies',
    footerBlog: 'Blog',
    footerCustomers: 'Customers',
    footerFreeTool: 'Free Tool',
    footerKnowledgeBase: 'Knowledge Base',
    footerAPIDocs: 'API Documentation',
    footerMCPDocs: 'MCP Documentation',
    footerAboutUs: 'About Us',
    footerPrivacyPolicy: 'Privacy Policy',
    footerTermsOfService: 'Terms of Service',
    footerDataProtection: 'Data Protection',

    // Existing landing translations
    pricingTag: 'Pricing',
    pricingTitle: 'Simple, transparent',
    pricingTitleHighlight: 'pricing',
    pricingDescription: 'Choose the perfect plan for your business needs. No hidden fees.',
    pricingStarter: 'Starter',
    pricingStarterPrice: '$0',
    pricingStarterDescription: 'Perfect for individuals and small projects.',
    pricingStarterFeature1: 'Up to 3 projects',
    pricingStarterFeature2: 'Basic Analytics',
    pricingStarterFeature3: '24h Support',
    pricingStarterFeature4: 'Community Access',
    pricingStarterCTA: 'Get Started',
    pricingPro: 'Pro',
    pricingProPrice: '$29',
    pricingProDescription: 'Best for growing businesses and teams.',
    pricingProFeature1: 'Unlimited projects',
    pricingProFeature2: 'Advanced Analytics',
    pricingProFeature3: 'Priority Support',
    pricingProFeature4: 'Custom Reports',
    pricingProFeature5: 'API Access',
    pricingProFeature6: 'Team Collaboration',
    pricingProCTA: 'Start Free Trial',
    pricingEnterprise: 'Enterprise',
    pricingEnterprisePrice: 'Custom',
    pricingEnterpriseDescription: 'For large organizations with specific needs.',
    pricingEnterpriseFeature1: 'Unlimited Everything',
    pricingEnterpriseFeature2: 'Custom Solutions',
    pricingEnterpriseFeature3: '24/7 Dedicated Support',
    pricingEnterpriseFeature4: 'SLA Agreement',
    pricingEnterpriseFeature5: 'On-premise Deployment',
    pricingEnterpriseFeature6: 'Dedicated Account Manager',
    pricingEnterpriseCTA: 'Contact Sales',
    pricingMostPopular: 'Most Popular',
    pricingMonthly: 'Monthly',
    pricingAnnually: 'Yearly',
    pricingSave: 'Save 2 months',
    pricingProPriceMonthly: '$29',
    pricingProPriceAnnually: '$24',
    pricingUnit: '/mo',
    integrationsTag: 'Integrations',
    integrationGemini: "See how Google's Gemini presents your content to users.",
    integrationsTitle: 'Connect with the',
    integrationsTitleHighlight: 'AI Ecosystem',
    integrationsTitleSuffix: 'seamlessly.',
    integrationsDescription:
        'Mentha integrates with all major AI search engines and LLMs to track where your brand appears.',
    faqsTitle: 'Questions?',
    faqQuestion1: 'What is AEO vs SEO?',
    faqAnswer1:
        'Answer Engine Optimization (AEO) focuses on optimizing for direct answers provided by AI models like ChatGPT and Perplexity, whereas SEO focuses on ranking blue links on traditional search engines like Google.',
    faqQuestion2: 'How does Mentha track my brand?',
    faqAnswer2:
        'Mentha simulates user queries across multiple AI models in real-time to detect if, how, and when your brand is cited as a source or recommendation.',
    faqQuestion3: 'Do I need to install anything on my site?',
    faqAnswer3:
        'No. Mentha is an external analytics tool. We analyze the AI platforms directly, so there is no need to add scripts or code to your website.',
    faqQuestion4: 'Can I track my competitors?',
    faqAnswer4:
        'Yes. Mentha allows you to monitor how AI engines perceive your competitors compared to your brand, giving you a share-of-voice metric.',
    faqQuestion5: 'Is my data private?',
    faqAnswer5:
        'Absolutely. We do not share your project data. Our analysis is performed privately and securely.',
    ctaTitle: 'Ready to dominate the AI era?',
    ctaDescription:
        'Join thousands of forward-thinking marketers optimizing for the future of search.',
    ctaPrimary: 'Start Free Trial',
};

const es = {
    // Hero
    heroTag: '[ Est. 2026 — Primera Agencia de AEO en Europa ]',
    heroTitle: 'El SEO tradicional está',
    heroTitleDead: 'muerto',
    heroTitleSuffix: '. Tu audiencia ahora',
    heroTitleHighlight: 'pregunta a la IA.',
    heroDescription:
        'Optimizamos la presencia de tu marca para ChatGPT, Perplexity, Gemini y Claude. Deja de perseguir clics, empieza a ser la respuesta.',
    heroScroll: 'SCROLL PARA DESCUBRIR',

    // FAQ
    faqTitle: 'Preguntas Frecuentes.',
    faqSubtitle: 'Entender el cambio de paradigma no es fácil. Aquí lo simplificamos.',
    faqQ1: '¿Reemplaza esto mi estrategia actual de SEO?',
    faqA1: 'No, la complementa. El SEO captura la demanda existente en Google. El AEO/GEO captura la intención conversacional en ChatGPT y Perplexity. Necesitas ambos para sobrevivir a la transición.',
    faqQ2: '¿Para qué modelos optimizáis?',
    faqA2: 'Actualmente cubrimos OpenAI (GPT-4o), Google (Gemini 1.5 Pro/Flash), Anthropic (Claude 3.5 Sonnet) y Perplexity AI. Monitorizamos constantemente nuevos jugadores como Mistral y Llama.',
    faqQ3: '¿Cuánto tiempo se tarda en ver resultados?',
    faqA3: 'A diferencia del SEO tradicional (6-12 meses), los cambios en la percepción de los LLM se notan en 4-8 semanas debido a la frecuencia de re-entrenamiento y ventanas de contexto dinámicas.',
    faqQ4: '¿Es ético manipular las respuestas de la IA?',
    faqA4: 'No manipulamos; clarificamos. Ayudamos a los modelos a entender la verdad sobre tu marca reduciendo alucinaciones y conectando datos estructurados.',

    // Social Proof
    socialProofMentions: 'Aumento de Menciones de Marca en Perplexity',
    socialProofImpressions: 'Impresiones Orgánicas Generadas vía LLMs',

    // Services
    service1Title: 'Mapeo de Marca en LLM',
    service1Desc:
        'Auditamos cómo eres percibido por GPT-4, Claude 3.5 y Gemini. Identificamos alucinaciones y sesgos negativos en tiempo real.',
    service1Metric: 'ANÁLISIS DE SENTIMIENTO',
    service2Title: 'Preparación para RAG',
    service2Desc:
        'Reestructuramos tus datos (JSON-LD, Knowledge Graphs) para que sean fácilmente ingeridos por sistemas de Generación Aumentada por Recuperación.',
    service2Metric: 'ESTRUCTURA DE DATOS',
    service3Title: 'Optimización de Citaciones',
    service3Desc:
        'Insertamos tu marca en fuentes de autoridad (Whitepapers, Noticias, Wikis) que los modelos usan para fundamentar sus respuestas.',
    service3Metric: 'PUNTUACIÓN DE AUTORIDAD',

    // Methodology
    methodologyTitle: 'El Protocolo Mentha.',
    methodologyTag: '[ ARQUITECTURA DEL SISTEMA ]',
    step1Title: 'Disección Semántica',
    step1Desc:
        'Desglosamos tu marca en entidades y atributos comprensibles por modelos vectoriales.',
    step2Title: 'Inyección de Contexto',
    step2Desc:
        'Creamos capas de contexto en fuentes de autoridad en las que los LLMs ya confían (Wikis, Papers).',
    step3Title: 'Ingeniería de Prompts',
    step3Desc:
        'Simulamos miles de consultas para ajustar cómo la IA asocia tu producto con la intención del usuario.',
    step4Title: 'Bucle de Retroalimentación',
    step4Desc:
        'Monitorización constante de alucinaciones y reajuste de la estrategia de contenido.',

    // The Shift
    shiftMarquee: 'DE LA BÚSQUEDA A LA RESPUESTA /// OPTIMIZA PARA LA INTENCIÓN',
    shiftTag: '[ 02 — Cambio de Paradigma ]',
    shiftTitle: 'La Era de la',
    shiftTitleHighlight: 'Respuesta.',
    shiftLegacyHeader: 'Motor de Búsqueda (Legado)',
    shiftLegacyDesc:
        '10 enlaces azules. Fragmentación. El usuario busca, filtra y sintetiza manualmente.',
    shiftCurrentHeader: 'Motor de Respuesta (Actual)',
    shiftCurrentDesc:
        'Una única respuesta. Síntesis. La IA procesa la autoridad y entrega la verdad.',
    shiftMockQuestion: '¿En qué ha cambiado la búsqueda?',
    shiftMockAnswer:
        'El Motor de Respuesta marca un cambio de paradigma. En lugar de presentar 10 enlaces azules e información fragmentada, sintetiza la autoridad y entrega una respuesta única y confiable. La IA procesa fuentes vastas, evalúa la credibilidad y proporciona respuestas directas, eliminando la necesidad de buscar, filtrar o sintetizar manualmente. Esta transición permite a las marcas optimizar para la intención y convertirse en la fuente de verdad en la era de la Respuesta.',
    shiftMockPlaceholder: 'Pregúntame cualquier cosa...',

    // Interactive Teaser
    teaserTitle: '¿Cómo te ve la IA ahora mismo?',
    teaserDesc: 'Simula una consulta GEO en tiempo real usando Gemini 1.5.',
    teaserBrandLabel: 'Tu Marca',
    teaserCategoryLabel: 'Producto / Categoría',
    teaserBtnLoading: 'ANALIZANDO RUTAS NEURALES...',
    teaserBtnRun: 'EJECUTAR DIAGNÓSTICO',
    teaserReportHeader: 'Informe de Auditoría:',
    teaserGeneratedVia: 'Generado vía Gemini',
    teaserVisibilityScore: 'Puntuación de Visibilidad',
    teaserSentiment: 'Sentimiento',
    teaserTopAssociation: 'Asociación Principal',
    teaserSimulatedResponse: 'Respuesta LLM Simulada',
    teaserStrategicRec: 'Recomendación Estratégica',
    teaserMockSentiment: 'Neutral',
    teaserMockAssociation: 'Proveedor Legado',
    teaserMockOutput:
        'Aunque {brand} es conocida en el espacio de {category}, raramente es mencionada como una solución moderna de primer nivel en comparación con sus competidores.',
    teaserMockRec:
        'Céntrate en contenido de paridad de funciones y moderniza la documentación para desarrolladores para mejorar la recuperación por IA.',

    // Footer
    footerNewsletter: 'Newsletter',
    footerNewsletterTitle: 'Inteligencia para la Era Generativa.',
    footerEmailPlaceholder: 'Dirección de Email',
    footerSubmit: 'ENVIAR',
    footerProduct: 'Producto',
    footerSolutions: 'Soluciones',
    footerResources: 'Recursos',
    footerCompany: 'Compañía',
    footerVisibilityTracking: 'Seguimiento de Visibilidad',
    footerPromptDiscovery: 'Descubrimiento de Prompts',
    footerInsights: 'Insights',
    footerSentimentAnalysis: 'Análisis de Sentimiento',
    footerMenthaMCP: 'Mentha MCP',
    footerSEOManagers: 'Responsables de SEO',
    footerInHouseMarketers: 'Marketing Interno',
    footerAgencies: 'Agencias',
    footerBlog: 'Blog',
    footerCustomers: 'Clientes',
    footerFreeTool: 'Herramienta Gratuita',
    footerKnowledgeBase: 'Base de Conocimientos',
    footerAPIDocs: 'Documentación API',
    footerMCPDocs: 'Documentación MCP',
    footerAboutUs: 'Sobre Nosotros',
    footerPrivacyPolicy: 'Privacidad',
    footerTermsOfService: 'Condiciones',
    footerDataProtection: 'Protección de Datos',

    // Existing landing translations (Spanish)
    pricingTag: 'Precios',
    pricingTitle: 'Simple y transparente',
    pricingTitleHighlight: 'precios',
    pricingDescription: 'Elige el plan perfecto para tus necesidades. Sin cargos ocultos.',
    pricingStarter: 'Starter',
    pricingStarterPrice: '$0',
    pricingStarterDescription: 'Perfecto para individuos y pequeños proyectos.',
    pricingStarterFeature1: 'Hasta 3 proyectos',
    pricingStarterFeature2: 'Analítica Básica',
    pricingStarterFeature3: 'Soporte 24h',
    pricingStarterFeature4: 'Acceso a la Comunidad',
    pricingStarterCTA: 'Empezar ahora',
    pricingPro: 'Pro',
    pricingProPrice: '$29',
    pricingProDescription: 'Ideal para empresas y equipos en crecimiento.',
    pricingProFeature1: 'Proyectos ilimitados',
    pricingProFeature2: 'Analítica Avanzada',
    pricingProFeature3: 'Soporte Prioritario',
    pricingProFeature4: 'Informes Personalizados',
    pricingProFeature5: 'Acceso a la API',
    pricingProFeature6: 'Colaboración en Equipo',
    pricingProCTA: 'Prueba Gratuita',
    pricingEnterprise: 'Enterprise',
    pricingEnterprisePrice: 'Personalizado',
    pricingEnterpriseDescription: 'Para grandes organizaciones con necesidades específicas.',
    pricingEnterpriseFeature1: 'Todo ilimitado',
    pricingEnterpriseFeature2: 'Soluciones a medida',
    pricingEnterpriseFeature3: 'Soporte dedicado 24/7',
    pricingEnterpriseFeature4: 'Acuerdo de SLA',
    pricingEnterpriseFeature5: 'Despliegue On-premise',
    pricingEnterpriseFeature6: 'Account Manager dedicado',
    pricingEnterpriseCTA: 'Contactar Ventas',
    pricingMostPopular: 'Más Popular',
    pricingMonthly: 'Mensual',
    pricingAnnually: 'Anual',
    pricingSave: 'Ahorra 2 meses',
    pricingProPriceMonthly: '$29',
    pricingProPriceAnnually: '$24',
    pricingUnit: '/mes',
    integrationsTag: 'Integraciones',
    integrationGemini: 'Descubre cómo Gemini de Google presenta tu contenido.',
    integrationsTitle: 'Conéctate con el',
    integrationsTitleHighlight: 'Ecosistema AI',
    integrationsTitleSuffix: 'sin fricciones.',
    integrationsDescription:
        'Mentha se integra con los principales motores de búsqueda AI y LLMs para rastrear dónde aparece tu marca.',
    faqsTitle: '¿Preguntas?',
    faqQuestion1: '¿Qué es AEO vs SEO?',
    faqAnswer1:
        'Answer Engine Optimization (AEO) se enfoca en optimizar para respuestas directas de modelos IA como ChatGPT y Perplexity, mientras que el SEO se enfoca en el ranking de enlaces en buscadores tradicionales como Google.',
    faqQuestion2: '¿Cómo rastrea Mentha mi marca?',
    faqAnswer2:
        'Mentha simula consultas de usuario en múltiples modelos IA en tiempo real para detectar si tu marca es citada como fuente o recomendación.',
    faqQuestion3: '¿Necesito instalar algo en mi sitio?',
    faqAnswer3:
        'No. Mentha es una herramienta externa. Analizamos las plataformas IA directamente, sin necesidad de añadir código a tu web.',
    faqQuestion4: '¿Puedo rastrear a mis competidores?',
    faqAnswer4:
        'Sí. Mentha te permite monitorizar cómo perciben los motores IA a tus competidores frente a tu marca, dándote una métrica de Share of Voice.',
    faqQuestion5: '¿Son mis datos privados?',
    faqAnswer5:
        'Absolutamente. No compartimos los datos de tu proyecto. Nuestro análisis se realiza de forma privada y segura.',
    ctaTitle: '¿Listo para dominar la era AI?',
    ctaDescription:
        'Únete a miles de profesionales que ya optimizan para el futuro de la búsqueda.',
    ctaPrimary: 'Empezar Prueba Gratuita',
};

type Locale = 'en' | 'es';

interface I18nContextType {
    t: typeof en;
    locale: Locale;
    toggleLocale: (newLocale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Locale>('en');

    useEffect(() => {
        const savedLocale = localStorage.getItem('mentha-locale') as Locale;
        if (savedLocale && (savedLocale === 'en' || savedLocale === 'es')) {
            setLocale(savedLocale);
        }
    }, []);

    const toggleLocale = useCallback((newLocale: Locale) => {
        setLocale(newLocale);
        localStorage.setItem('mentha-locale', newLocale);
    }, []);

    const t = locale === 'es' ? es : en;

    return React.createElement(
        I18nContext.Provider,
        { value: { t, locale, toggleLocale } },
        children,
    );
}

export function useTranslations() {
    const context = use(I18nContext);
    if (context === undefined) {
        throw new Error('useTranslations must be used within an I18nProvider');
    }
    return context;
}
