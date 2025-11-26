"use client";

import Tag from "@/components/landing/Tag";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

const faqs = [
    {
        question: "What is AEO and how is it different from SEO?",
        answer: "AEO (Answer Engine Optimization) focuses on optimizing your content for AI-powered search engines like ChatGPT, Claude, and Perplexity. Unlike traditional SEO that targets ranking in 10 blue links, AEO aims to make your brand the definitive answer in AI responses.",
    },
    {
        question: "Which AI platforms does Mentha support?",
        answer: "Mentha currently supports OpenAI (ChatGPT), Anthropic (Claude), Perplexity, and Google Gemini. We continuously add new platforms as they emerge in the AI search landscape.",
    },
    {
        question: "How does brand monitoring work?",
        answer: "Mentha regularly queries AI platforms about your brand and tracks how you're mentioned, the sentiment of responses, and your visibility compared to competitors. You'll receive alerts when significant changes occur.",
    },
    {
        question: "Can I see how competitors appear in AI responses?",
        answer: "Yes! Our competitor intelligence feature lets you track how rivals appear in AI-generated answers, compare share of voice, and identify opportunities to improve your positioning.",
    },
    {
        question: "Is there a free trial available?",
        answer: "Absolutely! Start with our free tier that includes 10 analyses per month. Upgrade to Pro for unlimited analyses and advanced features like competitor tracking and API access.",
    },
];

export default function Faqs() {
    const [selectedIndex, setSelectedIndex] = useState(0);

    return (
        <section id="faqs" className="py-24">
            <div className="container max-w-5xl mx-auto px-4">
                <div className="flex justify-center">
                    <Tag>FAQs</Tag>
                </div>
                <h2 className="text-6xl font-medium mt-6 text-center max-w-xl mx-auto">
                    Questions? We&apos;ve got{" "}
                    <span className="text-emerald-400">answers</span>
                </h2>

                <div className="mt-12 flex flex-col gap-6 max-w-xl mx-auto">
                    {faqs.map((faq, faqIndex) => (
                        <div
                            key={faq.question}
                            onClick={() => setSelectedIndex(faqIndex)}
                            className="bg-zinc-900/50 rounded-2xl border border-white/10 p-6 cursor-pointer hover:border-emerald-500/30 transition-all duration-300"
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="font-medium m-0">
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
                                        <p className="text-white/50">
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
