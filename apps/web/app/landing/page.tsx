import React from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Introduction } from '@/components/landing/Introduction';
import { Features } from '@/components/landing/Features';
import Pricing from '@/components/landing/Pricing';
import Integrations from '@/components/landing/Integrations';
import FAQSection from '@/components/landing/FAQSection';
import CTASection from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';

export default function LandingContent() {
    return (
        <div className="bg-white dark:bg-black min-h-screen text-black dark:text-white selection:bg-black dark:selection:bg-white selection:text-white dark:selection:text-black transition-colors duration-300">
            <Navbar />
            <main id="main-content">
                <Hero />
                <Introduction />
                <Features />
                <Integrations />
                <Pricing />
                <FAQSection />
                <CTASection />
            </main>
            <Footer />
        </div>
    );
}
