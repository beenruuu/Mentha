"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion, useScroll } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";
import { ThemeToggleSimple } from "@/components/shared/theme-toggle-simple";
import { cn } from "@/lib/utils";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useTranslations();
    const { scrollY } = useScroll();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const unsubscribe = scrollY.on("change", (latest) => {
            setScrolled(latest > 20);
        });
        return () => unsubscribe();
    }, [scrollY]);

    const navLinks = [
        { label: t.navFeatures, href: "#features" },
        { label: t.navAIEngines, href: "#integrations" },
        { label: t.navPricing, href: "#pricing" },
        { label: t.navFAQs, href: "#faqs" },
    ];

    return (
        <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={cn(
                    "relative flex items-center justify-between p-1.5 transition-all duration-300 ease-in-out",
                    "bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white rounded-full shadow-lg shadow-black/10 dark:shadow-black/30 border border-gray-200 dark:border-transparent",
                    isOpen ? "rounded-[2rem]" : "rounded-full",
                    // Width adjustments: Compact pill on mobile (w-fit), fixed widths on desktop
                    "w-fit max-w-[95%] md:w-auto md:min-w-[680px] lg:min-w-[800px]",
                    "gap-4 px-4" // Add gap and padding for mobile spacing
                )
                }
            >
                {/* Logo Section */}
                <div className="flex items-center gap-4 shrink-0">
                    <Link href="/" className="flex items-center justify-center w-9 h-9 bg-emerald-500 dark:bg-white rounded-full shrink-0 transition-transform hover:scale-105" aria-label="Mentha logo">
                        <div className="relative w-5 h-5">
                            <Image
                                src="/mentha.svg"
                                alt="Mentha Logo"
                                fill
                                className="object-contain brightness-0 invert dark:invert-0"
                            />
                        </div>
                    </Link>
                </div>

                {/* Desktop Links - Flex Grow to distribute space if needed, or just centered */}
                <div className="hidden md:flex items-center justify-center gap-8 px-8 flex-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors relative group whitespace-nowrap"
                        >
                            {link.label}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-500 dark:bg-white transition-all group-hover:w-full opacity-0 group-hover:opacity-100" />
                        </Link>
                    ))}
                </div>

                {/* Desktop Right Actions */}
                <div className="hidden md:flex items-center gap-3 shrink-0">
                    <div className="scale-90 origin-right opacity-80 hover:opacity-100 transition-opacity">
                        <ThemeToggleSimple />
                    </div>
                    <Link href="/auth/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors px-2">
                        {t.navLogin}
                    </Link>
                    <Link href="/auth/signup">
                        <Button className="bg-emerald-500 dark:bg-white text-white dark:text-black hover:bg-emerald-600 dark:hover:bg-gray-200 rounded-full px-5 h-9 text-sm font-semibold transition-transform hover:scale-105">
                            {t.navSignUp}
                        </Button>
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <div className="flex md:hidden items-center ml-auto gap-3">
                    <Link href="/auth/signup">
                        <Button size="sm" className="bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-full text-xs h-9 px-4 font-medium transition-transform hover:scale-105">
                            {t.navSignUp}
                        </Button>
                    </Link>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-white dark:bg-white/10 dark:hover:bg-white/20 rounded-full transition-colors"
                    >
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -10, x: "-50%" }}
                            animate={{ opacity: 1, height: "auto", y: 10, x: "-50%" }}
                            exit={{ opacity: 0, height: 0, y: -10, x: "-50%" }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}

                            className="absolute top-full left-1/2 w-[90vw] max-w-[350px] bg-white dark:bg-[#1A1A1A] rounded-[2rem] overflow-hidden shadow-xl shadow-black/10 dark:shadow-black/30 mt-2 md:hidden border border-gray-100 dark:border-white/5 z-50"
                        >
                            <div className="p-6 flex flex-col gap-4">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsOpen(false)}
                                        className="text-lg font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white py-2 border-b border-gray-100 dark:border-white/10 last:border-0"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-100 dark:border-white/10">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{t.theme}</span>
                                    <ThemeToggleSimple />
                                </div>
                                <Link href="/auth/login" className="w-full mt-2">
                                    <Button variant="outline" className="w-full rounded-full border-gray-200 dark:border-white/20 bg-transparent text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 h-12">
                                        {t.navLogin}
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>
        </div>
    );
}
