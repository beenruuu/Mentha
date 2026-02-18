'use client';

import type React from 'react';

import type { Theme } from '../../types';

interface HeroProps {
    theme: Theme;
}

const Hero: React.FC<HeroProps> = ({ theme }) => {
    return (
        <section className="min-h-screen pt-20 flex flex-col transition-colors duration-500">
            {/* Text Content - Full Width and Centered */}
            <div className="w-full max-w-7xl mx-auto p-8 md:p-16 lg:p-24 flex flex-col justify-center text-center">
                <div className="font-mono text-xs mb-6 uppercase tracking-widest text-mentha-mint">
                    [ Est. 2026 — Europe's First AEO Firm ]
                </div>

                <h1 className="font-serif text-5xl md:text-7xl lg:text-9xl leading-[1.1] mb-8">
                    Traditional SEO is{' '}
                    <span className="line-through decoration-mentha-mint decoration-2 text-opacity-50 text-current">
                        dead
                    </span>
                    . Your audience now <span className="italic text-mentha-mint">asks AI.</span>
                </h1>

                <div className="max-w-3xl mx-auto">
                    <p className="font-sans text-lg md:text-xl leading-relaxed opacity-90 mb-10">
                        We optimize your brand's presence for ChatGPT, Perplexity, Gemini, and
                        Claude. Stop chasing clicks, start owning the answer.
                    </p>

                    <div className="flex items-center space-x-4 justify-center">
                        <div className="h-px w-12 bg-current"></div>
                        <span className="font-mono text-sm">SCROLL TO DISCOVER</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
