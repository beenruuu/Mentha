'use client';

import EffortlessIntegration from '@/components/landing/EffortlessIntegration';
import Tag from '@/components/landing/Tag';
import { useTranslations } from '@/lib/i18n';

export default function Integrations() {
    const { t } = useTranslations();

    return (
        <section
            id="integrations"
            className="py-6 overflow-hidden bg-white dark:bg-mentha-dark transition-colors duration-300"
        >
            <div className="container max-w-5xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 items-center lg:gap-16">
                    <div className="mb-12 lg:mb-0">
                        <Tag>{t.integrationsTag}</Tag>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-light mt-8 mb-6 text-current tracking-tight">
                            {t.integrationsTitle}{' '}
                            <span className="text-[#35d499]">{t.integrationsTitleHighlight}</span>{' '}
                            {t.integrationsTitleSuffix}
                        </h2>

                        <p className="text-gray-500 dark:text-gray-400 mt-4 text-lg font-light leading-relaxed">
                            {t.integrationsDescription}
                        </p>
                    </div>
                    <div className="flex justify-center items-center h-[500px]">
                        <EffortlessIntegration className="w-full h-full" />
                    </div>
                </div>
            </div>
        </section>
    );
}
