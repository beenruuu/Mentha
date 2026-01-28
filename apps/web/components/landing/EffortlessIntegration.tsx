"use client"

import type React from "react"
import Image from "next/image"

interface EffortlessIntegrationProps {
    width?: number | string
    height?: number | string
    className?: string
}

/**
 * Effortless Integration – AI Engines constellation with rotation
 * Two concentric rings with AI provider logos positioned on ring axes
 */
const EffortlessIntegration: React.FC<EffortlessIntegrationProps> = ({ width = 482, height = 300, className = "" }) => {
    return (
        <div
            className={className}
            style={{
                width,
                height,
                position: "relative",
                overflow: "hidden",
                maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
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
            <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-900 shadow-xl border border-black/5 dark:border-white/10 z-20"
                style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <img src="/mentha.svg" alt="Mentha" style={{ width: 40, height: 40 }} />
            </div>

            {/* Inner ring - rotating */}
            <div
                className="absolute left-1/2 top-1/2"
                style={{
                    width: 160,
                    height: 160,
                    animation: "orbit 20s linear infinite",
                }}
            >
                {/* Ring border */}
                <div
                    className="absolute inset-0 rounded-full border border-emerald-500/30 dark:border-emerald-400/25"
                />

                {/* OpenAI - left */}
                <div
                    className="absolute bg-white dark:bg-neutral-800 shadow-lg border border-black/5 dark:border-white/10"
                    style={{
                        width: 40,
                        height: 40,
                        left: 0,
                        top: "50%",
                        marginLeft: -20,
                        marginTop: -20,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: "counter-orbit 20s linear infinite",
                    }}
                >
                    <img src="/providers/openai.svg" alt="OpenAI" className="dark:invert" style={{ width: 20, height: 20 }} />
                </div>

                {/* Claude - right */}
                <div
                    className="absolute bg-white dark:bg-neutral-800 shadow-lg border border-black/5 dark:border-white/10"
                    style={{
                        width: 40,
                        height: 40,
                        right: 0,
                        top: "50%",
                        marginRight: -20,
                        marginTop: -20,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: "counter-orbit 20s linear infinite",
                    }}
                >
                    <img src="/providers/claude-color.svg" alt="Claude" style={{ width: 20, height: 20 }} />
                </div>
            </div>

            {/* Outer ring - rotating opposite direction */}
            <div
                className="absolute left-1/2 top-1/2"
                style={{
                    width: 240,
                    height: 240,
                    animation: "orbit 30s linear infinite reverse",
                }}
            >
                {/* Ring border */}
                <div
                    className="absolute inset-0 rounded-full border border-emerald-500/20 dark:border-emerald-400/20"
                />

                {/* Gemini - top */}
                <div
                    className="absolute bg-white dark:bg-neutral-800 shadow-lg border border-black/5 dark:border-white/10"
                    style={{
                        width: 40,
                        height: 40,
                        left: "50%",
                        top: 0,
                        marginLeft: -20,
                        marginTop: -20,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: "counter-orbit 30s linear infinite reverse",
                    }}
                >
                    <img src="/providers/gemini-color.svg" alt="Gemini" style={{ width: 20, height: 20 }} />
                </div>

                {/* Perplexity - bottom */}
                <div
                    className="absolute bg-white dark:bg-neutral-800 shadow-lg border border-black/5 dark:border-white/10"
                    style={{
                        width: 40,
                        height: 40,
                        left: "50%",
                        bottom: 0,
                        marginLeft: -20,
                        marginBottom: -20,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: "counter-orbit 30s linear infinite reverse",
                    }}
                >
                    <img src="/providers/perplexity-color.svg" alt="Perplexity" style={{ width: 20, height: 20 }} />
                </div>
            </div>
        </div>
    )
}

export default EffortlessIntegration
