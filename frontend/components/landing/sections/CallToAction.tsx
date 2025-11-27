"use client";

import { AnimationPlaybackControls, motion, useAnimate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n";

export default function CallToAction() {
    const animation = useRef<AnimationPlaybackControls | null>(null);
    const [scope, animate] = useAnimate();
    const { t } = useTranslations();

    const [slowDownAnimation, setSlowDownAnimation] = useState(false);

    useEffect(() => {
        animation.current = animate(
            scope.current,
            { x: "-50%" },
            { duration: 30, ease: "linear", repeat: Infinity }
        );
    }, [animate, scope]);

    useEffect(() => {
        if (animation.current) {
            if (slowDownAnimation) {
                animation.current.speed = 0.5;
            } else {
                animation.current.speed = 1;
            }
        }
    }, [slowDownAnimation]);

    return (
        <section className="py-24">
            <Link href="/auth/signup">
                <div className="overflow-x-clip p-4 flex cursor-pointer">
                    <motion.div
                        ref={scope}
                        className="flex flex-none gap-16 pr-16 text-7xl md:text-8xl font-medium"
                        onMouseEnter={() => setSlowDownAnimation(true)}
                        onMouseLeave={() => setSlowDownAnimation(false)}
                    >
                        {Array.from({ length: 10 }).map((_, index) => (
                            <div key={index} className="flex items-center gap-16">
                                <span className="text-emerald-500 text-7xl">
                                    &#10038;
                                </span>
                                <span
                                    className={twMerge(
                                        "transition-colors duration-300",
                                        slowDownAnimation && "text-emerald-400"
                                    )}
                                >
                                    {t.ctaText}
                                </span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </Link>
        </section>
    );
}
