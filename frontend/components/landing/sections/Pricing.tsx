"use client";

import Tag from "@/components/landing/Tag";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const plans = [
    {
        name: "Starter",
        price: "Free",
        description: "For individuals exploring AEO.",
        features: [
            "10 Analyses/month",
            "Basic Brand Tracking",
            "Community Support",
            "Single AI Engine",
        ],
        cta: "Get Started",
        href: "/auth/signup",
        highlight: false,
    },
    {
        name: "Pro",
        price: "Coming Soon",
        description: "For growing brands and agencies.",
        features: [
            "Unlimited Analyses",
            "All AI Engines",
            "Competitor Tracking",
            "Priority Support",
            "API Access",
            "Custom Reports",
        ],
        cta: "Coming Soon",
        href: "#",
        highlight: true,
        comingSoon: true,
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "For large organizations.",
        features: [
            "Custom AI Models",
            "Dedicated Account Manager",
            "SLA Guarantee",
            "White Label Options",
            "Advanced Analytics",
            "SSO & Security",
        ],
        cta: "Contact Sales",
        href: "/contact",
        highlight: false,
    },
];

export default function Pricing() {
    return (
        <section id="pricing" className="py-24">
            <div className="container max-w-5xl mx-auto px-4">
                <div className="flex justify-center">
                    <Tag>Pricing</Tag>
                </div>
                <h2 className="text-6xl font-medium text-center mt-6 max-w-2xl m-auto">
                    Simple,{" "}
                    <span className="text-emerald-400">transparent</span> pricing
                </h2>
                <p className="text-white/50 text-center mt-4 text-lg max-w-xl mx-auto">
                    Choose the plan that fits your growth stage. No hidden fees.
                </p>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true, amount: 0.2 }}
                            className={`flex flex-col p-8 rounded-3xl border ${
                                plan.highlight
                                    ? "border-emerald-500/50 bg-emerald-950/20 relative"
                                    : "border-white/10 bg-zinc-900/50"
                            } hover:border-emerald-500/30 transition-all duration-300`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="bg-emerald-500 text-black text-xs font-semibold px-3 py-1 rounded-full">
                                        Most Popular
                                    </span>
                                </div>
                            )}
                            <h3 className="text-xl font-medium text-white mb-2">
                                {plan.name}
                            </h3>
                            <div className="text-4xl font-bold text-white mb-2">
                                {plan.price}
                            </div>
                            <p className="text-sm text-white/50 mb-8">
                                {plan.description}
                            </p>
                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex items-center text-sm text-zinc-300"
                                    >
                                        <Check className="h-4 w-4 text-emerald-500 mr-3 flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            {plan.comingSoon ? (
                                <Button
                                    disabled
                                    className="w-full bg-white/10 text-white/50 cursor-not-allowed"
                                >
                                    {plan.cta}
                                </Button>
                            ) : (
                                <Link href={plan.href}>
                                    <Button
                                        className={`w-full ${
                                            plan.highlight
                                                ? "bg-emerald-500 text-black hover:bg-emerald-400"
                                                : "bg-white/10 text-white hover:bg-white/20"
                                        }`}
                                    >
                                        {plan.cta}
                                    </Button>
                                </Link>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
