'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProject } from '@/context/ProjectContext';

export default function SettingsPage() {
    const { selectedProject, projects } = useProject();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (selectedProject) {
            setFormData({
                name: selectedProject.name,
                domain: selectedProject.domain,
            });
        }
    }, [selectedProject]);

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="font-serif text-3xl font-light text-mentha-forest dark:text-mentha-beige">
                    Settings
                </h1>
                <p className="font-sans text-sm text-mentha-forest/60 dark:text-mentha-beige/60 mt-1">
                    Manage your project configuration and preferences
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Project Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="brand-name"
                                    className="block font-mono text-xs uppercase tracking-widest text-mentha-forest/60 dark:text-mentha-beige/60 mb-1"
                                >
                                    Brand Name
                                </label>
                                <input
                                    id="brand-name"
                                    type="text"
                                    value={formData.name}
                                    readOnly
                                    className="w-full px-4 py-3 rounded-xl border border-mentha-forest/10 dark:border-mentha-beige/10 bg-mentha-forest/5 dark:bg-white/5 text-mentha-forest/60 dark:text-mentha-beige/60 cursor-not-allowed font-serif"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="domain-url"
                                    className="block font-mono text-xs uppercase tracking-widest text-mentha-forest/60 dark:text-mentha-beige/60 mb-1"
                                >
                                    Domain URL
                                </label>
                                <input
                                    id="domain-url"
                                    type="text"
                                    value={formData.domain}
                                    readOnly
                                    className="w-full px-4 py-3 rounded-xl border border-mentha-forest/10 dark:border-mentha-beige/10 bg-mentha-forest/5 dark:bg-white/5 text-mentha-forest/60 dark:text-mentha-beige/60 cursor-not-allowed font-serif"
                                />
                            </div>
                            <p className="font-sans text-xs text-mentha-forest/40 dark:text-mentha-beige/40">
                                Editing projects is coming soon. Contact support to change these
                                values.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <p className="font-mono text-xs uppercase tracking-widest text-mentha-forest/60 dark:text-mentha-beige/60 mb-3">
                                    Theme
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setTheme('light')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                                            mounted && theme === 'light'
                                                ? 'bg-mentha-mint/10 text-mentha-mint border border-mentha-mint/30'
                                                : 'bg-mentha-forest/5 dark:bg-white/5 text-mentha-forest/70 dark:text-mentha-beige/70 border border-mentha-forest/10 dark:border-mentha-beige/10'
                                        }`}
                                    >
                                        <Sun size={16} />
                                        <span className="font-sans text-sm">Light</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTheme('dark')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                                            mounted && theme === 'dark'
                                                ? 'bg-mentha-mint/10 text-mentha-mint border border-mentha-mint/30'
                                                : 'bg-mentha-forest/5 dark:bg-white/5 text-mentha-forest/70 dark:text-mentha-beige/70 border border-mentha-forest/10 dark:border-mentha-beige/10'
                                        }`}
                                    >
                                        <Moon size={16} />
                                        <span className="font-sans text-sm">Dark</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Instance Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2">
                                <span className="font-sans text-sm text-mentha-forest/70 dark:text-mentha-beige/70">
                                    Status
                                </span>
                                <span className="flex items-center gap-2 font-mono text-xs text-mentha-mint">
                                    <span className="w-2 h-2 rounded-full bg-mentha-mint" />
                                    Active
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-t border-mentha-forest/10 dark:border-mentha-beige/10">
                                <span className="font-sans text-sm text-mentha-forest/70 dark:text-mentha-beige/70">
                                    Database
                                </span>
                                <span className="flex items-center gap-2 font-mono text-xs text-mentha-mint">
                                    <span className="w-2 h-2 rounded-full bg-mentha-mint" />
                                    Connected
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-t border-mentha-forest/10 dark:border-mentha-beige/10">
                                <span className="font-sans text-sm text-mentha-forest/70 dark:text-mentha-beige/70">
                                    Total Projects
                                </span>
                                <span className="font-serif text-sm text-mentha-forest dark:text-mentha-beige">
                                    {projects.length}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Competitors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedProject?.competitors && selectedProject.competitors.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {selectedProject.competitors.map((competitor, index) => (
                                    <span
                                        key={`${competitor}-${index}`}
                                        className="inline-flex items-center px-3 py-1 rounded-full font-sans text-sm bg-mentha-forest/5 dark:bg-white/5 text-mentha-forest/70 dark:text-mentha-beige/70"
                                    >
                                        {competitor}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="font-sans text-sm text-mentha-forest/60 dark:text-mentha-beige/60">
                                No competitors configured for this project
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
