'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';

/**
 * Hook personalizado para sincronizar el tema en todos los componentes
 * Asegura que el cambio de tema se aplique de forma instantánea y uniforme
 */

function subscribe(callback: () => void) {
    window.addEventListener('themechange', callback);
    return () => window.removeEventListener('themechange', callback);
}

function getSnapshot() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function getServerSnapshot() {
    return 'light';
}

export function useThemeSync() {
    const { theme, setTheme } = useTheme();
    const currentTheme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const mounted = typeof window !== 'undefined';

    const syncTheme = (newTheme: 'light' | 'dark') => {
        if (typeof document !== 'undefined') {
            const html = document.documentElement;
            html.classList.remove('light', 'dark');
            html.classList.add(newTheme);
            window.dispatchEvent(
                new CustomEvent('themechange', {
                    detail: { theme: newTheme },
                }),
            );
        }
        setTheme(newTheme);
    };

    return {
        theme,
        setTheme: syncTheme,
        mounted,
        isTransitioning: false,
        currentTheme,
    };
}
