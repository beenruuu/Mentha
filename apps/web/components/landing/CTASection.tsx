'use client';

import Link from 'next/link';

import { useTranslations } from '@/lib/i18n';

export default function CTASection() {
    const { t } = useTranslations();

    return (
        <div className="w-full relative overflow-hidden flex flex-col justify-center items-center gap-2 bg-white dark:bg-black transition-colors duration-300">
            {/* Content */}
            <div className="self-stretch px-6 md:px-24 py-6 md:py-10 flex justify-center items-center gap-6 relative z-10">
                <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
                    <div className="w-full h-full relative">
                        {Array.from({ length: 40 }).map((_, i) => (
                            <div
                                key={i}
                                className="absolute h-px w-[200%] rotate-[-45deg] origin-top-left bg-black/5 dark:bg-white/5"
                                style={{
                                    top: `${i * 30 - 100}px`,
                                    left: '-50%',
                                }}
                            ></div>
                        ))}
                    </div>
                </div>

                <div className="w-full max-w-[586px] px-6 py-5 md:py-8 overflow-hidden rounded-lg flex flex-col justify-start items-center gap-6 relative z-20">
                    <div className="self-stretch flex flex-col justify-start items-start gap-4">
                        <div className="self-stretch text-center flex justify-center flex-col text-black dark:text-white text-3xl md:text-5xl font-light leading-tight md:leading-[56px] tracking-tight">
                            {t.ctaTitle}
                        </div>
                        <div className="self-stretch text-center text-gray-500 dark:text-gray-400 text-lg leading-7 font-light">
                            {t.ctaDescription}
                        </div>
                    </div>
                    <div className="w-full max-w-[497px] flex flex-col justify-center items-center gap-12">
                        <div className="flex justify-start items-center gap-4">
                            <Link
                                href="/auth/signup"
                                className="h-12 px-8 py-3 relative bg-black dark:bg-white text-white dark:text-black shadow-sm overflow-hidden rounded-full flex justify-center items-center cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                            >
                                <div className="flex flex-col justify-center text-[15px] font-medium leading-5">
                                    {t.ctaPrimary}
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
