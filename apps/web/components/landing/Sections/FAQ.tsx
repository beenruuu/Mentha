import { Minus, Plus } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

import { useTranslations } from '@/lib/i18n';

const FAQ: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const { t } = useTranslations();

    const faqs = [
        {
            q: t.faqQ1,
            a: t.faqA1,
        },
        {
            q: t.faqQ2,
            a: t.faqA2,
        },
        {
            q: t.faqQ3,
            a: t.faqA3,
        },
        {
            q: t.faqQ4,
            a: t.faqA4,
        },
    ];

    return (
        <section className="border-b border-mentha-forest dark:border-mentha-beige">
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
                {/* Title Column */}
                <div className="md:col-span-4 p-12 md:p-24 border-b md:border-b-0 md:border-r border-mentha-forest dark:border-mentha-beige flex flex-col justify-between">
                    <div>
                        <span className="font-mono text-xs uppercase tracking-widest text-mentha-mint mb-4 block">
                            /// FAQ_MODULE
                        </span>
                        <h2 className="font-serif text-5xl leading-tight">{t.faqTitle}</h2>
                    </div>
                    <p className="font-sans opacity-70 mt-8">{t.faqSubtitle}</p>
                </div>

                {/* Questions Column */}
                <div className="md:col-span-8">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="border-b border-mentha-forest dark:border-mentha-beige last:border-b-0"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full text-left p-8 md:p-12 flex justify-between items-center group hover:text-mentha-mint transition-colors duration-300"
                            >
                                <span className="font-serif text-xl md:text-2xl pr-8">{faq.q}</span>
                                <span className="border border-mentha-forest dark:border-mentha-beige p-1 rounded-full flex-shrink-0 transition-transform duration-300 group-hover:border-mentha-mint group-hover:text-mentha-mint">
                                    {openIndex === index ? <Minus size={16} /> : <Plus size={16} />}
                                </span>
                            </button>

                            <div
                                className={`overflow-hidden transition-all duration-500 ease-in-out ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                                <div className="p-8 md:p-12 pt-0 font-sans text-lg opacity-70 max-w-3xl leading-relaxed">
                                    {faq.a}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;
