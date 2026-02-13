"use client";

import Tag from "@/components/landing/Tag";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { useTranslations } from "@/lib/i18n";

export default function Introduction() {
    const { t } = useTranslations();

    return (
        <section className="py-16 lg:py-20">
            <div className="container max-w-5xl mx-auto px-4">
                <div className="flex justify-center mb-8">
                    <Tag>{t.introTag}</Tag>
                </div>
                <div className="text-center">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6 font-sans tracking-tight">
                        {t.introTitle}
                    </h2>
                    <ScrollReveal
                        size="lg"
                        align="center"
                        variant="muted"
                        enableBlur={true}
                        baseOpacity={0.15}
                        baseRotation={0}
                        blurStrength={3}
                        staggerDelay={0.03}
                        threshold={0.3}
                        duration={0.5}
                        textClassName="text-gray-600 dark:text-white/80 font-sans"
                    >
                        {t.introDescription}
                    </ScrollReveal>
                    <p className="text-emerald-400 text-2xl md:text-3xl lg:text-4xl font-bold mt-6 font-sans tracking-tight">
                        {t.introHighlight}
                    </p>
                </div>
            </div>
        </section>
    );
}
