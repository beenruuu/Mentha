'use client';

import type React from 'react';

import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'brand' | 'competitor' | 'outline';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
    const variants = {
        default:
            'bg-mentha-forest/5 dark:bg-white/5 text-mentha-forest/70 dark:text-mentha-beige/70',
        success: 'bg-mentha-mint/10 text-mentha-mint',
        warning: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',
        brand: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',
        competitor: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400',
        outline:
            'bg-transparent border border-mentha-forest/20 dark:border-mentha-beige/20 text-mentha-forest/60 dark:text-mentha-beige/60',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-xs uppercase tracking-wider',
                variants[variant],
                className,
            )}
            {...props}
        >
            {children}
        </span>
    );
}
