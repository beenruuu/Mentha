'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { useProject } from '@/context/ProjectContext';
import { cn } from '@/lib/utils';
import { useSidebar } from './sidebar-context';

export function Header() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { projects, selectedProject, setSelectedProjectId, isLoading } = useProject();
    const { isCollapsed, toggle } = useSidebar();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <header
            className={cn(
                'fixed top-0 right-0 z-30 h-16 border-b border-mentha-forest/10 dark:border-mentha-beige/10 bg-mentha-beige dark:bg-mentha-dark transition-all duration-300',
                isCollapsed ? 'left-16' : 'left-60',
            )}
        >
            <div className="flex h-full items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    {/* Botón de colapsar sidebar eliminado, ahora está en el sidebar */}

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-mentha-forest/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <span className="font-serif text-lg text-mentha-forest dark:text-mentha-beige">
                                {isLoading
                                    ? 'Loading...'
                                    : selectedProject?.name || 'Select Project'}
                            </span>
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                className="text-mentha-forest/60 dark:text-mentha-beige/60"
                            >
                                <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" />
                            </svg>
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-56 rounded-2xl border border-mentha-forest/10 dark:border-mentha-beige/10 bg-mentha-beige dark:bg-mentha-dark shadow-lg z-20 overflow-hidden">
                                <div className="p-1 max-h-64 overflow-y-auto">
                                    {projects.map((project) => (
                                        <button
                                            type="button"
                                            key={project.id}
                                            onClick={() => {
                                                setSelectedProjectId(project.id);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={cn(
                                                'w-full px-3 py-2 text-left rounded-xl text-sm transition-colors font-serif',
                                                project.id === selectedProject?.id
                                                    ? 'bg-mentha-mint/10 text-mentha-mint'
                                                    : 'hover:bg-mentha-forest/5 dark:hover:bg-white/5 text-mentha-forest dark:text-mentha-beige',
                                            )}
                                        >
                                            {project.name}
                                        </button>
                                    ))}
                                    {projects.length === 0 && !isLoading && (
                                        <p className="px-3 py-2 text-sm text-mentha-forest/60 dark:text-mentha-beige/60 font-sans">
                                            No projects found
                                        </p>
                                    )}
                                </div>
                                <div className="border-t border-mentha-forest/10 dark:border-mentha-beige/10 p-1">
                                    <button
                                        type="button"
                                        className="w-full px-3 py-2 text-left rounded-xl text-sm text-mentha-mint hover:bg-mentha-mint/5 transition-colors font-serif"
                                    >
                                        + Add Project
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="p-2 rounded-full border border-mentha-forest/20 dark:border-mentha-beige/20 transition-all hover:opacity-60 text-mentha-forest dark:text-mentha-beige"
                        aria-label="Toggle Theme"
                    >
                        {mounted && theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>
            </div>
        </header>
    );
}
