'use client';

import { ArrowUp, Copy, Square, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';

import {
    PromptInput,
    PromptInputAction,
    PromptInputActions,
    PromptInputTextarea,
} from '@/components/prompt-kit/prompt-input';
import { Button } from '@/components/ui/button';

const TheShift: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState('');

    const handlePrompt = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt) return;
        setIsLoading(true);
        setResponse('');
        setTimeout(() => {
            setResponse(
                `Based on the current knowledge graph, the optimal strategy for "${prompt}" involves leveraging semantic content clusters and injecting brand authority into high-ranking citation sources.`,
            );
            setIsLoading(false);
        }, 2000);
    };

    return (
        <section
            id="shift"
            className="w-full border-b border-mentha-forest dark:border-mentha-beige"
        >
            {/* Ticker */}
            <div className="w-full border-b border-mentha-forest dark:border-mentha-beige bg-mentha-mint text-mentha-forest py-3 select-none overflow-hidden">
                <div className="whitespace-nowrap flex animate-marquee">
                    {Array(10)
                        .fill(null)
                        .map((_, i) => (
                            <span
                                key={i}
                                className="mx-8 font-mono text-xs font-bold uppercase tracking-widest flex items-center"
                            >
                                <span className="w-2 h-2 bg-mentha-forest rounded-full mr-2"></span>
                                FROM SEARCH TO ANSWER /// OPTIMIZE FOR INTENT
                            </span>
                        ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[700px]">
                {/* TEXT COLUMN */}
                <div className="p-12 lg:p-24 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-mentha-forest dark:border-mentha-beige bg-inherit">
                    <div className="font-mono text-xs uppercase tracking-widest mb-8 text-mentha-mint">
                        [ 02 — Paradigm Shift ]
                    </div>

                    <h2 className="font-serif text-6xl lg:text-7xl leading-[0.95] mb-12">
                        The Age of the <br />
                        <span className="italic text-mentha-mint">Answer.</span>
                    </h2>

                    <div className="space-y-12">
                        <div className="relative pl-8 border-l border-mentha-forest dark:border-mentha-beige border-opacity-30">
                            <span className="absolute -left-[5px] top-0 w-2.5 h-2.5 bg-current rounded-full opacity-30"></span>
                            <h4 className="font-mono text-sm uppercase tracking-widest mb-2 opacity-60 line-through">
                                Search Engine (Legacy)
                            </h4>
                            <p className="font-sans text-xl opacity-80 leading-relaxed">
                                10 blue links. Fragmentation. The user manually searches, filters,
                                and synthesizes.
                            </p>
                        </div>

                        <div className="relative pl-8 border-l-2 border-mentha-mint">
                            <span className="absolute -left-[5px] top-0 w-2.5 h-2.5 bg-mentha-mint rounded-full"></span>
                            <h4 className="font-mono text-sm uppercase tracking-widest mb-2 text-mentha-mint">
                                Answer Engine (Current)
                            </h4>
                            <p className="font-sans text-xl font-medium leading-relaxed">
                                A single answer. Synthesis. The AI processes authority and delivers
                                the truth.
                            </p>
                        </div>
                    </div>
                </div>

                {/* VISUAL COLUMN - Mock Prompt */}
                <div className="md:col-span-1 flex items-center justify-center p-12 lg:p-24">
                    <PromptInputBasic />
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
function PromptInputBasic() {
    // Conversación simulada fija
    return (
        <div className="w-full max-w-xl">
            <div className="mb-2">
                <div className="flex justify-end mb-3">
                    <div className="max-w-[600px] rounded-xl bg-slate-100 dark:bg-mentha-dark/60 border border-slate-200 dark:border-mentha-beige/30 px-4 py-2 font-serif text-base text-slate-800 dark:text-mentha-beige">
                        How is search different now?
                    </div>
                </div>
                <div className="max-w-[600px]">
                    <div className="rounded-xl bg-white dark:bg-mentha-dark/80 px-4 py-2 font-serif text-base text-mentha-forest dark:text-mentha-beige">
                        The Answer Engine marks a paradigm shift in search. Instead of presenting
                        users with 10 blue links and fragmented information, it synthesizes
                        authority and delivers a single, trusted answer. The AI processes vast
                        sources, evaluates credibility, and provides direct responses—so users no
                        longer need to manually search, filter, or synthesize. This transition
                        empowers brands to optimize for intent and become the source of truth in the
                        age of the Answer.
                    </div>
                    <div
                        className="flex gap-3 mt-3 text-slate-400 dark:text-mentha-beige/60 ml-4"
                        style={{ marginLeft: '1rem' }}
                    >
                        <button
                            type="button"
                            aria-label="Copy answer"
                            className="hover:text-mentha-mint transition-colors"
                        >
                            <Copy className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            aria-label="Like answer"
                            className="hover:text-mentha-mint transition-colors"
                        >
                            <ThumbsUp className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            aria-label="Dislike answer"
                            className="hover:text-mentha-mint transition-colors"
                        >
                            <ThumbsDown className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
            {/* Input siempre visible, placeholder visible aunque esté deshabilitado */}
            <div className="relative mt-6">
                <textarea
                    placeholder="Ask me anything..."
                    className="w-full min-h-[48px] max-h-[48px] text-base resize-none bg-white dark:bg-mentha-dark/60 border border-slate-300 dark:border-mentha-beige/50 rounded-2xl px-3 py-3 font-mono placeholder-slate-500 dark:placeholder-mentha-beige/80 focus:outline-none overflow-hidden placeholder:text-base select-none pr-12"
                    disabled
                    style={{ WebkitTextFillColor: 'inherit', opacity: 1 }}
                />
                <button
                    type="button"
                    className="absolute right-3 top-[8px] h-8 w-8 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow text-base flex items-center justify-center opacity-60 cursor-not-allowed"
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
