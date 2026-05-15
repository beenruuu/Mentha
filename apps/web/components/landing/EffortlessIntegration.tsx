'use client';

import Image from 'next/image';
import type React from 'react';

interface EffortlessIntegrationProps {
    width?: number | string;
    height?: number | string;
    className?: string;
}

/**
 * Effortless Integration – AI Engines constellation with rotation
 * Two concentric rings with AI provider logos positioned on ring axes
 */
const EffortlessIntegration: React.FC<EffortlessIntegrationProps> = ({
    width = 482,
    height = 300,
    className = '',
}) => {
    return (
        <div
            className={className}
            style={{
                width,
                height,
                position: 'relative',
                overflow: 'hidden',
                maskImage:
                    'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                WebkitMaskImage:
                    'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            }}
        >
            {/* CSS for animations */}
            <style>{`
        @keyframes orbit {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes counter-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
      `}</style>

            {/* Central hub - Mentha (static) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-16 bg-white dark:bg-mentha-dark shadow-xl border border-mentha-forest dark:border-mentha-beige z-20 flex items-center justify-center">
                <Image src="/mentha.svg" alt="Mentha" width={40} height={40} />
            </div>

            {/* Inner ring - rotating */}
            <div
                className="absolute left-1/2 top-1/2"
                style={{
                    width: 160,
                    height: 160,
                    animation: 'orbit 800ms linear infinite',
                }}
            >
                {/* Ring border */}
                <div className="absolute inset-0 rounded-full border border-mentha-forest dark:border-emerald-400/25" />

                {/* OpenAI - left */}
                <div
                    className="absolute size-10 bg-white dark:bg-mentha-dark/90 shadow-lg border border-mentha-forest dark:border-mentha-beige rounded-full flex items-center justify-center"
                    style={{
                        left: 0,
                        top: '50%',
                        marginLeft: -20,
                        marginTop: -20,
                        animation: 'counter-orbit 800ms linear infinite',
                    }}
                >
                    <Image
                        src="/providers/openai.svg"
                        alt="OpenAI"
                        width={20}
                        height={20}
                        className="dark:invert"
                        style={{ width: 20, height: 20 }}
                    />
                </div>

                {/* Claude - right */}
                <div
                    className="absolute size-10 bg-white dark:bg-mentha-dark/90 shadow-lg border border-mentha-forest dark:border-mentha-beige rounded-full flex items-center justify-center"
                    style={{
                        right: 0,
                        top: '50%',
                        marginRight: -20,
                        marginTop: -20,
                        animation: 'counter-orbit 800ms linear infinite',
                    }}
                >
                    <Image
                        src="/providers/claude-color.svg"
                        alt="Claude"
                        width={20}
                        height={20}
                        style={{ width: 20, height: 20 }}
                    />
                </div>
            </div>

            {/* Outer ring - rotating opposite direction */}
            <div
                className="absolute left-1/2 top-1/2"
                style={{
                    width: 240,
                    height: 240,
                    animation: 'orbit 800ms linear infinite reverse',
                }}
            >
                {/* Ring border */}
                <div className="absolute inset-0 rounded-full border border-mentha-forest dark:border-emerald-400/20" />

                {/* Gemini - top */}
                <div
                    className="absolute size-10 bg-white dark:bg-mentha-dark/90 shadow-lg border border-mentha-forest dark:border-mentha-beige rounded-full flex items-center justify-center"
                    style={{
                        left: '50%',
                        top: 0,
                        marginLeft: -20,
                        marginTop: -20,
                        animation: 'counter-orbit 800ms linear infinite reverse',
                    }}
                >
                    <Image
                        src="/providers/gemini-color.svg"
                        alt="Gemini"
                        width={20}
                        height={20}
                        style={{ width: 20, height: 20 }}
                    />
                </div>

                {/* Perplexity - bottom */}
                <div
                    className="absolute size-10 bg-white dark:bg-mentha-dark/90 shadow-lg border border-mentha-forest dark:border-mentha-beige rounded-full flex items-center justify-center"
                    style={{
                        left: '50%',
                        bottom: 0,
                        marginLeft: -20,
                        marginBottom: -20,
                        animation: 'counter-orbit 800ms linear infinite reverse',
                    }}
                >
                    <Image
                        src="/providers/perplexity-color.svg"
                        alt="Perplexity"
                        width={20}
                        height={20}
                        style={{ width: 20, height: 20 }}
                    />
                </div>
            </div>
        </div>
    );
};

export default EffortlessIntegration;
