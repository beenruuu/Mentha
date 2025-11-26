"use client";

import Tag from "@/components/landing/Tag";
import { useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

const text = `Search behavior is changing. Users are asking questions, not searching keywords. Your optimization strategy needs to evolve from keywords to entities and context.`;
const words = text.split(" ");

export default function Introduction() {
    const scrollTarget = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: scrollTarget,
        offset: ["start end", "end end"],
    });

    const [currentWord, setCurrentWord] = useState(0);

    const wordIndex = useTransform(scrollYProgress, [0, 1], [0, words.length]);

    useEffect(() => {
        wordIndex.on("change", (latest) => {
            setCurrentWord(latest);
        });
    }, [wordIndex]);

    return (
        <section className="py-28 lg:py-40">
            <div className="container max-w-5xl mx-auto px-4">
                <div className="sticky top-28 md:top-32">
                    <div className="flex justify-center">
                        <Tag>The Paradigm Shift</Tag>
                    </div>
                    <div className="text-4xl md:text-6xl lg:text-7xl text-center font-medium mt-10">
                        <span>Your SEO deserves better.&nbsp;</span>
                        <span className="text-white/15">
                            {words.map((word, idx) => (
                                <span
                                    key={idx}
                                    className={twMerge(
                                        "transition duration-500 text-white/15",
                                        idx < currentWord && "text-white"
                                    )}
                                >{`${word} `}</span>
                            ))}
                        </span>
                        <span className="text-emerald-400 block">
                            That&apos;s why we built Mentha.
                        </span>
                    </div>
                </div>
                <div ref={scrollTarget} className="h-[150vh]"></div>
            </div>
        </section>
    );
}
