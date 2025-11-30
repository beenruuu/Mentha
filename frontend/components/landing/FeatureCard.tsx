"use client";

import React from "react";
import { twMerge } from "tailwind-merge";

const FeatureCard = (props: {
    title: string;
    description: string;
    className?: string;
    children?: React.ReactNode;
}) => {
    const { title, description, children, className } = props;

    return (
        <div
            className={twMerge(
                "bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-white/10 p-6 rounded-3xl cursor-pointer hover:border-emerald-500/50 dark:hover:border-emerald-500/30 transition-all duration-300 h-full flex flex-col shadow-sm dark:shadow-none",
                className
            )}
        >
            <div className="aspect-video">{children}</div>
            <div className="flex-1 flex flex-col">
                <h3 className="text-3xl font-medium mt-6 text-gray-900 dark:text-white">{title}</h3>
                <p className="text-gray-500 dark:text-white/50 mt-2 flex-1">{description}</p>
            </div>
        </div>
    );
};

export default FeatureCard;
