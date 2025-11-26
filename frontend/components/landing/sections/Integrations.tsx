"use client";

import Tag from "@/components/landing/Tag";
import IntegrationColumn from "@/components/landing/IntegrationColumn";

const integrations = [
    {
        name: "OpenAI",
        icon: "/providers/openai.svg",
        description: "ChatGPT and GPT-4 powered search and responses.",
    },
    {
        name: "Claude",
        icon: "/providers/claude-color.svg",
        description: "Anthropic's advanced AI assistant with nuanced understanding.",
    },
    {
        name: "Perplexity",
        icon: "/providers/perplexity-color.svg",
        description: "AI-powered answer engine with real-time web search.",
    },
    {
        name: "Gemini",
        icon: "/providers/gemini-color.svg",
        description: "Google's multimodal AI model for diverse tasks.",
    },
];

export default function Integrations() {
    return (
        <section id="integrations" className="py-24 overflow-hidden">
            <div className="container max-w-5xl mx-auto px-4">
                <div className="grid lg:grid-cols-2 items-center lg:gap-16">
                    <div>
                        <Tag>AI Engines</Tag>
                        <h2 className="text-6xl font-medium mt-6">
                            Optimized for{" "}
                            <span className="text-emerald-400">all</span> major AI
                        </h2>

                        <p className="text-white/50 mt-4 text-lg">
                            Mentha analyzes how your brand appears across the
                            leading AI platforms. Track your visibility where it
                            matters most.
                        </p>
                    </div>
                    <div>
                        <div className="grid md:grid-cols-2 gap-4 lg:h-[800px] h-[400px] lg:mt-0 mt-8 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
                            <IntegrationColumn integrations={integrations} />
                            <IntegrationColumn
                                integrations={integrations.slice().reverse()}
                                className="hidden md:flex"
                                reverse
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
