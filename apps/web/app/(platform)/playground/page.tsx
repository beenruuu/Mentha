'use client';
import { useState } from 'react';

import { fetchFromApi } from '@/lib/api';

export default function PlaygroundPage() {
    const [model, setModel] = useState('google/gemini-2.5-flash');
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResponse('');
        try {
            const data = await fetchFromApi('/ai/chat/completions', {
                method: 'POST',
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                }),
            });
            setResponse(data.choices?.[0]?.message?.content || JSON.stringify(data, null, 2));
        } catch (err: any) {
            setResponse('Error: ' + err.message);
        }
        setLoading(false);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-serif mb-2 text-mentha-forest dark:text-mentha-beige">
                AI Playground
            </h1>
            <p className="font-mono text-sm opacity-70 mb-8">
                Test prompts using OpenRouter models directly from your dashboard.
            </p>

            <form
                onSubmit={handleSubmit}
                className="space-y-6 bg-mentha-mint/5 p-6 md:p-8 border border-mentha-forest/20 rounded-xl"
            >
                <div>
                    <label className="block text-sm font-mono uppercase tracking-wider mb-2">
                        Model
                    </label>
                    <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full bg-mentha-beige dark:bg-mentha-dark border border-mentha-forest/20 p-3 rounded focus:outline-none focus:border-mentha-mint font-sans"
                    >
                        <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="anthropic/claude-3-haiku">Claude 3 Haiku</option>
                        <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        <option value="meta-llama/llama-3-8b-instruct">Llama 3 8B Instruct</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-mono uppercase tracking-wider mb-2">
                        Prompt
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full h-40 bg-mentha-beige dark:bg-mentha-dark border border-mentha-forest/20 p-4 rounded focus:outline-none focus:border-mentha-mint font-sans"
                        placeholder="Write something to the AI..."
                        required
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-mentha-mint text-mentha-dark px-8 py-3 font-mono text-sm uppercase tracking-widest rounded hover:bg-mentha-mint/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Generating...' : 'Send Prompt'}
                    </button>
                </div>
            </form>

            {response && (
                <div className="mt-8 border border-mentha-forest/20 rounded-xl p-6 bg-mentha-beige dark:bg-mentha-dark shadow-sm">
                    <h2 className="text-sm font-mono uppercase tracking-wider opacity-60 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-mentha-mint"></span>
                        Response
                    </h2>
                    <div className="whitespace-pre-wrap font-sans text-base leading-relaxed opacity-90">
                        {response}
                    </div>
                </div>
            )}
        </div>
    );
}
