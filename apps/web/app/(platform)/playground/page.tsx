'use client';

import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlaygroundPage() {
    return (
        <div className="space-y-6 max-w-4xl">
            <div className="mb-8">
                <h1 className="font-serif text-3xl font-light text-mentha-forest dark:text-mentha-beige">
                    AI Playground
                </h1>
                <p className="font-sans text-sm text-mentha-forest/60 dark:text-mentha-beige/60 mt-1">
                    Experiment with agentic prompts and model behaviors
                </p>
            </div>

            <Card className="border-mentha-mint/20 bg-mentha-mint/5">
                <CardHeader className="text-center py-12">
                    <div className="mx-auto w-16 h-16 rounded-full bg-mentha-mint/10 flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-mentha-mint" />
                    </div>
                    <CardTitle className="font-serif text-3xl mb-2">Coming Soon</CardTitle>
                    <p className="text-mentha-forest/60 dark:text-mentha-beige/60 max-w-sm mx-auto">
                        We are building an interactive environment where you can test AEO strategies
                        in real-time. Stay tuned for v1.1!
                    </p>
                </CardHeader>
                <CardContent className="flex justify-center pb-12">
                    <div className="flex gap-4 opacity-40">
                        <div className="w-24 h-24 rounded-2xl bg-mentha-forest/5 border border-mentha-forest/10 animate-pulse" />
                        <div className="w-24 h-24 rounded-2xl bg-mentha-forest/5 border border-mentha-forest/10 animate-pulse delay-75" />
                        <div className="w-24 h-24 rounded-2xl bg-mentha-forest/5 border border-mentha-forest/10 animate-pulse delay-150" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
