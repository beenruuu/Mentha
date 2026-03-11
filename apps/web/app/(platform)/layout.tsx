'use client';

import type React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { SidebarProvider, useSidebar } from '@/components/layout/sidebar-context';
import { ProjectProvider } from '@/context/ProjectContext';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/auth-client';

function PlatformLayoutInner({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();
    const router = useRouter();
    const { data: session, isPending } = useSession();

    useEffect(() => {
        if (!isPending && !session) {
            router.push('/login');
        }
    }, [session, isPending, router]);

    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-mentha-beige dark:bg-mentha-dark">
                <div className="w-8 h-8 border-2 border-mentha-mint border-t-transparent rounded-full animate-spin"></div>
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
                    'pt-16 min-h-screen transition-all duration-300',
                    isCollapsed ? 'pl-16' : 'pl-60',
                )}
            >
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
