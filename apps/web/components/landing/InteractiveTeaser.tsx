'use client';

import { ArrowRight, Cpu, Loader2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

// import { analyzeBrandPresence } from '../../services/geminiService';

// Mock function until service is implemented
const analyzeBrandPresence = async (_brand: string, _category: string) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return {
        visibility_score: 78,
        recommendations: ['Add more structured data', 'Improve entity coverage'],
    };
};

const InteractiveTeaser: React.FC = () => {
    const [brand, setBrand] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!brand || !category) return;

        setLoading(true);
        setResult(null);

        const data = await analyzeBrandPresence(brand, category);
        setResult(data);
        setLoading(false);
    };

    return (
        <section
            id="audit"
            className="border-b border-mentha-mint py-24 px-6 relative overflow-hidden"
        >
            <div className="max-w-3xl mx-auto relative z-10">
                <div className="text-center mb-12">
                    <span className="font-mono text-xs text-mentha-mint border border-mentha-mint px-2 py-1 rounded-full">
                        LIVE DEMO
                    </span>
                    <h2 className="font-serif text-5xl mt-6 mb-4">
                        ¿Cómo te ve la IA ahora mismo?
                    </h2>
                    <p className="font-sans opacity-70">
                        Simula una consulta GEO en tiempo real usando Gemini 1.5.
                    </p>
                </div>

                <div className="bg-white bg-opacity-5 p-8 border border-mentha-mint backdrop-blur-md">
                    <form onSubmit={handleAnalyze} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="font-mono text-xs uppercase tracking-widest ml-1">
                                    Tu Marca
                                </label>
                                <input
                                    type="text"
                                    value={brand}
                                    onChange={(e) => setBrand(e.target.value)}
                                    placeholder="Ej. Acme Corp"
                                    className="w-full bg-transparent border-b border-mentha-mint p-4 font-serif text-xl focus:outline-none focus:border-mentha-mint transition-colors placeholder-mentha-forest/70"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="font-mono text-xs uppercase tracking-widest ml-1">
                                    Producto / Categoría
                                </label>
                                <input
                                    type="text"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="Ej. CRM Software"
                                    className="w-full bg-transparent border-b border-mentha-mint p-4 font-serif text-xl focus:outline-none focus:border-mentha-mint transition-colors placeholder-mentha-forest/70"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                disabled={loading}
                                type="submit"
                                className="bg-mentha-mint text-mentha-dark px-8 py-4 font-mono text-sm font-bold uppercase tracking-widest hover:bg-white transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Cpu size={16} />}
                                <span>
                                    {loading ? 'ANALYZING NEURAL PATHS...' : 'RUN DIAGNOSTIC'}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>

                {result && (
                    <div className="mt-8 border border-mentha-mint p-6 md:p-8 bg-mentha-mint bg-opacity-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex justify-between items-start border-b border-mentha-mint border-opacity-20 pb-4 mb-6">
                            <h3 className="font-mono text-sm uppercase text-mentha-mint">
                                Audit Report: {brand}
                            </h3>
                            <span className="font-mono text-xs opacity-60">
                                Generated via Gemini
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                            <div>
                                <p className="font-mono text-[10px] uppercase opacity-60 mb-2">
                                    Visibility Score
                                </p>
                                <div className="text-4xl font-serif">
                                    {result.visibilityScore}/100
                                </div>
                            </div>
                            <div>
                                <p className="font-mono text-[10px] uppercase opacity-60 mb-2">
                                    Sentiment
                                </p>
                                <div className="text-xl font-sans font-medium">
                                    {result.sentiment}
                                </div>
                            </div>
                            <div>
                                <p className="font-mono text-[10px] uppercase opacity-60 mb-2">
                                    Top Association
                                </p>
                                <div className="text-xl font-serif italic text-mentha-mint">
                                    "{result.topAssociation}"
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="font-mono text-[10px] uppercase opacity-60 mb-2">
                                    Simulated LLM Response
                                </p>
                                <div className="font-serif text-lg leading-relaxed border-l-2 border-mentha-mint pl-4 opacity-90">
                                    "{result.simulationOutput}"
                                </div>
                            </div>
                            <div className="pt-4 border-t border-mentha-mint border-opacity-20">
                                <p className="font-mono text-[10px] uppercase text-mentha-mint mb-2">
                                    Strategic Recommendation
                                </p>
                                <p className="font-sans font-semibold">{result.recommendation}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default InteractiveTeaser;
