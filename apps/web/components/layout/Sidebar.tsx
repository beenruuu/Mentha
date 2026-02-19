'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { useSidebar } from './SidebarContext';

const navItems = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: (
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
        ),
    },
    {
        name: 'Keywords',
        href: '/keywords',
        icon: (
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
            </svg>
        ),
    },
    {
        name: 'Authority',
        href: '/authority',
        icon: (
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
        ),
    },
    {
        name: 'Optimization',
        href: '/optimization',
        icon: (
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <path d="M12 22V12" />
                <path d="m3.3 7 8.7 5 8.7-5" />
            </svg>
        ),
    },
    {
        name: 'Settings',
        href: '/settings',
        icon: (
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
            </svg>
        ),
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { isCollapsed, toggle } = useSidebar();

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard' || pathname === '/';
        }
        return pathname.startsWith(href);
    };

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen border-r border-mentha-forest/10 dark:border-mentha-beige/10 bg-mentha-beige dark:bg-mentha-dark transition-all duration-300',
                isCollapsed ? 'w-16' : 'w-60',
            )}
        >
            <div className="flex h-full flex-col">
                <div
                    className={cn(
                        'flex h-16 items-center border-b border-mentha-forest/10 dark:border-mentha-beige/10 px-4',
                        isCollapsed ? 'justify-center' : 'justify-start',
                    )}
                >
                    <Link href="/" className="flex items-center gap-1">
                        {!isCollapsed && (
                            <span className="font-serif text-2xl tracking-tight text-mentha-forest dark:text-mentha-beige">
                                Mentha<span className="text-mentha-mint text-3xl">.</span>
                            </span>
                        )}
                        {isCollapsed && (
                            <span className="font-serif text-2xl text-mentha-mint">.</span>
                        )}
                    </Link>
                    {/* Botón para colapsar/expandir sidebar */}
                    <button
                        type="button"
                        className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg hover:bg-mentha-forest/5 dark:hover:bg-white/5 transition-colors text-mentha-forest dark:text-mentha-beige"
                        aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                        onClick={toggle}
                    >
                        {/* Icono de plegar/desplegar */}
                        {isCollapsed ? (
                            // Icono de expandir (flecha a la derecha)
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                <path d="M8 5l4 5-4 5" />
                            </svg>
                        ) : (
                            // Icono de colapsar (flecha a la izquierda)
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                <path d="M12 5l-4 5 4 5" />
                            </svg>
                        )}
                    </button>
                </div>

                <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-mono uppercase tracking-wider transition-all duration-200',
                                isActive(item.href)
                                    ? 'bg-mentha-mint/10 text-mentha-mint'
                                    : 'text-mentha-forest/60 dark:text-mentha-beige/60 hover:bg-mentha-forest/5 dark:hover:bg-white/5 hover:text-mentha-forest dark:hover:text-mentha-beige',
                                isCollapsed && 'justify-center px-0',
                            )}
                            title={isCollapsed ? item.name : undefined}
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                    ))}
                </nav>

                <div
                    className={cn(
                        'border-t border-mentha-forest/10 dark:border-mentha-beige/10 p-4',
                        isCollapsed ? 'text-center' : '',
                    )}
                >
                    {!isCollapsed && (
                        <p className="font-mono text-xs text-mentha-forest/40 dark:text-mentha-beige/40">
                            v1.0.0
                        </p>
                    )}
                </div>
            </div>
        </aside>
    );
}
