"use client";


import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input";
import { ArrowUp, Square } from "lucide-react";
import { useState } from "react";

const TheShift: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');

  const handlePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;
    setIsLoading(true);
    setResponse('');
    setTimeout(() => {
        setResponse(`Based on the current knowledge graph, the optimal strategy for "${prompt}" involves leveraging semantic content clusters and injecting brand authority into high-ranking citation sources.`);
        setIsLoading(false);
    }, 2000);
  };

  return (
    <section id="shift" className="w-full border-b border-mentha-forest dark:border-mentha-beige">
      
      {/* Ticker */}
      <div className="w-full border-b border-mentha-forest dark:border-mentha-beige bg-mentha-mint text-mentha-forest py-3 select-none overflow-hidden">
        <div className="whitespace-nowrap flex animate-marquee">
           {Array(10).fill(null).map((_, i) => (
             <span key={i} className="mx-8 font-mono text-xs font-bold uppercase tracking-widest flex items-center">
               <span className="w-2 h-2 bg-mentha-forest rounded-full mr-2"></span>
               FROM SEARCH TO ANSWER /// OPTIMIZE FOR INTENT
             </span>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[700px]">
        
        {/* TEXT COLUMN */}
        <div className="p-12 lg:p-24 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-mentha-forest dark:border-mentha-beige bg-inherit">
          <div className="font-mono text-xs uppercase tracking-widest mb-8 text-mentha-mint">
            [ 02 — Paradigm Shift ]
          </div>
          
          <h2 className="font-serif text-6xl lg:text-7xl leading-[0.95] mb-12">
            The Age of the <br />
            <span className="italic text-mentha-mint">Answer.</span>
          </h2>

          <div className="space-y-12">
            <div className="relative pl-8 border-l border-mentha-forest dark:border-mentha-beige border-opacity-30">
              <span className="absolute -left-[5px] top-0 w-2.5 h-2.5 bg-current rounded-full opacity-30"></span>
              <h4 className="font-mono text-sm uppercase tracking-widest mb-2 opacity-60 line-through">Search Engine (Legacy)</h4>
              <p className="font-sans text-xl opacity-80 leading-relaxed">
                10 blue links. Fragmentation. The user manually searches, filters, and synthesizes.
              </p>
            </div>

            <div className="relative pl-8 border-l-2 border-mentha-mint">
              <span className="absolute -left-[5px] top-0 w-2.5 h-2.5 bg-mentha-mint rounded-full"></span>
              <h4 className="font-mono text-sm uppercase tracking-widest mb-2 text-mentha-mint">Answer Engine (Current)</h4>
              <p className="font-sans text-xl font-medium leading-relaxed">
                A single answer. Synthesis. The AI processes authority and delivers the truth.
              </p>
            </div>
          </div>
        </div>

        {/* VISUAL COLUMN - Mock Prompt */}
        <div className="md:col-span-1 flex items-center justify-center p-12 lg:p-24">
          <PromptInputBasic />
        </div>
      </div>

      <style>{`
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .typing-effect {
            overflow: hidden;
            white-space: nowrap;
            border-right: 2px solid transparent;
            animation: typing 3.5s steps(40, end), blink-caret .75s step-end infinite;
        }
        @keyframes typing {
            from { width: 0 }
            to { width: 100% }
        }
        @keyframes blink-caret {
            from, to { border-color: transparent }
            50% { border-color: #73D29B }
        }
      `}</style>
    </section>
  );
};

export default TheShift;

  // Adapted PromptInputBasic for AI-like experience
  function PromptInputBasic() {
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState("");

    const handleSubmit = () => {
      if (!input.trim()) return;
      setIsLoading(true);
      setResponse("");
      // simulate request
      setTimeout(() => {
        setIsLoading(false);
        setResponse(
          `The best generative strategy for "${input}" is to leverage semantic clusters and strengthen brand authority in citable sources. Practical steps: 1) map entities; 2) optimize snippets; 3) add verifiable citations.`
        );
        setInput("");
      }, 1400);
    };

    const handleValueChange = (value: string) => {
      setInput(value);
    };

    return (
      <div className="w-full max-w-md">
        {response ? (
          <div className="mb-2 p-2 border border-slate-200 rounded-lg bg-white dark:bg-mentha-dark/60 dark:border-mentha-beige/30 shadow-sm">
            <p className="font-serif text-sm leading-snug text-mentha-forest dark:text-mentha-beige whitespace-pre-line">{response}</p>
          </div>
        ) : null}

        <PromptInput
          value={input}
          onValueChange={handleValueChange}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-mentha-dark/60 border border-slate-200 dark:border-mentha-beige/30 rounded-xl p-2 shadow-sm"
        >
          <PromptInputTextarea
            placeholder="Ask me anything..."
            className="w-full min-h-[28px] resize-none bg-transparent border-none rounded-md p-0 font-mono text-sm placeholder-slate-400 dark:placeholder-mentha-beige/60 focus:outline-none"
          />
          <PromptInputActions className="justify-end pt-0.5 flex">
            <PromptInputAction tooltip={isLoading ? "Stop generation" : "Send message"}>
              <Button
                variant="default"
                size="icon"
                className="h-6 w-6 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow"
                onClick={handleSubmit}
              >
                {isLoading ? (
                  <Square className="size-3 fill-current" />
                ) : (
                  <ArrowUp className="size-3" />
                )}
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
      </div>
    );
  }
