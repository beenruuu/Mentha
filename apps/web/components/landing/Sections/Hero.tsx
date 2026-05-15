'use client';

import type React from 'react';

import { useTranslations } from '@/lib/i18n';
import type { Theme } from '../../types';

interface HeroProps {
    theme: Theme;
}

const Hero: React.FC<HeroProps> = ({ theme: _theme }) => {
    const { t } = useTranslations();

    return (
        <section className="min-h-screen pt-20 flex flex-col transition-colors duration-500">
            {/* Text Content - Full Width and Centered */}
            <div className="w-full max-w-7xl mx-auto p-8 md:p-16 lg:p-24 flex flex-col justify-center text-center">
                <div className="font-mono text-xs mb-6 uppercase tracking-widest text-mentha-mint">
                    {t.heroTag}
                </div>

                <h1 className="font-serif text-5xl md:text-7xl lg:text-9xl leading-[1.1] mb-8">
                    {t.heroTitle}{' '}
                    <span className="line-through decoration-mentha-mint decoration-2 text-opacity-50 text-current">
                        {t.heroTitleDead}
                    </span>
                    {t.heroTitleSuffix}{' '}
                    <span className="italic text-mentha-mint">{t.heroTitleHighlight}</span>
                </h1>

                <div className="max-w-3xl mx-auto">
                    <p className="font-sans text-lg md:text-xl leading-relaxed opacity-90 mb-10">
                        {t.heroDescription}
                    </p>

                    <div className="flex items-center gap-x-4 justify-center">
                        <div className="h-px w-12 bg-current"></div>
                        <span className="font-mono text-sm uppercase">{t.heroScroll}</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
