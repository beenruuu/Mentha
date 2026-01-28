"use client";

import Tag from "@/components/landing/Tag";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "@/lib/i18n";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Pricing() {
    const { t } = useTranslations();
    const [billing, setBilling] = useState<'monthly' | 'annually'>('monthly');

    const plans = [
        {
            name: t.pricingStarter,
            price: t.pricingStarterPrice,
            description: t.pricingStarterDescription,
            features: [
                t.pricingStarterFeature1,
                t.pricingStarterFeature2,
                t.pricingStarterFeature3,
                t.pricingStarterFeature4,
            ],
            cta: t.pricingStarterCTA,
            href: "/auth/signup",
            highlight: false,
        },
        {
            name: t.pricingPro,
            price: billing === 'monthly' ? t.pricingProPriceMonthly : t.pricingProPriceAnnually,
            period: t.pricingUnit,
            description: t.pricingProDescription,
            features: [
                t.pricingProFeature1,
                t.pricingProFeature2,
                t.pricingProFeature3,
                t.pricingProFeature4,
                t.pricingProFeature5,
                t.pricingProFeature6,
            ],
            cta: t.pricingProCTA,
            href: "#",
            highlight: true,
            comingSoon: true,
        },
        {
            name: t.pricingEnterprise,
            price: t.pricingEnterprisePrice,
            description: t.pricingEnterpriseDescription,
            features: [
                t.pricingEnterpriseFeature1,
                t.pricingEnterpriseFeature2,
                t.pricingEnterpriseFeature3,
                t.pricingEnterpriseFeature4,
                t.pricingEnterpriseFeature5,
                t.pricingEnterpriseFeature6,
            ],
            cta: t.pricingEnterpriseCTA,
            href: "/contact",
            highlight: false,
        },
    ];

    return (
        <section id="pricing" className="py-6 bg-white dark:bg-black transition-colors duration-300">
            <div className="container max-w-5xl mx-auto px-6">
                <div className="flex justify-center">
                    <Tag>{t.pricingTag}</Tag>
                </div>
                <h2 className="text-4xl md:text-5xl font-light text-center mt-8 mb-6 text-black dark:text-white tracking-tight">
                    {t.pricingTitle}{" "}
                    <span className="text-gray-400 dark:text-gray-500">{t.pricingTitleHighlight}</span>
                </h2>
                <p className="text-lg text-gray-500 dark:text-gray-400 text-center mb-12 max-w-lg mx-auto leading-relaxed font-normal">
                    {t.pricingDescription}
                </p>

                {/* Billing Toggle */}
                <div className="flex justify-center items-center gap-4 mb-16">
                    <button
                        onClick={() => setBilling('monthly')}
                        className={cn(
                            "text-sm font-medium transition-colors",
                            billing === 'monthly' ? "text-black dark:text-white" : "text-gray-400"
                        )}
                    >
                        {t.pricingMonthly}
                    </button>

                    <button
                        onClick={() => setBilling(billing === 'monthly' ? 'annually' : 'monthly')}
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#35d499] focus:ring-offset-white dark:focus:ring-offset-black"
                    >
                        <span
                            className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out",
                                billing === 'annually' ? "translate-x-6" : "translate-x-1"
                            )}
                        />
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setBilling('annually')}
                            className={cn(
                                "text-sm font-medium transition-colors",
                                billing === 'annually' ? "text-black dark:text-white" : "text-gray-400"
                            )}
                        >
                            {t.pricingAnnually}
                        </button>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#35d499]/10 text-[#35d499] border border-[#35d499]/20">
                            {t.pricingSave}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true, amount: 0.2 }}
                            className={`flex flex-col p-8 rounded-3xl border ${plan.highlight
                                ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black relative"
                                : "border-gray-200 dark:border-white/10 bg-white dark:bg-black text-black dark:text-white"
                                } hover:border-black/50 dark:hover:border-white/50 transition-all duration-300 ${index === 2 ? "md:col-span-2 lg:col-span-1" : ""
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="bg-gray-200 dark:bg-gray-800 text-black dark:text-white text-xs font-semibold px-3 py-1 rounded-full border border-gray-300 dark:border-gray-700">
                                        {t.pricingMostPopular}
                                    </span>
                                </div>
                            )}
                            <h3 className={`text-xl font-medium mb-2 ${plan.highlight ? "text-white dark:text-black" : "text-black dark:text-white"}`}>
                                {plan.name}
                            </h3>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className={`text-4xl font-light ${plan.highlight ? "text-white dark:text-black" : "text-black dark:text-white"}`}>
                                    {plan.price}
                                </span>
                                {plan.period && (
                                    <span className={`text-sm font-normal ${plan.highlight ? "text-gray-400 dark:text-gray-600" : "text-gray-500 dark:text-gray-400"}`}>
                                        {plan.period}
                                    </span>
                                )}
                            </div>
                            <p className={`text-sm mb-8 ${plan.highlight ? "text-gray-400 dark:text-gray-600" : "text-gray-500 dark:text-gray-400"}`}>
                                {plan.description}
                            </p>
                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature) => (
                                    <li
                                        key={feature}
                                        className={`flex items-center text-sm ${plan.highlight ? "text-gray-300 dark:text-gray-700" : "text-gray-600 dark:text-gray-300"}`}
                                    >
                                        <Check className={`h-4 w-4 mr-3 flex-shrink-0 ${plan.highlight ? "text-white dark:text-black" : "text-black dark:text-white"}`} />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            {plan.comingSoon ? (
                                <Button
                                    disabled
                                    className={`w-full cursor-not-allowed ${plan.highlight
                                        ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                                        : "bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/50"}`}
                                >
                                    {plan.cta}
                                </Button>
                            ) : (
                                <Link href={plan.href} className="w-full">
                                    <Button
                                        className={`w-full ${plan.highlight
                                            ? "bg-white text-black hover:bg-gray-200 dark:bg-black dark:text-white dark:hover:bg-gray-800"
                                            : "bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
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
