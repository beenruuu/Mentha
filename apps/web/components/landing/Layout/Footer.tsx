import { Github } from 'lucide-react';
import type React from 'react';

import { useTranslations } from '@/lib/i18n';

const Footer: React.FC = () => {
    const { t, locale, toggleLocale } = useTranslations();

    return (
        <footer
            id="footer"
            className="pt-24 pb-8 border-t border-mentha-forest/10 dark:border-mentha-beige/10 bg-white dark:bg-mentha-dark transition-colors duration-300 overflow-hidden"
        >
            <div className="max-w-7xl mx-auto px-8 md:px-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
                {/* Column 1: Brand & Newsletter */}
                <div className="md:col-span-2 lg:col-span-1 gap-y-8">
                    <div className="space-y-4">
                        <h4 className="font-mono text-xs uppercase tracking-widest text-mentha-forest dark:text-mentha-beige">
                            {t.footerNewsletter}
                        </h4>
                        <p className="font-serif text-xl italic text-mentha-forest dark:text-mentha-beige">
                            {t.footerNewsletterTitle}
                        </p>
                        <div className="flex border-b border-mentha-forest/30 dark:border-mentha-beige/30 pb-2">
                            <input
                                type="email"
                                placeholder={t.footerEmailPlaceholder}
                                className="bg-transparent w-full focus:outline-none font-mono text-sm placeholder-current placeholder-opacity-40 text-mentha-forest dark:text-mentha-beige"
                            />
                            <button
                                type="button"
                                className="font-mono text-xs uppercase text-mentha-forest dark:text-mentha-beige hover:text-mentha-mint transition-colors"
                            >
                                {t.footerSubmit}
                            </button>
                        </div>
                    </div>
                    <div className="pt-4 space-y-2">
                        <p className="font-mono text-[10px] text-mentha-forest/60 dark:text-mentha-beige/60">
                            Mentha, Inc. © 2026
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <button
                                type="button"
                                onClick={() => toggleLocale('es')}
                                className={`flex items-center gap-1 font-mono text-[10px] transition-all ${locale === 'es' ? 'text-mentha-mint underline decoration-mentha-mint' : 'text-mentha-forest/60 dark:text-mentha-beige/60 hover:text-mentha-mint'}`}
                            >
                                <span>🇪🇸</span> ESPAÑOL
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleLocale('en')}
                                className={`flex items-center gap-1 font-mono text-[10px] transition-all ${locale === 'en' ? 'text-mentha-mint underline decoration-mentha-mint' : 'text-mentha-forest/60 dark:text-mentha-beige/60 hover:text-mentha-mint'}`}
                            >
                                <span>🇺🇸</span> ENGLISH
                            </button>
                        </div>
                    </div>
                </div>

                {/* Column 2: Product */}
                <div className="space-y-6">
                    <h4 className="font-mono text-xs uppercase tracking-widest text-mentha-forest dark:text-mentha-beige">
                        {t.footerProduct}
                    </h4>
                    <ul className="gap-y-3">
                        {[
                            { name: t.footerVisibilityTracking, href: '/login' },
                            { name: t.footerPromptDiscovery, href: '/login' },
                            { name: t.footerInsights, href: '/login' },
                            { name: t.footerSentimentAnalysis, href: '/login' },
                            { name: t.footerMenthaMCP, href: '/login', soon: true },
                        ].map((item) => (
                            <li key={item.name} className="flex items-center gap-2">
                                <a
                                    href={item.href}
                                    className="font-sans text-sm text-mentha-forest/70 dark:text-mentha-beige/70 hover:text-mentha-mint hover:translate-x-1 inline-block transition-all"
                                >
                                    {item.name}
                                </a>
                                {item.soon && (
                                    <span className="font-mono text-[8px] px-1 py-0.5 rounded border border-mentha-mint/30 text-mentha-mint opacity-60">
                                        SOON
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Column 3: Solutions */}
                <div className="space-y-6">
                    <h4 className="font-mono text-xs uppercase tracking-widest text-mentha-forest dark:text-mentha-beige">
                        {t.footerSolutions}
                    </h4>
                    <ul className="gap-y-3">
                        {[
                            { name: t.footerSEOManagers, href: '/login' },
                            { name: t.footerInHouseMarketers, href: '/login' },
                            { name: t.footerAgencies, href: '/login' },
                        ].map((item) => (
                            <li key={item.name} className="flex items-center gap-2">
                                <a
                                    href={item.href}
                                    className="font-sans text-sm text-mentha-forest/70 dark:text-mentha-beige/70 hover:text-mentha-mint hover:translate-x-1 inline-block transition-all"
                                >
                                    {item.name}
                                </a>
                                <span className="font-mono text-[8px] px-1 py-0.5 rounded border border-mentha-forest/20 dark:border-mentha-beige/20 text-mentha-forest/40 dark:text-mentha-beige/40">
                                    BETA
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Column 4: Resources */}
                <div className="space-y-6">
                    <h4 className="font-mono text-xs uppercase tracking-widest text-mentha-forest dark:text-mentha-beige">
                        {t.footerResources}
                    </h4>
                    <ul className="gap-y-3">
                        {[
                            { name: t.footerBlog, href: '/login', soon: true },
                            { name: t.footerCustomers, href: '/login', soon: true },
                            {
                                name: t.footerFreeTool,
                                href: 'https://github.com/beenruuu/mentha',
                                isExternal: true,
                            },
                            { name: t.footerKnowledgeBase, href: '/login', soon: true },
                            { name: t.footerAPIDocs, href: '/login', soon: true },
                            { name: t.footerMCPDocs, href: '/login', soon: true },
                        ].map((item) => (
                            <li key={item.name} className="flex items-center gap-2">
                                <a
                                    href={item.href}
                                    target={item.isExternal ? '_blank' : undefined}
                                    rel={item.isExternal ? 'noopener noreferrer' : undefined}
                                    className="font-sans text-sm text-mentha-forest/70 dark:text-mentha-beige/70 hover:text-mentha-mint hover:translate-x-1 inline-flex items-center gap-1.5 transition-all"
                                >
                                    {item.isExternal && (
                                        <Github size={12} className="text-mentha-mint" />
                                    )}
                                    {item.name}
                                </a>
                                {item.soon && (
                                    <span className="font-mono text-[8px] px-1 py-0.5 rounded border border-mentha-forest/20 dark:border-mentha-beige/20 text-mentha-forest/40 dark:text-mentha-beige/40">
                                        SOON
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Column 5: Company */}
                <div className="space-y-6">
                    <h4 className="font-mono text-xs uppercase tracking-widest text-mentha-forest dark:text-mentha-beige">
                        {t.footerCompany}
                    </h4>
                    <ul className="gap-y-3">
                        {[
                            { name: t.footerAboutUs, href: '/login', soon: true },
                            { name: t.footerPrivacyPolicy, href: '/login', soon: true },
                            { name: t.footerTermsOfService, href: '/login', soon: true },
                            { name: t.footerDataProtection, href: '/login', soon: true },
                        ].map((item) => (
                            <li key={item.name} className="flex items-center gap-2">
                                <a
                                    href={item.href}
                                    className="font-sans text-sm text-mentha-forest/70 dark:text-mentha-beige/70 hover:text-mentha-mint hover:translate-x-1 inline-block transition-all"
                                >
                                    {item.name}
                                </a>
                                {item.soon && (
                                    <span className="font-mono text-[8px] px-1 py-0.5 rounded border border-mentha-forest/20 dark:border-mentha-beige/20 text-mentha-forest/40 dark:text-mentha-beige/40">
                                        DRAFT
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="mt-24 pb-12 relative overflow-hidden">
                <h1 className="text-[20vw] leading-[0.8] font-serif tracking-tighter text-center w-full select-none pointer-events-none text-mentha-forest dark:text-mentha-beige opacity-[0.03] dark:opacity-[0.05]">
                    MENTHA
                </h1>
                <div className="absolute bottom-0 left-0 w-full text-center pb-4">
                    <p className="font-mono text-[9px] tracking-widest text-mentha-forest/40 dark:text-mentha-beige/40">
                        DESIGNED BY BEENRUUU • DEVELOPED FOR THE FUTURE OF SEARCH
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
