"use client";

import { cn } from "@/lib/utils";
import { Sparkles, BarChart3, ShieldCheck } from "lucide-react";
import React from "react";

interface DisplayCardProps {
    className?: string;
    icon?: React.ReactNode;
    title?: string;
    description?: string;
    date?: string;
    iconClassName?: string;
    titleClassName?: string;
}

function DisplayCard({
    className,
    icon = <Sparkles className="size-4 text-emerald-300" />,
    title = "Featured",
    description = "Discover amazing content",
    date = "Just now",
    iconClassName = "text-emerald-500",
    titleClassName = "text-emerald-500",
}: DisplayCardProps) {
    return (
        <div
            className={cn(
                "relative flex h-32 xs:h-36 w-[16rem] xs:w-[18rem] sm:w-[22rem] -skew-y-[6deg] sm:-skew-y-[8deg] select-none flex-col justify-between rounded-xl border border-black/5 dark:border-white/20 bg-neutral-50 dark:bg-neutral-950 px-3 sm:px-4 py-2 sm:py-3 transition-all duration-700 hover:border-emerald-500/50 hover:bg-white dark:hover:bg-neutral-900 [&>*]:flex [&>*]:items-center [&>*]:gap-2 shadow-xl dark:shadow-2xl shadow-black/5 dark:shadow-black",
                className
            )}
        >
            <div>
                <span className={cn("relative inline-block rounded-full p-1 sm:p-1.5 shadow-inner", iconClassName.replace('text-', 'bg-').replace('500', '100 dark:bg-900/60'))}>
                    {icon}
                </span>
                <p className={cn("text-base sm:text-lg font-semibold tracking-tight", titleClassName)}>{title}</p>
            </div>
            <p className="whitespace-nowrap text-base sm:text-lg font-medium text-neutral-900 dark:text-white/95">{description}</p>
            <div className="flex justify-between items-center w-full">
                <p className="text-neutral-500 dark:text-white/40 text-xs sm:text-sm font-medium">{date}</p>
                <div className="h-1 sm:h-1.5 w-10 sm:w-12 bg-neutral-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className={cn("h-full w-2/3 rounded-full", iconClassName.replace('text-', 'bg-'))}></div>
                </div>
            </div>
        </div>
    );
}

interface DisplayCardsProps {
    cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
    const defaultCards = [
        {
            title: "Análisis AEO",
            description: "Optimización en tiempo real",
            date: "Actualizado",
            icon: <Sparkles className="size-4 text-emerald-300" />,
            className: "[grid-area:stack] -translate-x-6 -translate-y-4 sm:-translate-x-12 sm:-translate-y-8 hover:-translate-y-12 sm:hover:-translate-y-16 hover:-translate-x-12 sm:hover:-translate-x-16 before:absolute before:w-[100%] before:rounded-xl before:h-[100%] before:content-[''] before:bg-white/40 dark:before:bg-black/60 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
        },
        {
            title: "Puntuación GEO",
            description: "98.5 Score de Visibilidad",
            date: "Excelente",
            icon: <BarChart3 className="size-4 text-blue-300" />,
            iconClassName: "text-blue-500",
            titleClassName: "text-blue-500",
            className: "[grid-area:stack] hover:-translate-y-6 sm:hover:-translate-y-10 before:absolute before:w-[100%] before:rounded-xl before:h-[100%] before:content-[''] before:bg-white/40 dark:before:bg-black/40 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
        },
        {
            title: "Competencia",
            description: "Superando al top 10%",
            date: "Diario",
            icon: <ShieldCheck className="size-4 text-purple-300" />,
            iconClassName: "text-purple-500",
            titleClassName: "text-purple-500",
            className: "[grid-area:stack] translate-x-6 translate-y-4 sm:translate-x-12 sm:translate-y-8 hover:translate-y-10 sm:hover:translate-y-12 hover:translate-x-12 sm:hover:translate-x-16",
        },
    ];

    const displayCards = cards || defaultCards;

    return (
        <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700 w-full justify-center scale-75 xs:scale-85 sm:scale-100 origin-center">
            {displayCards.map((cardProps, index) => (
                <DisplayCard key={index} {...cardProps} />
            ))}
        </div>
    );
}
