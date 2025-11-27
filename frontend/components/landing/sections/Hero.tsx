"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, useAnimate } from "framer-motion";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

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
        <section className="py-24 overflow-x-clip">
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
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-medium text-center mt-6">
                    {t.heroTitle}{" "}
                    <span className="text-emerald-500">{t.heroTitleHighlight}</span> Landscape
                </h1>
                <p className="text-center text-xl text-white/50 mt-8 max-w-2xl mx-auto">
                    {t.heroDescription}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 max-w-md mx-auto">
                    <Link href="/auth/signup" className="flex-1">
                        <Button
                            size="lg"
                            className="w-full bg-emerald-500 text-black hover:bg-emerald-400 rounded-full h-12 text-base"
                        >
                            {t.heroStartTrial}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href="/aeo-analysis" className="flex-1">
                        <Button
                            size="lg"
                            variant="outline"
                            className="w-full border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-full h-12 text-base"
                        >
                            {t.heroAnalyzeSite}
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
