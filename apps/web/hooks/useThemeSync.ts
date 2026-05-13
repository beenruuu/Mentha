'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * Hook personalizado para sincronizar el tema en todos los componentes
 * Asegura que el cambio de tema se aplique de forma instantánea y uniforme
 */
export function useThemeSync() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const syncTheme = (newTheme: 'light' | 'dark') => {
        if (!mounted) return;

        setIsTransitioning(true);

        // Asegurar que el cambio se propague correctamente
        if (typeof document !== 'undefined') {
            const html = document.documentElement;

            // Remover clases existentes de tema
            html.classList.remove('light', 'dark');

            // Añadir la nueva clase
            html.classList.add(newTheme);

            // Disparar evento personalizado para componentes que lo escuchen
            window.dispatchEvent(
                new CustomEvent('themechange', {
                    detail: { theme: newTheme },
                }),
            );
        }

        // Actualizar el tema vía next-themes
        setTheme(newTheme);

        // Finalizar transición
        setTimeout(() => {
            setIsTransitioning(false);
        }, 500);
    };

    return {
        theme,
        setTheme: syncTheme,
        mounted,
        isTransitioning,
    };
}
