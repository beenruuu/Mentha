"use client"

import { cn } from "@/lib/utils"

interface ReasoningCardProps {
    title: string
    score: number
    description: string
    type: 'positive' | 'neutral' | 'negative'
}

export function ReasoningCard({ title, score, description, type }: ReasoningCardProps) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#1E1E24]/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-800 transition-all">
            <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <div className="ml-4">
                <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 text-xs font-bold",
                    type === 'positive' ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" :
                        type === 'negative' ? "border-red-500 text-red-600 dark:text-red-400" :
                            "border-yellow-500 text-yellow-600 dark:text-yellow-400"
                )}>
                    {score}
                </div>
            </div>
        </div>
    )
}
