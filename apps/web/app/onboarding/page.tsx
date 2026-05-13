'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useProject } from '@/context/ProjectContext';
import { fetchFromApi } from '@/lib/api';

const MAX_POLL_TIME = 120000;
const POLL_INTERVAL = 2500;

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

    const [scanRunId, setScanRunId] = useState<string | null>(null);
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
                                    engines: ['perplexity', 'openai'],
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
    const engineNames = ['Perplexity', 'ChatGPT', 'Gemini', 'Claude'];

    return (
        <div className="max-w-2xl w-full mx-auto p-8 rounded-3xl bg-white dark:bg-[#1a1a1a] shadow-xl border border-mentha-forest/10 dark:border-white/10">
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-mentha-forest text-mentha-beige dark:bg-mentha-beige dark:text-mentha-forest mb-6 shadow-lg rotate-3">
                    <svg
                        className="w-10 h-10"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                    </svg>
                </div>
                <h1 className="font-serif text-5xl mb-3 tracking-tight">Welcome to Mentha</h1>
                <p className="text-lg text-mentha-forest/60 dark:text-mentha-beige/60">
                    Let's set up your brand and start optimizing your Answer Engine visibility.
                </p>
            </div>

            {step === 1 && (
                <form
                    onSubmit={handleAnalyze}
                    className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                    <div>
                        <label
                            htmlFor="domain"
                            className="block text-sm font-semibold mb-3 uppercase tracking-wider opacity-70"
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
                            className="w-full p-5 rounded-2xl border-2 border-mentha-forest/10 dark:border-white/10 bg-mentha-beige/5 focus:outline-none focus:ring-4 focus:ring-mentha-forest/20 dark:focus:ring-mentha-beige/20 focus:border-mentha-forest dark:focus:border-mentha-beige transition-all text-xl"
                            required
                        />
                    </div>
                    <div className="flex justify-center">
                        <Button
                            type="submit"
                            disabled={!domain}
                            className="w-full py-6 text-xl rounded-2xl"
                        >
                            Analyze Brand
                        </Button>
                    </div>
                </form>
            )}

            {step === 2 && (
                <div className="text-center py-12 space-y-4">
                    <div className="animate-spin w-8 h-8 border-2 border-mentha-forest dark:border-mentha-beige border-t-transparent rounded-full mx-auto" />
                    <p className="font-mono text-sm animate-pulse">
                        Connecting to {domain}...
                        <br />
                        Researching your website so Mentha can understand your brand...
                    </p>
                </div>
            )}

            {step === 3 && analysisResult && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 bg-mentha-forest/5 dark:bg-white/5 rounded-xl border border-mentha-forest/10 dark:border-white/10">
                        <h3 className="font-serif text-2xl mb-1">{analysisResult.name}</h3>
                        <div className="mt-4 space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Brand Description (Editable)</label>
                            <textarea
                                value={analysisResult.description}
                                onChange={(e) => setAnalysisResult({...analysisResult, description: e.target.value})}
                                className="w-full bg-transparent border-none focus:ring-0 text-sm opacity-80 min-h-[80px] resize-none font-sans leading-relaxed p-0"
                                placeholder="Describe what your brand does..."
                            />
                        </div>

                        <div className="mb-4">
                            <h4 className="text-xs uppercase tracking-wider font-bold mb-2 opacity-60">
                                Suggested Prompts to Track
                            </h4>
                            <ul className="space-y-2">
                                {analysisResult.keywords.map((kw, i) => (
                                    <li
                                        key={i}
                                        className="flex items-center gap-2 text-sm bg-white dark:bg-mentha-dark p-2 rounded border border-mentha-forest/10 dark:border-white/10"
                                    >
                                        <span className="text-mentha-forest dark:text-mentha-beige opacity-50">
                                            #
                                        </span>
                                        {kw}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {analysisResult.competitors.length > 0 && (
                            <div>
                                <h4 className="text-xs uppercase tracking-wider font-bold mb-2 opacity-60">
                                    Identified Competitors
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {analysisResult.competitors.map((comp, i) => (
                                        <span
                                            key={i}
                                            className="text-xs px-2 py-1 rounded bg-mentha-forest/10 dark:bg-mentha-beige/10"
                                        >
                                            {comp}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center">
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

                    <div className="max-w-sm mx-auto space-y-3">
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

                    <div className="flex flex-wrap justify-center gap-3 max-w-sm mx-auto">
                        {engineNames.map((name, i) => {
                            const jobsPerEngine = Math.max(
                                Math.floor(totalJobs / engineNames.length),
                                1,
                            );
                            const completedShare = Math.max(completedJobs - i * jobsPerEngine, 0);
                            const engineDone = completedShare >= jobsPerEngine;
                            return (
                                <div
                                    key={name}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-500 ${
                                        engineDone
                                            ? 'bg-mentha-mint/15 text-mentha-mint'
                                            : 'bg-mentha-forest/5 dark:bg-white/5 text-mentha-forest/40 dark:text-mentha-beige/40'
                                    }`}
                                >
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${engineDone ? 'bg-mentha-mint' : 'bg-current'}`}
                                    />
                                    {name}
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
