'use client';

import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect } from 'react';

import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { SidebarProvider, useSidebar } from '@/components/layout/sidebar-context';
import { ProjectProvider } from '@/context/ProjectContext';
import { useSession } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

function PlatformLayoutInner({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();
    const { push } = useRouter();
    const { data: session, isPending } = useSession();
    const isQaMode = process.env.NEXT_PUBLIC_MENTHA_QA_MODE === 'true';

    useEffect(() => {
        if (!isPending && !session) {
            push('/login');
        }
    }, [session, isPending, push]);

    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-mentha-beige dark:bg-mentha-dark">
                <div className="size-8 border-2 border-mentha-mint border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!session) {
        return null; // Will redirect shortly
    }

    return (
        <>
            <Sidebar />
            <Header />
            <main
                className={cn(
                    'pt-16 min-h-screen transition-[padding-left] ease-linear duration-150',
                    isCollapsed ? 'pl-16' : 'pl-60',
                )}
            >
                {isQaMode && (
                    <div className="border-b border-amber-500/20 bg-amber-500/10 px-6 py-2 font-mono text-[11px] uppercase tracking-widest text-amber-700 dark:text-amber-300">
                        QA mode active: onboarding, scans and evaluations use deterministic mock
                        data.
                    </div>
                )}
                <div className="p-6 lg:p-8">{children}</div>
            </main>
        </>
    );
}

export default function PlatformLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ProjectProvider>
            <SidebarProvider>
                <PlatformLayoutInner>{children}</PlatformLayoutInner>
            </SidebarProvider>
        </ProjectProvider>
    );
}
