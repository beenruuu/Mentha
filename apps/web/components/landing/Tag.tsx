import React from "react";
import { cn } from "@/lib/utils";

interface TagProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export default function Tag({ children, className, ...props }: TagProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
                "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
