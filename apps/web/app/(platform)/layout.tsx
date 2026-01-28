"use client";

import React from "react";
import { Header } from "@/components/layout/Header";
import { Dock } from "@/components/layout/Dock";
import { ProjectProvider } from "@/context/ProjectContext";

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
