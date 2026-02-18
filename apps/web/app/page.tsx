"use client";

import { useTheme } from 'next-themes';

import Navbar from '@/components/landing/Layout/Navbar';
import Footer from '@/components/landing/Layout/Footer';
import Hero from '@/components/landing/Sections/Hero';
import TheShift from '@/components/landing/Sections/TheShift';
import Services from '@/components/landing/Sections/Services';
import Methodology from '@/components/landing/Sections/Methodology';
import SocialProof from '@/components/landing/Sections/SocialProof';
import FAQ from '@/components/landing/Sections/FAQ';
import InteractiveTeaser from '@/components/landing/Sections/InteractiveTeaser';
import { Theme } from '@/components/types';

export default function Home() {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };
    
    const currentTheme = theme === 'dark' ? Theme.DARK : Theme.LIGHT;

    return (
        <>
            <Navbar theme={currentTheme} toggleTheme={toggleTheme} />
            <main className="flex flex-col border-l border-r border-mentha-forest dark:border-mentha-beige max-w-[1920px] mx-auto bg-opacity-100">
                <Hero theme={currentTheme} />
                <TheShift />
                <Services />
                <Methodology />
                <SocialProof />
                <FAQ />
                <InteractiveTeaser />
            </main>
            <div className="max-w-[1920px] mx-auto border-l border-r border-mentha-forest dark:border-mentha-beige">
                <Footer />
            </div>
        </>
    );
}
