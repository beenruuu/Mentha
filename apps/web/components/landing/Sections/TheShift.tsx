'use client';

import { ArrowUp, Copy, ThumbsDown, ThumbsUp } from 'lucide-react';
import type React from 'react';

import { useTranslations } from '@/lib/i18n';

type LandingTranslations = ReturnType<typeof useTranslations>['t'];

const TheShift: React.FC = () => {
    const { t } = useTranslations();
    const tickerItems = Array.from({ length: 10 }, (_, itemIndex) => `shift-ticker-${itemIndex}`);

    return (
        <section
            id="shift"
            className="w-full border-b border-mentha-forest dark:border-mentha-beige"
        >
            {/* Ticker */}
            <div className="w-full border-b border-mentha-forest dark:border-mentha-beige bg-mentha-mint text-mentha-forest py-3 select-none overflow-hidden">
                <div className="whitespace-nowrap flex animate-marquee">
                    {tickerItems.map((tickerKey) => (
                        <span
                            key={tickerKey}
                            className="mx-8 font-mono text-xs font-semibold uppercase tracking-widest flex items-center"
                        >
                            <span className="size-2 bg-mentha-forest rounded-full mr-2"></span>
                            {t.shiftMarquee}
                        </span>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[700px]">
                {/* TEXT COLUMN */}
                <div className="p-12 lg:p-24 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-mentha-forest dark:border-mentha-beige bg-inherit">
                    <div className="font-mono text-xs uppercase tracking-widest mb-8 text-mentha-mint">
                        {t.shiftTag}
                    </div>

                    <h2 className="font-serif text-6xl lg:text-7xl leading-[0.95] mb-12">
                        {t.shiftTitle} <br />
                        <span className="italic text-mentha-mint">{t.shiftTitleHighlight}</span>
                    </h2>

                    <div className="space-y-12">
                        <div className="relative pl-8 border-l border-mentha-forest dark:border-mentha-beige border-opacity-30">
                            <span className="absolute -left-[5px] top-0 size-2.5 bg-current rounded-full opacity-30"></span>
                            <h3 className="font-mono text-sm uppercase tracking-widest mb-2 opacity-70 line-through">
                                {t.shiftLegacyHeader}
                            </h3>
                            <p className="font-sans text-xl opacity-90 leading-relaxed">
                                {t.shiftLegacyDesc}
                            </p>
                        </div>

                        <div className="relative pl-8 border-l-2 border-mentha-mint">
                            <span className="absolute -left-[5px] top-0 size-2.5 bg-mentha-mint rounded-full"></span>
                            <h3 className="font-mono text-sm uppercase tracking-widest mb-2 text-mentha-mint">
                                {t.shiftCurrentHeader}
                            </h3>
                            <p className="font-sans text-xl font-medium leading-relaxed">
                                {t.shiftCurrentDesc}
                            </p>
                        </div>
                    </div>
                </div>

                {/* VISUAL COLUMN - Mock Prompt */}
                <div className="md:col-span-1 flex items-center justify-center p-12 lg:p-24">
                    <PromptInputBasic t={t} />
                </div>
            </div>

            <style>{`
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .typing-effect {
            overflow: hidden;
            white-space: nowrap;
            border-right: 2px solid transparent;
            animation: typing 3.5s steps(40, end), blink-caret .75s step-end infinite;
        }
        @keyframes typing {
            from { width: 0 }
            to { width: 100% }
        }
        @keyframes blink-caret {
            from, to { border-color: transparent }
            50% { border-color: #73D29B }
        }
      `}</style>
        </section>
    );
};

export default TheShift;

// Adapted PromptInputBasic for AI-like experience
function PromptInputBasic({ t }: { t: LandingTranslations }) {
    // Conversación simulada fija
    return (
        <div className="w-full max-w-xl">
            <div className="mb-2">
                <div className="flex justify-end mb-3">
                    <div className="max-w-[600px] rounded-xl bg-zinc-100 dark:bg-mentha-dark/60 border border-zinc-200 dark:border-mentha-beige/30 px-4 py-2 font-serif text-base text-zinc-800 dark:text-mentha-beige">
                        {t.shiftMockQuestion}
                    </div>
                </div>
                <div className="max-w-[600px]">
                    <div className="rounded-xl bg-white dark:bg-mentha-dark/80 px-4 py-2 font-serif text-base text-mentha-forest dark:text-mentha-beige">
                        {t.shiftMockAnswer}
                    </div>
                    <div
                        className="flex gap-3 mt-3 text-zinc-400 dark:text-mentha-beige/60 ml-4"
                        style={{ marginLeft: '1rem' }}
                    >
                        <button
                            type="button"
                            aria-label="Copy answer"
                            className="hover:text-mentha-mint transition-colors"
                        >
                            <Copy className="size-5" />
                        </button>
                        <button
                            type="button"
                            aria-label="Like answer"
                            className="hover:text-mentha-mint transition-colors"
                        >
                            <ThumbsUp className="size-5" />
                        </button>
                        <button
                            type="button"
                            aria-label="Dislike answer"
                            className="hover:text-mentha-mint transition-colors"
                        >
                            <ThumbsDown className="size-5" />
                        </button>
                    </div>
                </div>
            </div>
            {/* Input siempre visible, placeholder visible aunque esté deshabilitado */}
            <div className="relative mt-6">
                <textarea
                    placeholder={t.shiftMockPlaceholder}
                    className="w-full min-h-[48px] max-h-[48px] text-base resize-none bg-white dark:bg-mentha-dark/60 border border-zinc-300 dark:border-mentha-beige/50 rounded-2xl p-3 font-mono placeholder-zinc-500 dark:placeholder-mentha-beige/80 focus:outline-none overflow-hidden placeholder:text-base select-none pr-12"
                    disabled
                    style={{ WebkitTextFillColor: 'inherit', opacity: 1 }}
                />
                <button
                    type="button"
                    className="absolute right-3 top-[8px] size-8 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 shadow text-base flex items-center justify-center opacity-60 cursor-not-allowed"
                    disabled
                    tabIndex={-1}
                    aria-label="Send message"
                    style={{ pointerEvents: 'none' }}
                >
                    <ArrowUp className="size-4" />
                </button>
            </div>
        </div>
    );
}
