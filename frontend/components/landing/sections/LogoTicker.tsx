"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import React from "react";

const providers = [
    { name: "OpenAI", image: "/providers/openai.svg" },
    { name: "Claude", image: "/providers/claude-color.svg" },
    { name: "Perplexity", image: "/providers/perplexity-color.svg" },
    { name: "Gemini", image: "/providers/gemini-color.svg" },
];

export default function LogoTicker() {
    return (
        <section className="py-24 overflow-x-clip">
            <div className="container max-w-5xl mx-auto px-4">
                <h3 className="text-center text-gray-500 dark:text-white/50 text-xl">
                    Optimized for all major AI Engines
                </h3>
                <div className="flex overflow-hidden mt-12 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                    <motion.div
                        animate={{
                            x: "-50%",
                        }}
                        transition={{
                            duration: 20,
                            ease: "linear",
                            repeat: Infinity,
                        }}
                        className="flex gap-8 pr-24"
                    >
                        {Array.from({ length: 4 }).map((_, i) => (
                            <React.Fragment key={i}>
                                {providers.map((provider) => (
                                    <div
                                        key={`${provider.name}-${i}`}
                                        className="flex items-center justify-center min-w-[150px]"
                                    >
                                        <Image
                                            src={provider.image}
                                            alt={provider.name}
                                            width={120}
                                            height={40}
                                            className="h-10 w-auto object-contain"
                                        />
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
