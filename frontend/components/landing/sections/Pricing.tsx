"use client";

import Tag from "@/components/landing/Tag";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "@/lib/i18n";

export default function Pricing() {
    const { t } = useTranslations();

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
            price: t.pricingProPrice,
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
        <section id="pricing" className="py-24">
            <div className="container max-w-5xl mx-auto px-4">
                <div className="flex justify-center">
                    <Tag>{t.pricingTag}</Tag>
                </div>
                <h2 className="text-6xl font-medium text-center mt-6 max-w-2xl m-auto">
                    {t.pricingTitle}{" "}
                    <span className="text-emerald-400">{t.pricingTitleHighlight}</span>
                </h2>
                <p className="text-gray-500 dark:text-white/50 text-center mt-4 text-lg max-w-xl mx-auto">
                    {t.pricingDescription}
                </p>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true, amount: 0.2 }}
                            className={`flex flex-col p-8 rounded-3xl border ${plan.highlight
                                ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20 relative"
                                : "border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-none"
                                } hover:border-emerald-500/50 dark:hover:border-emerald-500/30 transition-all duration-300 ${index === 2 ? "md:col-span-2 lg:col-span-1" : ""
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                        {t.pricingMostPopular}
                                    </span>
                                </div>
                            )}
                            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                                {plan.name}
                            </h3>
                            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                {plan.price}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-white/50 mb-8">
                                {plan.description}
                            </p>
                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex items-center text-sm text-gray-600 dark:text-zinc-300"
                                    >
                                        <Check className="h-4 w-4 text-emerald-500 mr-3 flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            {plan.comingSoon ? (
                                <Button
                                    disabled
                                    className="w-full bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-white/50 cursor-not-allowed"
                                >
                                    {plan.cta}
                                </Button>
                            ) : (
                                <Link href={plan.href}>
                                    <Button
                                        className={`w-full ${plan.highlight
                                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                            : "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20"
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
