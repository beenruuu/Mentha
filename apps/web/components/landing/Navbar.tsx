"use client";

import React, { useState } from "react";
import { GeistSans } from "geist/font/sans";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <nav
            className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-[450ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] flex flex-col bg-white dark:bg-[#1A1A1A] overflow-hidden border border-gray-200 dark:border-white/10 ${isOpen ? "w-[800px] h-[450px] rounded-[16px]" : "w-[340px] h-[64px] rounded-[16px]"
                } ${GeistSans.className}`}
        >
            {/* Header Row (Always visible elements) */}
            <div className={`relative w-full h-[64px] flex items-center justify-end px-6 shrink-0 z-20`}>

                {/* Left: Logo Removed as requested */}

                {/* Center: Brand Name (Visible) */}
                <div className={`absolute left-1/2 transform -translate-x-1/2 transition-all duration-300 ${isOpen ? "opacity-100 scale-100" : "opacity-100 scale-100"}`}>
                    <span className="text-black dark:text-white text-[22px] font-medium tracking-tight uppercase">MENTHA</span>
                </div>

                {/* Right: Hamburger / Close */}
                <button
                    onClick={toggleMenu}
                    className="flex flex-col items-center justify-center gap-[5px] w-[32px] h-[32px] cursor-pointer"
                >
                    <span className={`block w-[24px] h-[2px] bg-black dark:bg-white transition-all duration-300 ${isOpen ? "rotate-45 translate-y-[3.5px]" : ""}`} />
                    <span className={`block w-[24px] h-[2px] bg-black dark:bg-white transition-all duration-300 ${isOpen ? "-rotate-45 -translate-y-[3.5px]" : ""}`} />
                </button>
            </div>

            {/* Expanded Content (Grid) */}
            <div className={`flex-1 w-full px-8 pb-8 flex gap-8 transition-opacity duration-500 delay-100 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>

                {/* Left Column: Navigation */}
                <div className="w-1/3 flex flex-col justify-between pt-4">
                    <div className="flex flex-col gap-6">
                        <NavLink href="/dashboard" label="Dashboard" />
                        <NavLink href="/keywords" label="Keywords" />
                        <NavLink href="/authority" label="Authority" />
                        <NavLink href="/settings" label="Settings" />
                        <NavLink href="/optimization" label="Optimization" />
                    </div>

                    <div className="flex flex-col gap-2 text-gray-400 dark:text-gray-500 text-[13px] font-medium">
                        <p>The helpful AEO platform</p>
                    </div>
                </div>

                {/* Right Column: Visual Card */}
                <div className="flex-1 bg-gray-100 dark:bg-white/5 rounded-[20px] overflow-hidden relative group cursor-pointer">
                    {/* Placeholder for video/image */}
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: 'url(/pexels-codioful-7134995.jpg)' }}>
                        <div className="absolute inset-0 bg-black/20" />
                    </div>

                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-3 transition-transform hover:scale-105 border border-white/10">
                            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                            <span className="text-white font-medium text-sm">Our story</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Row (Visible when open) */}
            <div className={`absolute bottom-2 left-0 w-full flex items-center justify-end px-8 transition-opacity duration-300 delay-200 ${isOpen ? "opacity-100" : "opacity-0"}`}>
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 dark:text-gray-500 text-[12px] font-medium">Beta Application</span>
                    <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                </div>
            </div>

        </nav>
    );
}

function NavLink({ href, label }: { href: string, label: string }) {
    return (
        <Link href={href} className="text-[28px] font-medium text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-400 transition-colors tracking-tight">
            {label}
        </Link>
    );
}
