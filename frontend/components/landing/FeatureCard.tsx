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
                "bg-zinc-900/50 border border-white/10 p-6 rounded-3xl cursor-pointer hover:border-emerald-500/30 transition-all duration-300 h-full flex flex-col",
                className
            )}
        >
            <div className="aspect-video">{children}</div>
            <div className="flex-1 flex flex-col">
                <h3 className="text-3xl font-medium mt-6">{title}</h3>
                <p className="text-white/50 mt-2 flex-1">{description}</p>
            </div>
        </div>
    );
};

export default FeatureCard;
