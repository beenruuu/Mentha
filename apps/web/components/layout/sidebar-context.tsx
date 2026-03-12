'use client';

import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface SidebarContextType {
    isCollapsed: boolean;
    toggle: () => void;
    setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('mentha_sidebar_collapsed');
        if (saved !== null) {
            setIsCollapsed(saved === 'true');
        }
    }, []);

    const setCollapsed = useCallback((collapsed: boolean) => {
        setIsCollapsed(collapsed);
        localStorage.setItem('mentha_sidebar_collapsed', String(collapsed));
    }, []);

    const toggle = useCallback(() => {
        setCollapsed(!isCollapsed);
    }, [isCollapsed, setCollapsed]);

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggle, setCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}
