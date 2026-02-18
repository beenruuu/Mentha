'use client';

import type React from 'react';

import { cn } from '@/lib/utils';

interface MetricCardProps {
    label: string;
    value: string | number;
    delta?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon?: React.ReactNode;
    className?: string;
}

export function MetricCard({
    label,
    value,
    delta,
    trend = 'neutral',
    icon,
    className,
}: MetricCardProps) {
    const trendColors = {
        up: 'text-mentha-mint',
        down: 'text-red-500',
        neutral: 'text-mentha-forest/60 dark:text-mentha-beige/60',
    };

    const trendIcons = {
        up: (
            <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
            >
                <path d="M6 2L10 6L6 10" />
                <path d="M10 6H2" />
            </svg>
        ),
        down: (
            <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
            >
                <path d="M6 10L2 6L6 2" />
                <path d="M2 6H10" />
            </svg>
        ),
        neutral: null,
    };

    return (
        <div
            className={cn(
                'rounded-2xl p-6 bg-white dark:bg-mentha-dark/80 border border-mentha-forest/10 dark:border-mentha-beige/10 transition-all duration-300',
                className,
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="font-mono text-xs uppercase tracking-widest text-mentha-forest/50 dark:text-mentha-beige/50 mb-2">
                        {label}
                    </p>
                    <p className="font-serif text-3xl font-light text-mentha-forest dark:text-mentha-beige">
                        {value}
                    </p>
                    {delta && (
                        <div
                            className={cn(
                                'flex items-center gap-1 mt-2 text-sm font-sans',
                                trendColors[trend],
                            )}
                        >
                            {trendIcons[trend]}
                            <span>{delta}</span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className="w-10 h-10 rounded-full bg-mentha-mint/10 flex items-center justify-center text-mentha-mint">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
