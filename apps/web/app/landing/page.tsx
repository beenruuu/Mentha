import CTASection from '@/components/landing/CTASection';
import FAQSection from '@/components/landing/FAQSection';
import { Features } from '@/components/landing/Features';
import { Footer } from '@/components/landing/Footer';
import { Hero } from '@/components/landing/Hero';
import Integrations from '@/components/landing/Integrations';
import { Introduction } from '@/components/landing/Introduction';
import { Navbar } from '@/components/landing/Navbar';
import Pricing from '@/components/landing/Pricing';

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
