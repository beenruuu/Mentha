'use client';

import { Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProject } from '@/context/ProjectContext';
import { useThemeSync } from '@/hooks/useThemeSync';

interface ApiKeyInfo {
    id: string;
    provider: string;
    key_preview: string | null;
    is_active: boolean;
}

export default function SettingsPage() {
    const { selectedProject, projects } = useProject();
    const { theme, setTheme, mounted } = useThemeSync();
    const formData = selectedProject
        ? { name: selectedProject.name, domain: selectedProject.domain }
        : { name: '', domain: '' };
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [savedKey, setSavedKey] = useState<ApiKeyInfo | null>(null);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{
        valid: boolean;
        label?: string;
        error?: string;
    } | null>(null);
    const [apiKeyError, setApiKeyError] = useState('');

    useEffect(() => {
        async function loadApiKeys() {
            try {
                const { fetchFromApi } = await import('@/lib/api');
                const res = await fetchFromApi('/settings/api-keys');
                const keys = res.data as ApiKeyInfo[];
                const orKey = keys.find((k: ApiKeyInfo) => k.provider === 'openrouter');
                if (orKey) setSavedKey(orKey);
            } catch {
                // settings might not be available yet
            }
        }
        loadApiKeys();
    }, []);

    async function handleSaveApiKey() {
        if (!apiKey.trim() || apiKey.trim().length < 10) {
            setApiKeyError('Key must be at least 10 characters');
            return;
        }
        setSaving(true);
        setApiKeyError('');
        setTestResult(null);
        try {
            const { fetchFromApi } = await import('@/lib/api');
            const res = await fetchFromApi('/settings/api-keys', {
                method: 'PUT',
                body: JSON.stringify({ provider: 'openrouter', key: apiKey.trim() }),
            });
            setSavedKey(res.data as ApiKeyInfo);
            setApiKey('');
        } catch (err) {
            setApiKeyError((err as Error).message || 'Failed to save API key');
        } finally {
            setSaving(false);
        }
    }

    async function handleTestApiKey() {
        setTesting(true);
        setTestResult(null);
        try {
            const { fetchFromApi } = await import('@/lib/api');
            const res = await fetchFromApi('/settings/api-keys/test', {
                method: 'POST',
                body: JSON.stringify({ provider: 'openrouter' }),
            });
            setTestResult(res.data as { valid: boolean; label?: string });
        } catch (err) {
            setTestResult({ valid: false, error: (err as Error).message });
        } finally {
            setTesting(false);
        }
    }

    async function handleRemoveApiKey() {
        if (!confirm('Remove this API key? Scans will fall back to the server default.')) return;
        try {
            const { fetchFromApi } = await import('@/lib/api');
            await fetchFromApi('/settings/api-keys/openrouter', { method: 'DELETE' });
            setSavedKey(null);
            setApiKey('');
            setTestResult(null);
        } catch (err) {
            setApiKeyError((err as Error).message || 'Failed to remove API key');
        }
    }

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
                                    <span className="size-2 rounded-full bg-mentha-mint" />
                                    Active
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-t border-mentha-forest/10 dark:border-mentha-beige/10">
                                <span className="font-sans text-sm text-mentha-forest/70 dark:text-mentha-beige/70">
                                    Database
                                </span>
                                <span className="flex items-center gap-2 font-mono text-xs text-mentha-mint">
                                    <span className="size-2 rounded-full bg-mentha-mint" />
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
                                {competitorsWithKeys.map(({ competitor, key }) => (
                                    <span
                                        key={key}
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

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>API Keys</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="openrouter-api-key"
                                    className="block font-mono text-xs uppercase tracking-widest text-mentha-forest/60 dark:text-mentha-beige/60 mb-1"
                                >
                                    OpenRouter
                                </label>
                                <p className="font-sans text-xs text-mentha-forest/40 dark:text-mentha-beige/40 mb-3">
                                    Used for scan analysis and AI evaluations. Leave empty to use
                                    the server default key.
                                </p>
                                {savedKey && (
                                    <div className="flex items-center gap-2 mb-3 px-4 py-2 rounded-xl bg-mentha-mint/5 border border-mentha-mint/20">
                                        <span className="size-2 rounded-full bg-mentha-mint" />
                                        <span className="font-mono text-xs text-mentha-mint">
                                            Key saved: {savedKey.key_preview || '********'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleRemoveApiKey}
                                            className="ml-auto font-mono text-[10px] uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            id="openrouter-api-key"
                                            type={showKey ? 'text' : 'password'}
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder={
                                                savedKey
                                                    ? 'Enter new key to replace...'
                                                    : 'sk-or-v1-...'
                                            }
                                            className="w-full px-4 py-3 pr-10 rounded-xl border border-mentha-forest/10 dark:border-mentha-beige/10 bg-mentha-forest/5 dark:bg-white/5 text-mentha-forest dark:text-mentha-beige font-mono text-sm placeholder-mentha-forest/30 dark:placeholder-mentha-beige/30"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowKey(!showKey)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-mentha-forest/40 hover:text-mentha-forest/70 dark:text-mentha-beige/40 dark:hover:text-mentha-beige/70"
                                        >
                                            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSaveApiKey}
                                        disabled={saving || !apiKey.trim()}
                                        className="px-6 py-3 rounded-xl bg-mentha-forest dark:bg-mentha-beige text-white dark:text-mentha-forest font-sans text-sm transition-colors hover:opacity-90 disabled:opacity-40 whitespace-nowrap"
                                    >
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                    {savedKey && (
                                        <button
                                            type="button"
                                            onClick={handleTestApiKey}
                                            disabled={testing}
                                            className="px-4 py-3 rounded-xl border border-mentha-forest/20 dark:border-mentha-beige/20 font-sans text-sm transition-colors hover:bg-mentha-forest/5 dark:hover:bg-white/5 whitespace-nowrap"
                                        >
                                            {testing ? 'Testing...' : 'Test'}
                                        </button>
                                    )}
                                </div>
                                {apiKeyError && (
                                    <p className="mt-2 font-sans text-xs text-red-400">
                                        {apiKeyError}
                                    </p>
                                )}
                                {testResult && (
                                    <p
                                        className={`mt-2 font-sans text-xs ${
                                            testResult.valid ? 'text-mentha-mint' : 'text-red-400'
                                        }`}
                                    >
                                        {testResult.valid
                                            ? `✅ Valid: ${testResult.label || 'OpenRouter Key'}`
                                            : `❌ ${testResult.error || 'Invalid key'}`}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-red-500/20 bg-red-500/5">
                    <CardHeader>
                        <CardTitle className="text-red-600 dark:text-red-400">
                            Danger Zone
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h4 className="font-sans font-semibold text-sm">Delete Project</h4>
                                <p className="font-sans text-xs text-mentha-forest/60 dark:text-mentha-beige/60">
                                    Permanently remove this project and all associated scan data.
                                    This action cannot be undone.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!selectedProject) return;
                                    if (
                                        confirm(
                                            'Are you sure you want to delete this project? ALL scan data will be lost forever.',
                                        )
                                    ) {
                                        try {
                                            const { fetchFromApi } = await import('@/lib/api');
                                            await fetchFromApi(`/projects/${selectedProject.id}`, {
                                                method: 'DELETE',
                                            });
                                            window.location.href = '/dashboard';
                                        } catch {
                                            alert('Failed to delete project');
                                        }
                                    }
                                }}
                                className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-sans text-sm transition-colors whitespace-nowrap"
                            >
                                Delete Project
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
