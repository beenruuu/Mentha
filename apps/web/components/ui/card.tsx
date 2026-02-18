'use client';

import type React from 'react';

import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'highlighted';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
    const variants = {
        default:
            'bg-white dark:bg-mentha-dark/80 border border-mentha-forest/10 dark:border-mentha-beige/10',
        glass: 'bg-white/50 dark:bg-white/5 backdrop-blur-md border border-mentha-beige/20 dark:border-white/10',
        highlighted:
            'bg-mentha-mint/5 dark:bg-mentha-mint/10 border border-mentha-mint/20 hover:border-mentha-mint/40',
    };

    return (
        <div
            className={cn(
                'rounded-2xl p-6 transition-all duration-300',
                variants[variant],
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
    return (
        <div className={cn('mb-4', className)} {...props}>
            {children}
        </div>
    );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
    return (
        <h3
            className={cn(
                'font-serif text-lg font-medium text-mentha-forest dark:text-mentha-beige',
                className,
            )}
            {...props}
        >
            {children}
        </h3>
    );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
    return (
        <p
            className={cn(
                'font-sans text-sm text-mentha-forest/60 dark:text-mentha-beige/60 mt-1',
                className,
            )}
            {...props}
        >
            {children}
        </p>
    );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className, children, ...props }: CardContentProps) {
    return (
        <div className={cn('', className)} {...props}>
            {children}
        </div>
    );
}
