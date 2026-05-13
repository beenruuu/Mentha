'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EngineIcon } from '@/components/ui/engine-icon';
import { useProject } from '@/context/ProjectContext';
import { fetchFromApi } from '@/lib/api';
import { getEngineDisplayName } from '@/lib/engines';

interface AddKeywordModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function AddKeywordModal({ onClose, onSuccess }: AddKeywordModalProps) {
    const { selectedProject } = useProject();
    const [query, setQuery] = useState('');
    const [intent, setIntent] = useState('informational');
    const [scanFrequency, setScanFrequency] = useState('weekly');
    const [engines, setEngines] = useState<string[]>(['perplexity', 'openai', 'gemini', 'claude']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const toggleEngine = (engine: string) => {
        setEngines((prev) =>
            prev.includes(engine) ? prev.filter((e) => e !== engine) : [...prev, engine],
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject?.id || !query.trim()) return;

        setLoading(true);
        setError('');

        try {
            await fetchFromApi('/keywords', {
                method: 'POST',
                body: JSON.stringify({
                    project_id: selectedProject?.id,
                    query: query.trim(),
                    intent,
                    scan_frequency: scanFrequency,
                    engines,
                }),
            });
            onSuccess();
        } catch (err) {
            setError((err as Error).message || 'Failed to create keyword');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-mentha-dark/50 backdrop-blur-sm"
                onClick={onClose}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Escape' && onClose()}
            />
            <div className="relative w-full max-w-md bg-mentha-beige dark:bg-mentha-dark rounded-2xl border border-mentha-forest/10 dark:border-mentha-beige/10 shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-xl text-mentha-forest dark:text-mentha-beige">
                        Add New Keyword
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-mentha-forest/40 dark:text-mentha-beige/40 hover:text-mentha-forest dark:hover:text-mentha-beige"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        >
                            <path d="M5 5L15 15M5 15L15 5" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="keyword-query"
                            className="block font-mono text-xs uppercase tracking-widest text-mentha-forest/60 dark:text-mentha-beige/60 mb-1"
                        >
                            Keyword Query *
                        </label>
                        <input
                            id="keyword-query"
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="e.g., best AI marketing tools"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-mentha-forest/10 dark:border-mentha-beige/10 bg-white dark:bg-mentha-dark/60 text-mentha-forest dark:text-mentha-beige font-serif placeholder:text-mentha-forest/40 dark:placeholder:text-mentha-beige/40 focus:outline-none focus:ring-2 focus:ring-mentha-mint/20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="intent-type"
                                className="block font-mono text-[10px] uppercase tracking-widest text-mentha-forest/60 dark:text-mentha-beige/60 mb-1"
                            >
                                Intent
                            </label>
                            <select
                                id="intent-type"
                                value={intent}
                                onChange={(e) => setIntent(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-mentha-forest/10 dark:border-mentha-beige/10 bg-white dark:bg-mentha-dark/60 text-mentha-forest dark:text-mentha-beige font-sans text-xs focus:outline-none focus:ring-2 focus:ring-mentha-mint/20"
                            >
                                <option value="informational">Informational</option>
                                <option value="transactional">Transactional</option>
                                <option value="navigational">Navigational</option>
                                <option value="commercial">Commercial</option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="scan-frequency"
                                className="block font-mono text-[10px] uppercase tracking-widest text-mentha-forest/60 dark:text-mentha-beige/60 mb-1"
                            >
                                Frequency
                            </label>
                            <select
                                id="scan-frequency"
                                value={scanFrequency}
                                onChange={(e) => setScanFrequency(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-mentha-forest/10 dark:border-mentha-beige/10 bg-white dark:bg-mentha-dark/60 text-mentha-forest dark:text-mentha-beige font-sans text-xs focus:outline-none focus:ring-2 focus:ring-mentha-mint/20"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="manual">Manual</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-mentha-forest/60 dark:text-mentha-beige/60 mb-3">
                            Neural Engines
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {['perplexity', 'openai', 'gemini', 'claude'].map((engine) => (
                                <label
                                    key={engine}
                                    htmlFor={`engine-${engine}`}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border ${
                                        engines.includes(engine)
                                            ? 'bg-mentha-mint/10 text-mentha-mint border-mentha-mint/30 ring-1 ring-mentha-mint/20'
                                            : 'bg-mentha-forest/5 dark:bg-white/5 text-mentha-forest/60 dark:text-mentha-beige/60 border-mentha-forest/10 dark:border-white/10 opacity-60'
                                    }`}
                                >
                                    <input
                                        id={`engine-${engine}`}
                                        type="checkbox"
                                        checked={engines.includes(engine)}
                                        onChange={() => toggleEngine(engine)}
                                        className="sr-only"
                                    />
                                    <div className="flex h-5 w-5 items-center justify-center">
                                        <EngineIcon engine={engine} size={16} />
                                    </div>
                                    <span className="font-mono text-[10px] uppercase tracking-wider font-bold">
                                        {getEngineDisplayName(engine)}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {error && <p className="font-sans text-sm text-red-500">{error}</p>}

                    <div className="flex gap-3 pt-6">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="flex-1 rounded-xl"
                        >
                            {loading ? 'Processing...' : 'Add Keyword'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
