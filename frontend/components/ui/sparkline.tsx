"use client"

import { cn } from "@/lib/utils"

interface SparklineProps {
    data: number[]
    color?: string
    width?: number
    height?: number
    className?: string
}

export function Sparkline({ data, color = "currentColor", width = 60, height = 20, className }: SparklineProps) {
    if (!data || data.length < 2) return null

    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width
        const y = height - ((val - min) / range) * height
        return `${x},${y}`
    }).join(" ")

    return (
        <svg width={width} height={height} className={cn("overflow-visible", className)}>
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}
