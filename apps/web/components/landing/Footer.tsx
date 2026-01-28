"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

export function Footer() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <footer className="bg-gray-50 dark:bg-[#0A0A0A] text-black dark:text-white py-20 border-t border-gray-200 dark:border-white/5 transition-colors duration-300">
            <div className="max-w-4xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="text-xl font-medium tracking-tight uppercase mb-6 block font-sans">
                            Mentha
                        </Link>
                        <p className="text-gray-500 dark:text-gray-400 font-light text-sm leading-relaxed max-w-xs">
                            The first open-source platform dedicated specifically to Answer Engine Optimization.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6 font-sans">Product</h4>
                        <ul className="space-y-4">
                            <li><NavLink href="/dashboard">Dashboard</NavLink></li>
                            <li><NavLink href="/keywords">Keywords</NavLink></li>
                            <li><NavLink href="/authority">Authority</NavLink></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6 font-sans">Company</h4>
                        <ul className="space-y-4">
                            <li><NavLink href="/blog">Journal</NavLink></li>
                            <li><NavLink href="/privacy">Privacy</NavLink></li>
                            <li><NavLink href="/careers">Careers</NavLink></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6 font-sans">Resources</h4>
                        <ul className="space-y-4">
                            <li><NavLink href="/docs">Documentation</NavLink></li>
                            <li><NavLink href="/api">API Reference</NavLink></li>
                            <li><NavLink href="/community">Community</NavLink></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-gray-400 dark:text-gray-500 text-[11px] font-light font-sans">
                        © 2026 Mentha Labs. Built for the future of search.
                    </div>

                    <div className="bg-white dark:bg-[#1A1A1A] p-1 rounded-full border border-gray-200 dark:border-white/10 flex items-center shadow-sm dark:shadow-2xl transition-colors">
                        <ThemeButton
                            isActive={theme === 'system'}
                            onSelect={() => setTheme('system')}
                            icon={
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="4" y="4" width="16" height="11" rx="2" />
                                    <path d="M12 15v5M9 20h6" />
                                </svg>
                            }
                        />
                        <ThemeButton
                            isActive={theme === 'light'}
                            onSelect={() => setTheme('light')}
                            icon={
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="5" />
                                    <line x1="12" y1="1" x2="12" y2="3" />
                                    <line x1="12" y1="21" x2="12" y2="23" />
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                    <line x1="1" y1="12" x2="3" y2="12" />
                                    <line x1="21" y1="12" x2="23" y2="12" />
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                    <line x1="18.36" y1="4.22" x2="19.78" y2="5.64" />
                                </svg>
                            }
                        />
                        <ThemeButton
                            isActive={theme === 'dark'}
                            onSelect={() => setTheme('dark')}
                            icon={
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                            }
                        />
                    </div>
                </div>
            </div>
        </footer>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link href={href} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors text-sm font-light">
            {children}
        </Link>
    );
}

function ThemeButton({ isActive, onSelect, icon }: { isActive: boolean; onSelect: () => void; icon: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`py-1.5 px-3 rounded-full transition-all duration-300 ${isActive ? 'bg-gray-100 dark:bg-[#2A2A2A] text-black dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
        >
            {icon}
        </button>
    );
}
