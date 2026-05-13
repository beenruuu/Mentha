import type { Metadata } from 'next';

import { ProjectProvider } from '@/context/ProjectContext';

export const metadata: Metadata = {
    title: 'Onboarding | Mentha',
    description: 'Get started with Mentha AEO Platform',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProjectProvider>
            <div className="min-h-screen bg-mentha-beige/30 dark:bg-mentha-dark flex flex-col">
                <header className="p-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-mentha-forest flex items-center justify-center text-white font-serif font-bold text-xl">
                            M
                        </div>
                        <span className="font-serif text-2xl font-bold text-mentha-forest dark:text-mentha-beige">
                            Mentha
                        </span>
                    </div>
                </header>
                <main className="flex-1 flex items-center justify-center p-4">{children}</main>
            </div>
        </ProjectProvider>
    );
}
