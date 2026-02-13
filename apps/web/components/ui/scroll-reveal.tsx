'use client';

import { motion } from 'framer-motion';
import type React from 'react';
import { useRef } from 'react';

import { cn } from '@/lib/utils';

interface ScrollRevealProps {
    children: React.ReactNode;
    className?: string;
    textClassName?: string;
    size?: 'sm' | 'md' | 'lg';
    align?: 'left' | 'center' | 'right';
    variant?: 'default' | 'muted';
    enableBlur?: boolean;
    baseOpacity?: number;
    baseRotation?: number;
    blurStrength?: number;
    staggerDelay?: number;
    threshold?: number;
    duration?: number;
}

export const ScrollReveal = ({
    children,
    className,
    textClassName,
    align = 'left',
    enableBlur = true,
    baseOpacity = 0.1,
    blurStrength = 4,
    staggerDelay = 0.05,
    duration = 0.5,
}: ScrollRevealProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const text = typeof children === 'string' ? children : '';
    const words = text.split(' ');

    if (!text) return null;

    return (
        <div ref={containerRef} className={cn('relative z-0', className)}>
            <div
                className={cn(
                    'flex flex-wrap gap-x-[0.3em] leading-tight',
                    align === 'center' && 'justify-center',
                    align === 'right' && 'justify-end',
                    textClassName,
                )}
            >
                {words.map((word, i) => (
                    <Word
                        key={i}
                        delay={i * staggerDelay}
                        enableBlur={enableBlur}
                        baseOpacity={baseOpacity}
                        blurStrength={blurStrength}
                        duration={duration}
                    >
                        {word}
                    </Word>
                ))}
            </div>
        </div>
    );
};

interface WordProps {
    children: string;
    delay: number;
    enableBlur: boolean;
    baseOpacity: number;
    blurStrength: number;
    duration: number;
}

const Word = ({ children, delay, enableBlur, baseOpacity, blurStrength, duration }: WordProps) => {
    return (
        <motion.span
            initial={{
                opacity: baseOpacity,
                filter: enableBlur ? `blur(${blurStrength}px)` : 'none',
                y: 10,
            }}
            whileInView={{
                opacity: 1,
                filter: 'blur(0px)',
                y: 0,
            }}
            transition={{
                duration: duration,
                delay: delay,
                ease: 'easeOut',
            }}
            className="inline-block"
            viewport={{ once: true, margin: '-10%' }}
        >
            {children}
        </motion.span>
    );
};
