"use client";

import React from "react";
import Tag from "./Tag";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function Introduction() {
    return (
        <section className="pt-24 pb-6 lg:pt-32 lg:pb-10 bg-white dark:bg-black transition-colors duration-300">
            <div className="container max-w-5xl mx-auto px-6">
                <div className="flex justify-center mb-8">
                    <Tag>New Era of SEO</Tag>
                </div>
                <div className="text-center">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-black dark:text-white mb-8 tracking-tight">
                        Your SEO deserves more.
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
                        textClassName="text-xl md:text-2xl lg:text-3xl text-gray-500 dark:text-gray-400 font-light leading-relaxed max-w-4xl mx-auto"
                    >
                        Search behavior is changing. Users ask questions, not keywords. Your optimization strategy needs to evolve from keywords to entities and context.
                    </ScrollReveal>
                    <p className="text-[#35d499] text-xl md:text-2xl lg:text-3xl font-light mt-6 tracking-tight">
                        That&apos;s why we created Mentha.
                    </p>
                </div>
            </div>
        </section>
    );
}
