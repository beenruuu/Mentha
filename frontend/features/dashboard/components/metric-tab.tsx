"use client"

import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface MetricTabProps {
    label: string
    value: string | number
    trend?: number
    isActive: boolean
    onClick: () => void
}

export function MetricTab({ label, value, trend, isActive, onClick }: MetricTabProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-start p-4 rounded-xl border transition-all duration-200 text-left w-full",
                isActive
                    ? "bg-white dark:bg-[#1E1E24] border-gray-200 dark:border-gray-800 shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                    : "bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-[#1E1E24]/50 text-gray-500 dark:text-gray-400"
            )}
        >
            <span className={cn("text-sm font-medium mb-2", isActive ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400")}>
                {label}
            </span>
            <div className="flex items-end gap-3 w-full">
                <span className={cn("text-3xl font-bold tracking-tight", isActive ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400")}>
                    {value}
                </span>
                {trend !== undefined && (
                    <div className={cn(
                        "flex items-center text-xs font-medium mb-1.5 px-1.5 py-0.5 rounded-full",
                        trend > 0 ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" :
                            trend < 0 ? "text-red-600 bg-red-50 dark:bg-red-500/10" :
                                "text-gray-600 bg-gray-50 dark:bg-gray-500/10"
                    )}>
                        {trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> :
                            trend < 0 ? <TrendingDown className="w-3 h-3 mr-1" /> :
                                <Minus className="w-3 h-3 mr-1" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
        </button>
    )
}
