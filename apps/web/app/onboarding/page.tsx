'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EngineIcon } from '@/components/ui/engine-icon';
import Tag from '@/components/ui/tag';
import { useProject } from '@/context/ProjectContext';
import { fetchFromApi } from '@/lib/api';

const MAX_POLL_TIME = 120000;
const POLL_INTERVAL = 2500;

const ENGINES = [
    { key: 'perplexity', label: 'Perplexity' },
    { key: 'openai', label: 'ChatGPT' },
    { key: 'gemini', label: 'Gemini' },
    { key: 'claude', label: 'Claude' },
] as const;

export default function OnboardingPage() {
    const router = useRouter();
    const { refreshProjects, setSelectedProject } = useProject();

    const [step, setStep] = useState(1);
    const [domain, setDomain] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{
        name: string;
        description: string;
        keywords: string[];
        competitors: string[];
    } | null>(null);

    const [_scanRunId, setScanRunId] = useState<string | null>(null);
    const [totalJobs, setTotalJobs] = useState(0);
    const [completedJobs, setCompletedJobs] = useState(0);
    const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (pollTimerRef.current) {
                clearTimeout(pollTimerRef.current);
            }
        };
    }, []);

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!domain) return;

        let formattedDomain = domain;
        if (!formattedDomain.startsWith('http')) {
            formattedDomain = 'https://' + formattedDomain;
        }

        setIsAnalyzing(true);
        setStep(2);

        try {
            const res = await fetchFromApi('/projects/analyze', {
                method: 'POST',
                body: JSON.stringify({ domain: formattedDomain }),
            });

            setAnalysisResult(res.data);
            setStep(3);
        } catch (error) {
            console.error('Failed to analyze domain:', error);
            alert('Failed to analyze domain. Please try again or skip.');
            setStep(1);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const pollScanStatus = (runId: string, projectId: string, startTime: number) => {
        const elapsed = Date.now() - startTime;

        if (elapsed >= MAX_POLL_TIME) {
            router.push('/dashboard');
            return;
        }

        pollTimerRef.current = setTimeout(async () => {
            try {
                const res = await fetchFromApi(`/scans/${runId}?project_id=${projectId}`);
                const { run } = res.data;

                setCompletedJobs(run.completed_jobs || 0);

                if (run.status === 'completed' || run.status === 'failed') {
                    router.push('/dashboard');
                    return;
                }
            } catch {
                // Continue polling on error
            }

            pollScanStatus(runId, projectId, startTime);
        }, POLL_INTERVAL);
    };

    const handleCreateProject = async () => {
        if (!analysisResult) return;

        let formattedDomain = domain;
        if (!formattedDomain.startsWith('http')) {
            formattedDomain = 'https://' + formattedDomain;
        }

        try {
            const res = await fetchFromApi('/projects', {
                method: 'POST',
                body: JSON.stringify({
                    name: analysisResult.name,
                    domain: formattedDomain,
                    description: analysisResult.description,
                    competitors: analysisResult.competitors,
                }),
            });

            const newProject = res.data;
            await refreshProjects();
            setSelectedProject(newProject);

            if (analysisResult.keywords.length > 0) {
                await Promise.all(
                    analysisResult.keywords.map((kw) =>
                        fetchFromApi('/keywords', {
                            method: 'POST',
                            body: JSON.stringify({
                                project_id: newProject.id,
                                query: kw,
                                engines: ['perplexity', 'openai', 'gemini', 'claude'],
                            }),
                        }).catch(console.error),
                    ),
                );
            }

            const scanRes = await fetchFromApi(`/scans/trigger?project_id=${newProject.id}`, {
                method: 'POST',
            });

            const { runId, jobCount } = scanRes.data;
            setScanRunId(runId);
            setTotalJobs(jobCount || 0);
            setStep(4);

            pollScanStatus(runId, newProject.id, Date.now());
        } catch (error) {
            console.error('Failed to create project:', error);
            alert('Failed to create project');
        }
    };

    const progressPct =
        totalJobs > 0 ? Math.min(Math.round((completedJobs / totalJobs) * 100), 100) : 0;
    const jobsPerEngine = Math.max(Math.floor(totalJobs / ENGINES.length), 1);

    return (
        <div className="max-w-3xl w-full mx-auto">
            <div className="text-center mb-10">
                <div className="mb-4">
                    <span className="font-serif text-4xl text-mentha-forest dark:text-mentha-beige">
                        Welcome to <span className="text-mentha-mint">Mentha</span>
                        <span className="text-mentha-mint">.</span>
                    </span>
                </div>
                <p className="font-sans text-base font-normal text-mentha-forest/60 dark:text-mentha-beige/60">
                    Let&apos;s set up your brand and start optimizing your Answer Engine visibility.
                </p>
            </div>
            {step === 1 && (
                <form
                    onSubmit={handleAnalyze}
                    className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                    <div className="space-y-2">
                        <label
                            htmlFor="domain"
                            className="block text-[10px] font-mono uppercase tracking-[0.2em] text-mentha-forest/60 dark:text-mentha-beige/60 ml-1"
                        >
                            Your Website URL
                        </label>
                        <input
                            id="domain"
                            name="domain"
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="eg: www.mentha.ai"
                            className="w-full bg-transparent border-b border-mentha-forest/20 dark:border-mentha-beige/20 p-4 font-serif text-xl focus:outline-none focus:border-mentha-mint transition-colors text-mentha-forest dark:text-mentha-beige placeholder-mentha-forest/20 dark:placeholder-mentha-beige/20"
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={!domain || isAnalyzing}
                        className="w-full py-5 rounded-none font-mono text-sm font-bold uppercase tracking-[0.2em]"
                    >
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Brand'}
                    </Button>
                </form>
            )}

            {step === 2 && (
                <div className="text-center py-12 space-y-8 animate-in fade-in duration-500">
                    <div className="relative mx-auto w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-2 border-mentha-mint/20" />
                        <div className="absolute inset-0 rounded-full border-2 border-mentha-mint border-t-transparent animate-spin" />
                    </div>

                    <div className="space-y-2">
                        <p className="font-serif text-xl">
                            Connecting to <span className="text-mentha-mint">{domain}</span>
                        </p>
                        <p className="font-mono text-xs text-mentha-forest/60 dark:text-mentha-beige/60 animate-pulse">
                            Researching your website so Mentha can understand your brand...
                        </p>
                    </div>

                    <div className="flex justify-center gap-6 pt-4">
                        {ENGINES.map((engine) => (
                            <div
                                key={engine.key}
                                className="flex flex-col items-center gap-2 opacity-60 animate-pulse"
                            >
                                <EngineIcon engine={engine.key} size={28} invert="light" />
                                <span className="font-mono text-[10px] uppercase tracking-wider text-mentha-forest/50 dark:text-mentha-beige/50">
                                    {engine.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {step === 3 && analysisResult && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-serif text-2xl text-mentha-forest dark:text-mentha-beige">
                                {analysisResult.name}
                            </h3>
                            <div className="space-y-2">
                                <label
                                    htmlFor="brand-description"
                                    className="text-[10px] uppercase tracking-widest font-bold text-mentha-forest/40 dark:text-mentha-beige/40"
                                >
                                    Brand Description
                                </label>
                                <textarea
                                    id="brand-description"
                                    value={analysisResult.description}
                                    onChange={(e) =>
                                        setAnalysisResult({
                                            ...analysisResult,
                                            description: e.target.value,
                                        })
                                    }
                                    className="w-full bg-mentha-forest/5 dark:bg-white/5 rounded-xl border border-mentha-forest/10 dark:border-mentha-beige/10 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-mentha-mint/20 min-h-[120px] resize-none font-sans leading-relaxed"
                                    placeholder="Describe what your brand does..."
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[10px] uppercase tracking-widest font-bold text-mentha-forest/40 dark:text-mentha-beige/40 mb-3">
                                    Suggested Prompts to Track
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {analysisResult.keywords.map((kw) => (
                                        <Tag key={kw}>{kw}</Tag>
                                    ))}
                                </div>
                            </div>

                            {analysisResult.competitors.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-mentha-forest/40 dark:text-mentha-beige/40 mb-3">
                                        Identified Competitors
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {analysisResult.competitors.map((comp) => (
                                            <Badge key={comp} variant="competitor">
                                                {comp}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-mentha-forest/10 dark:border-mentha-beige/10">
                        <Button variant="outline" onClick={() => setStep(1)}>
                            Back
                        </Button>
                        <Button onClick={handleCreateProject}>
                            Create Project & Start Tracking
                        </Button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="text-center py-8 space-y-8 animate-in fade-in duration-500">
                    <div className="relative mx-auto w-20 h-20">
                        <div className="absolute inset-0 rounded-full border-2 border-mentha-mint/20" />
                        <div className="absolute inset-0 rounded-full border-2 border-mentha-mint border-t-transparent animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-mono text-lg text-mentha-mint font-bold">
                                {progressPct}%
                            </span>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-serif text-2xl mb-2">Scanning Your Brand</h3>
                        <p className="text-sm text-mentha-forest/60 dark:text-mentha-beige/60 max-w-md mx-auto">
                            Mentha is querying AI engines to measure your brand&apos;s visibility.
                            This takes about 30 seconds.
                        </p>
                    </div>

                    <div className="max-w-md mx-auto space-y-3">
                        <div className="h-2 bg-mentha-forest/10 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-mentha-mint transition-all duration-500 ease-out"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <p className="font-mono text-xs text-mentha-forest/40 dark:text-mentha-beige/40">
                            {completedJobs} of {totalJobs} queries completed
                        </p>
                    </div>

                    <div className="flex justify-center gap-8 pt-2">
                        {ENGINES.map((engine, i) => {
                            const completedShare = Math.max(completedJobs - i * jobsPerEngine, 0);
                            const engineDone = completedShare >= jobsPerEngine;
                            return (
                                <div
                                    key={engine.key}
                                    className={`flex flex-col items-center gap-2 transition-all duration-500 ${
                                        engineDone ? 'opacity-100' : 'opacity-40'
                                    }`}
                                >
                                    <div
                                        className={`p-2 rounded-xl border transition-all duration-500 ${
                                            engineDone
                                                ? 'bg-mentha-mint/10 border-mentha-mint/30'
                                                : 'bg-mentha-forest/5 dark:bg-white/5 border-mentha-forest/10 dark:border-mentha-beige/10'
                                        }`}
                                    >
                                        <EngineIcon
                                            engine={engine.key}
                                            size={24}
                                            invert={engineDone ? 'dark' : 'light'}
                                        />
                                    </div>
                                    <span
                                        className={`font-mono text-[10px] uppercase tracking-wider ${
                                            engineDone
                                                ? 'text-mentha-mint'
                                                : 'text-mentha-forest/40 dark:text-mentha-beige/40'
                                        }`}
                                    >
                                        {engine.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <p className="text-[10px] font-mono text-mentha-forest/30 dark:text-mentha-beige/30 animate-pulse">
                        Analyzing across {totalJobs} strategic queries...
                    </p>
                </div>
            )}
        </div>
    );
}
