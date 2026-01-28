"use client";

import React from 'react';
import Tag from './Tag';
import { Shield, Zap, Sparkles, BarChart3, Lock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Features() {
    return (
        <section className="bg-white dark:bg-black py-6 relative z-10 transition-colors duration-300">
            <div className="container max-w-5xl mx-auto px-6">

                <div className="flex flex-col items-center text-center mb-12">
                    <Tag>Features</Tag>
                    <h2 className="text-4xl md:text-5xl font-light text-black dark:text-white mt-6 tracking-tight">
                        Everything you need to <span className="text-[#35d499]">win</span>.
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Feature 1: Privacy - Tall card or normal */}
                    <div className="group p-8 rounded-3xl bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-all duration-300">
                        <div className="w-12 h-12 rounded-full bg-white dark:bg-white/10 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                            <Shield className="w-6 h-6 text-black dark:text-white" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-medium text-black dark:text-white mb-3">Privacy First</h3>
                        <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                            No tracking cookies. Fully compliant with GDPR, CCPA and PECR. Your data remains yours.
                        </p>
                    </div>

                    {/* Feature 2: Realtime - Maybe highlight this one */}
                    <div className="group p-8 rounded-3xl bg-[#35d499]/5 dark:bg-[#35d499]/5 border border-[#35d499]/20 hover:border-[#35d499]/40 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#35d499]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        <div className="w-12 h-12 rounded-full bg-[#35d499] flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                            <Zap className="w-6 h-6 text-white" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-medium text-black dark:text-white mb-3">Realtime Data</h3>
                        <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                            See how Answer Engines reference your content the moment it happens. No delays.
                        </p>
                    </div>

                    {/* Feature 3: Insights */}
                    <div className="group p-8 rounded-3xl bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-all duration-300">
                        <div className="w-12 h-12 rounded-full bg-white dark:bg-white/10 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                            <Sparkles className="w-6 h-6 text-black dark:text-white" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-medium text-black dark:text-white mb-3">AI Insights</h3>
                        <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                            Deep analysis of sentiment, citations, and semantic authority across all major LLMs.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
