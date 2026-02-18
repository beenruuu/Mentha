'use client';

import React from 'react';

import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const variants = {
            primary:
                'bg-mentha-forest text-mentha-beige dark:bg-mentha-beige dark:text-mentha-forest hover:bg-mentha-forest/90 dark:hover:bg-mentha-beige/90',
            secondary:
                'bg-mentha-forest/5 dark:bg-white/10 text-mentha-forest dark:text-mentha-beige hover:bg-mentha-forest/10 dark:hover:bg-white/20',
            outline:
                'border border-mentha-mint dark:border-mentha-beige bg-transparent hover:bg-mentha-mint/5 dark:hover:bg-white/5 text-mentha-forest dark:text-mentha-beige',
            ghost: 'bg-transparent hover:bg-mentha-forest/5 dark:hover:bg-white/5 text-mentha-forest dark:text-mentha-beige',
        };

        const sizes = {
            sm: 'h-8 px-3 text-xs',
            md: 'h-10 px-4 py-2 text-sm',
            lg: 'h-12 px-6 text-sm',
        };

        return (
            <button
                ref={ref}
                type="button"
                className={cn(
                    'inline-flex items-center justify-center rounded-full font-sans font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                    variants[variant],
                    sizes[size],
                    className,
                )}
                {...props}
            />
        );
    },
);
Button.displayName = 'Button';
