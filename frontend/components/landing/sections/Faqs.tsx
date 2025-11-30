"use client";

import Tag from "@/components/landing/Tag";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { useTranslations } from "@/lib/i18n";

export default function Faqs() {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { t } = useTranslations();

    const faqs = [
        {
            question: t.faqQuestion1,
            answer: t.faqAnswer1,
        },
        {
            question: t.faqQuestion2,
            answer: t.faqAnswer2,
        },
        {
            question: t.faqQuestion3,
            answer: t.faqAnswer3,
        },
        {
            question: t.faqQuestion4,
            answer: t.faqAnswer4,
        },
        {
            question: t.faqQuestion5,
            answer: t.faqAnswer5,
        },
    ];

    return (
        <section id="faqs" className="py-24">
            <div className="container max-w-5xl mx-auto px-4">
                <div className="flex justify-center">
                    <Tag>{t.faqsTag}</Tag>
                </div>
                <h2 className="text-6xl font-medium mt-6 text-center max-w-xl mx-auto">
                    {t.faqsTitle}{" "}
                    <span className="text-emerald-400">{t.faqsTitleHighlight}</span>
                </h2>

                <div className="mt-12 flex flex-col gap-6 max-w-xl mx-auto">
                    {faqs.map((faq, faqIndex) => (
                        <div
                            key={faq.question}
                            onClick={() => setSelectedIndex(faqIndex)}
                            className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 cursor-pointer hover:border-emerald-500/50 dark:hover:border-emerald-500/30 transition-all duration-300 shadow-sm dark:shadow-none"
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="font-medium m-0 text-gray-900 dark:text-white">
                                    {faq.question}
                                </h3>
                                <Plus
                                    size={30}
                                    className={twMerge(
                                        "feather feather-plus text-emerald-400 flex-shrink-0 transition duration-300",
                                        selectedIndex === faqIndex &&
                                            "rotate-45"
                                    )}
                                />
                            </div>

                            <AnimatePresence>
                                {selectedIndex === faqIndex && (
                                    <motion.div
                                        initial={{
                                            height: 0,
                                            marginTop: 0,
                                        }}
                                        animate={{
                                            height: "auto",
                                            marginTop: 24,
                                        }}
                                        exit={{
                                            height: 0,
                                            marginTop: 0,
                                        }}
                                        className="overflow-hidden"
                                    >
                                        <p className="text-gray-500 dark:text-white/50">
                                            {faq.answer}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
