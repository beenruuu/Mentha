"use client";

import Tag from "@/components/landing/Tag";
import IntegrationColumn from "@/components/landing/IntegrationColumn";
import { useTranslations } from "@/lib/i18n";

export default function Integrations() {
    const { t } = useTranslations();
    
    const integrations = [
        {
            name: "OpenAI",
            icon: "/providers/openai.svg",
            description: t.integrationOpenAI,
        },
        {
            name: "Claude",
            icon: "/providers/claude-color.svg",
            description: t.integrationClaude,
        },
        {
            name: "Perplexity",
            icon: "/providers/perplexity-color.svg",
            description: t.integrationPerplexity,
        },
        {
            name: "Gemini",
            icon: "/providers/gemini-color.svg",
            description: t.integrationGemini,
        },
    ];

    return (
        <section id="integrations" className="py-24 overflow-hidden">
            <div className="container max-w-5xl mx-auto px-4">
                <div className="grid lg:grid-cols-2 items-center lg:gap-16">
                    <div>
                        <Tag>{t.integrationsTag}</Tag>
                        <h2 className="text-6xl font-medium mt-6">
                            {t.integrationsTitle}{" "}
                            <span className="text-emerald-400">{t.integrationsTitleHighlight}</span> {t.integrationsTitleSuffix}
                        </h2>

                        <p className="text-gray-500 dark:text-white/50 mt-4 text-lg">
                            {t.integrationsDescription}
                        </p>
                    </div>
                    <div>
                        <div className="grid md:grid-cols-2 gap-4 lg:h-[800px] h-[400px] lg:mt-0 mt-8 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
                            <IntegrationColumn integrations={integrations} />
                            <IntegrationColumn
                                integrations={integrations.slice().reverse()}
                                className="hidden md:flex"
                                reverse
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
