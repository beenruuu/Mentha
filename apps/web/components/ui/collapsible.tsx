'use client';

import { useState } from 'react';

interface CollapsibleProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

export function Collapsible({ title, children, defaultOpen = false }: CollapsibleProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-mentha-forest/10 dark:border-mentha-beige/10 rounded-xl overflow-hidden">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-mentha-forest/5 dark:bg-white/5 hover:bg-mentha-forest/10 dark:hover:bg-white/10 transition-colors"
            >
                <p className="font-mono text-[10px] uppercase tracking-widest text-mentha-forest/60 dark:text-mentha-beige/60">
                    {title}
                </p>
                <svg
                    aria-hidden="true"
                    className={`w-4 h-4 text-mentha-forest/60 dark:text-mentha-beige/60 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                </svg>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-mentha-forest/10 dark:border-mentha-beige/10">
                    {children}
                </div>
            )}
        </div>
    );
}
