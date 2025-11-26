"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const navLinks = [
    { label: "Features", href: "#features" },
    { label: "AI Engines", href: "#integrations" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQs", href: "#faqs" },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <section className="py-4 lg:py-8 fixed w-full top-0 z-50">
                <div className="container max-w-5xl mx-auto px-4">
                    <div className="border border-white/15 rounded-[27px] lg:rounded-full bg-zinc-950/70 backdrop-blur">
                        <figure className="grid grid-cols-2 lg:grid-cols-3 py-2 lg:px-2 px-4 items-center">
                            <div>
                                <Link href="/" className="flex items-center gap-2">
                                    <Image
                                        src="/mentha.svg"
                                        alt="Mentha Logo"
                                        width={32}
                                        height={32}
                                        className="h-8 w-8"
                                    />
                                    <span className="text-xl font-semibold text-white">Mentha</span>
                                </Link>
                            </div>
                            <div className="hidden lg:flex justify-center items-center">
                                <nav className="flex gap-6 font-medium">
                                    {navLinks.map((each) => (
                                        <a
                                            href={each.href}
                                            key={each.href}
                                            className="text-white/70 hover:text-white transition-colors"
                                        >
                                            {each.label}
                                        </a>
                                    ))}
                                </nav>
                            </div>
                            <div className="flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(!isOpen)}
                                    className="lg:hidden"
                                >
                                    {!isOpen ? (
                                        <motion.div
                                            initial={{ opacity: 1 }}
                                            animate={{
                                                opacity: isOpen ? 0 : 1,
                                            }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <Menu
                                                className="text-white"
                                                size={30}
                                            />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{
                                                opacity: isOpen ? 1 : 0,
                                            }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <X
                                                className="text-white"
                                                size={30}
                                            />
                                        </motion.div>
                                    )}
                                </button>
                                <Link href="/auth/login">
                                    <Button
                                        variant="outline"
                                        className="hidden lg:inline-flex items-center border-white/20 bg-transparent text-white hover:bg-white/10 rounded-full"
                                    >
                                        Login
                                    </Button>
                                </Link>
                                <Link href="/auth/signup">
                                    <Button className="hidden lg:inline-flex items-center bg-emerald-500 text-black hover:bg-emerald-400 rounded-full">
                                        Sign Up
                                    </Button>
                                </Link>
                            </div>
                        </figure>

                        <AnimatePresence>
                            {isOpen && (
                                <motion.figure
                                    initial={{ height: 0 }}
                                    animate={{ height: "auto" }}
                                    exit={{ height: 0 }}
                                    className="overflow-hidden lg:hidden"
                                >
                                    <div className="flex flex-col items-center gap-4 py-4">
                                        {navLinks.map((link) => (
                                            <a
                                                key={link.href}
                                                href={link.href}
                                                className="text-white/70 hover:text-white transition-colors"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                {link.label}
                                            </a>
                                        ))}
                                        <Link href="/auth/login" className="w-3/4">
                                            <Button
                                                className="w-full"
                                                variant="outline"
                                            >
                                                Log In
                                            </Button>
                                        </Link>
                                        <Link href="/auth/signup" className="w-3/4">
                                            <Button className="w-full bg-emerald-500 text-black hover:bg-emerald-400">
                                                Sign Up
                                            </Button>
                                        </Link>
                                    </div>
                                </motion.figure>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </section>
            <div className="pb-[86px] md:pb-[98px]"></div>
        </>
    );
}
