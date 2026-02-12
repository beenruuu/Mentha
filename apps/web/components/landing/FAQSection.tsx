'use client';

import { useState } from 'react';

import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

function ChevronDownIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="m6 9 6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function FAQSection() {
    const { t } = useTranslations();
    const [openItem, setOpenItem] = useState<number | null>(0);

    const faqData = [
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

    const toggleItem = (index: number) => {
        setOpenItem((prev) => (prev === index ? null : index));
    };

    return (
        <div
            id="faq"
            className="w-full flex justify-center items-start bg-white dark:bg-black transition-colors duration-300"
        >
            <div className="container max-w-5xl px-6 py-6 md:py-10 flex flex-col lg:flex-row justify-start items-start gap-6 lg:gap-12">
                {/* Left Column - Header */}
                <div className="w-full lg:flex-1 flex flex-col justify-center items-start gap-4 lg:py-5">
                    <div className="w-full flex flex-col justify-center text-4xl md:text-5xl font-light text-black dark:text-white tracking-tight">
                        {t.faqsTitle}
                    </div>
                </div>

                {/* Right Column - FAQ Items */}
                <div className="w-full lg:flex-1 flex flex-col justify-center items-center">
                    <div className="w-full flex flex-col">
                        {faqData.map((item, index) => {
                            const isOpen = openItem === index;

                            return (
                                <div
                                    key={index}
                                    className={`w-full border-b border-black/10 dark:border-white/10 overflow-hidden transition-colors duration-300 ${isOpen ? 'bg-emerald-50/10 dark:bg-emerald-500/5' : ''}`}
                                >
                                    <button
                                        onClick={() => toggleItem(index)}
                                        className="w-full px-0 py-6 flex justify-between items-center gap-5 text-left hover:opacity-70 transition-opacity duration-200"
                                        aria-expanded={isOpen}
                                    >
                                        <div
                                            className={cn(
                                                'flex-1 text-lg font-light transition-colors duration-300',
                                                isOpen
                                                    ? 'text-[#35d499]'
                                                    : 'text-black dark:text-white',
                                            )}
                                        >
                                            {item.question}
                                        </div>
                                        <div className="flex justify-center items-center">
                                            <ChevronDownIcon
                                                className={cn(
                                                    'w-5 h-5 transition-transform duration-300 ease-in-out',
                                                    isOpen
                                                        ? 'rotate-180 text-[#35d499]'
                                                        : 'text-black/40 dark:text-white/40',
                                                )}
                                            />
                                        </div>
                                    </button>

                                    <div
                                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                            isOpen
                                                ? 'max-h-[500px] opacity-100'
                                                : 'max-h-0 opacity-0'
                                        }`}
                                    >
                                        <div className="pb-6 text-gray-500 dark:text-gray-400 text-base font-light leading-7 max-w-[90%]">
                                            {item.answer}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
