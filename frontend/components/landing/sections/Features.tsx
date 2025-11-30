"use client";

import FeatureCard from "@/components/landing/FeatureCard";
import Tag from "@/components/landing/Tag";
import { Search, BarChart3, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "@/lib/i18n";

export default function Features() {
    const { t } = useTranslations();
    
    const features = [
        t.featureTagAEO,
        t.featureTagBrand,
        t.featureTagCompetitor,
        t.featureTagSmart,
        t.featureTagEntity,
        t.featureTagSentiment,
    ];

    return (
        <section id="features" className="py-24">
            <div className="container max-w-5xl mx-auto px-4">
                <div className="flex justify-center">
                    <Tag>{t.featuresTag}</Tag>
                </div>
                <h2 className="text-6xl font-medium text-center mt-6 max-w-2xl m-auto">
                    {t.featuresTitle}{" "}
                    <span className="text-emerald-400">{t.featuresTitleHighlight}</span>
                </h2>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-3 gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true, amount: 0.2 }}
                        className="h-full"
                    >
                        <FeatureCard
                            title={t.featureAEOTitle}
                            description={t.featureAEODescription}
                            className="md:col-span-2 lg:col-span-1"
                        >
                            <div className="aspect-video flex items-center justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
                                    <Search className="h-16 w-16 text-emerald-500 relative z-10" />
                                </div>
                            </div>
                        </FeatureCard>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true, amount: 0.2 }}
                        className="h-full"
                    >
                        <FeatureCard
                            title={t.featureCompetitorTitle}
                            description={t.featureCompetitorDescription}
                            className="md:col-span-2 lg:col-span-1 group transition duration-500"
                        >
                            <div className="aspect-video flex items-center justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
                                    <BarChart3 className="h-16 w-16 text-emerald-500 relative z-10" />
                                </div>
                            </div>
                        </FeatureCard>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        viewport={{ once: true, amount: 0.2 }}
                        className="h-full"
                    >
                        <FeatureCard
                            title={t.featureBrandTitle}
                            description={t.featureBrandDescription}
                            className="group md:col-span-2 md:col-start-2 lg:col-span-1 lg:col-start-auto"
                        >
                            <div className="aspect-video flex items-center justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
                                    <Shield className="h-16 w-16 text-emerald-500 relative z-10" />
                                </div>
                            </div>
                        </FeatureCard>
                    </motion.div>
                </div>

                <div className="my-8 flex items-center justify-center flex-wrap gap-2 max-w-3xl m-auto">
                    {features.map((feature) => (
                        <div
                            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 inline-flex px-3 md:px-5 md:py-2 py-1.5 rounded-2xl gap-3 items-center hover:scale-105 transition duration-500 group shadow-sm dark:shadow-none"
                            key={feature}
                        >
                            <span className="bg-emerald-500 text-white size-5 rounded-full inline-flex items-center justify-center text-xl group-hover:rotate-45 transition duration-500">
                                &#10038;
                            </span>
                            <span className="font-medium md:text-lg text-gray-900 dark:text-white">
                                {feature}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
