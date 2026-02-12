'use client';

import type React from 'react';

import { Dock } from '@/components/layout/Dock';
import { Header } from '@/components/layout/Header';
import { ProjectProvider } from '@/context/ProjectContext';

export default function PlatformLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ProjectProvider>
            <div className="container">
                <Header />
                <main>{children}</main>
                <Dock />
            </div>
        </ProjectProvider>
    );
}
