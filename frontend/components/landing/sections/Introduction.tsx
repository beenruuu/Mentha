"use client";

import Tag from "@/components/landing/Tag";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { useTranslations } from "@/lib/i18n";

export default function Introduction() {
    const { t } = useTranslations();
    
    return (
        <section className="py-28 lg:py-40">
            <div className="container max-w-5xl mx-auto px-4">
                <div className="flex justify-center mb-10">
                    <Tag>{t.introTag}</Tag>
                </div>
                <div className="text-center">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-8">
                        {t.introTitle}
                    </h2>
                    <ScrollReveal
                        size="xl"
                        align="center"
                        variant="muted"
                        enableBlur={true}
                        baseOpacity={0.15}
                        baseRotation={0}
                        blurStrength={3}
                        staggerDelay={0.03}
                        threshold={0.3}
                        duration={0.5}
                        textClassName="text-white/80"
                    >
                        {t.introDescription}
                    </ScrollReveal>
                    <p className="text-emerald-400 text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mt-8">
                        {t.introHighlight}
                    </p>
                </div>
            </div>
        </section>
    );
}
