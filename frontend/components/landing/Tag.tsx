"use client";

import React, { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

const Tag = (props: HTMLAttributes<HTMLDivElement>) => {
    const { className, children, ...rest } = props;

    return (
        <div
            className={twMerge(
                "inline-flex border border-emerald-500 gap-2 text-emerald-400 px-3 py-1 rounded-full uppercase items-center",
                className
            )}
            {...rest}
        >
            <span>&#10038;</span>
            <span className="text-sm">{children}</span>
        </div>
    );
};

export default Tag;
