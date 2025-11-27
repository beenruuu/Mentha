"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "@/lib/i18n";

export default function Footer() {
    const { t } = useTranslations();
    
    const footerLinks = [
        { href: "/legal/privacy", label: t.footerPrivacy },
        { href: "/legal/terms", label: t.footerTerms },
        { href: "/blog", label: t.footerBlog },
    ];

    return (
        <section className="py-16">
            <div className="container max-w-5xl mx-auto px-4 relative">
                <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-6">
                    <div>
                        <Link href="/" className="text-xl font-semibold text-white">
                            Mentha
                        </Link>
                    </div>
                    <div>
                        <nav className="flex gap-6">
                            {footerLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-white/50 text-sm hover:text-white transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-white/10 text-center">
                    <p className="text-white/30 text-sm">
                        © {new Date().getFullYear()} Mentha. {t.footerRights}
                    </p>
                </div>
            </div>
        </section>
    );
}
