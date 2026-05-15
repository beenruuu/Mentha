'use client';

import type React from 'react';
import { useEffect, useState } from 'react';

interface ThemeSyncProps {
    children: React.ReactNode;
}

/**
 * Componente wrapper que sincroniza el tema en todos los elementos hijo
 * Escucha eventos personalizados de cambio de tema y fuerza re-renders
 */
export function ThemeSync({ children }: ThemeSyncProps) {
    const [themeKey, setThemeKey] = useState(0);

    useEffect(() => {
        const handleThemeChange = () => {
            // Forzar re-render de todos los componentes
            setThemeKey((prev) => prev + 1);
        };

        window.addEventListener('themechange', handleThemeChange);

        return () => {
            window.removeEventListener('themechange', handleThemeChange);
        };
    }, []);

    return <div key={themeKey}>{children}</div>;
}
