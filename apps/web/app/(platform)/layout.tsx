'use client';

import type React from 'react';

import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { cn } from '@/lib/utils';

function PlatformLayoutInner({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

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
