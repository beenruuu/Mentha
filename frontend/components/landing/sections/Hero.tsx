"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, useAnimate } from "framer-motion";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { PromptInput } from "@/components/landing/prompt-input";
import { useTranslations } from "@/lib/i18n";
import { Typewriter } from "@/components/ui/typewriter";

export default function Hero() {
    const [leftScope, leftAnimate] = useAnimate();
    const [rightScope, rightAnimate] = useAnimate();
    const { t } = useTranslations();

    useEffect(() => {
        leftAnimate([
            [leftScope.current, { opacity: 1 }, { duration: 0.5 }],
            [leftScope.current, { y: 0, x: 0 }, { duration: 0.5 }],
        ]);

        rightAnimate([
            [rightScope.current, { opacity: 1 }, { duration: 0.5, delay: 0.3 }],
            [rightScope.current, { y: 0, x: 0 }, { duration: 0.5 }],
        ]);
    }, [leftAnimate, leftScope, rightAnimate, rightScope]);

    return (
        <section className="pt-32 pb-24 overflow-x-clip">
            <div className="container max-w-5xl mx-auto px-4 relative">
                {/* Decorative elements */}
                <motion.div
                    ref={leftScope}
                    initial={{ opacity: 0, y: 100, x: -100 }}
                    className="absolute -left-32 top-16 hidden lg:block"
                >
                    <div className="w-64 h-48 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-3xl blur-sm" />
                </motion.div>

                <motion.div
                    ref={rightScope}
                    initial={{ opacity: 0, y: 100, x: 100 }}
                    className="absolute -right-32 top-32 hidden lg:block"
                >
                    <div className="w-64 h-48 bg-gradient-to-bl from-emerald-500/20 to-transparent rounded-3xl blur-sm" />
                </motion.div>

                <div className="flex justify-center">
                    <div className="inline-flex py-1 px-3 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full text-black font-semibold">
                        {t.heroTagline}
                    </div>
                </div>
                <div className="flex justify-center mt-6">
                    <Typewriter
                        text={[t.heroTitle + " " + t.heroTitleHighlight]}
                        speed={70}
                        className="text-6xl md:text-7xl lg:text-8xl font-medium text-center"
                        waitTime={1500}
                        deleteSpeed={40}
                        cursorClassName="text-emerald-500 ml-2"
                    />
                </div>
                <p className="text-center text-xl text-gray-500 dark:text-white/50 mt-8 max-w-2xl mx-auto">
                    {t.heroDescription}
                </p>
                <div className="mt-12 max-w-2xl mx-auto">
                    <PromptInput
                        texts={{
                            placeholder: t.promptPlaceholder,
                            creditsRemaining: t.creditsRemaining,
                            upgrade: t.upgrade,
                        }}
                    />
                </div>
            </div>
        </section>
    );
}
