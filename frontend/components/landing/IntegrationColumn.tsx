"use client";

import React, { Fragment } from "react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

export type Integration = {
    name: string;
    icon: string;
    description: string;
};

const IntegrationColumn = (props: {
    integrations: Integration[];
    className?: string;
    reverse?: boolean;
}) => {
    const { integrations, className, reverse } = props;
    return (
        <motion.div
            initial={{
                y: reverse ? "-50%" : 0,
            }}
            animate={{
                y: reverse ? 0 : "-50%",
            }}
            transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
            }}
            className={twMerge("flex flex-col gap-4 pb-4", className)}
        >
            {Array.from({ length: 2 }).map((_, i) => (
                <Fragment key={i}>
                    {integrations.map((integration) => (
                        <div
                            key={integration.name}
                            className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 hover:border-emerald-500/30 transition-all duration-300"
                        >
                            <div className="flex justify-center">
                                <Image
                                    className="size-24"
                                    src={integration.icon}
                                    alt={`${integration.name}-icon`}
                                    width={96}
                                    height={96}
                                />
                            </div>
                            <h3 className="text-3xl text-center mt-6">
                                {integration.name}
                            </h3>
                            <p className="text-center text-white/50 mt-2">
                                {integration.description}
                            </p>
                        </div>
                    ))}
                </Fragment>
            ))}
        </motion.div>
    );
};

export default IntegrationColumn;
