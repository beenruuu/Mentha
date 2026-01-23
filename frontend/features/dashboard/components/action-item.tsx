"use client"

import { CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActionItemProps {
    title: string
    description?: string
    completed?: boolean
    onClick?: () => void
}

export function ActionItem({ title, description, completed, onClick }: ActionItemProps) {
    return (
        <div
            onClick={onClick}
            className="group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E1E24] transition-colors cursor-pointer"
        >
            <div className="mt-0.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                {completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                    <Circle className="w-5 h-5" />
                )}
            </div>
            <div className="flex-1">
                <p className={cn(
                    "text-sm font-medium transition-colors",
                    completed ? "text-gray-500 line-through" : "text-gray-900 dark:text-white"
                )}>
                    {title}
                </p>
                {description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {description}
                    </p>
                )}
            </div>
        </div>
    )
}
