'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

// SVG Icons for providers
const ChatGPTSVG = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.0462 6.0462 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2298V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.6608zm-12.6384-1.0478c-.9996-.587-1.2751-1.8667-.6242-2.8085.194-.2842.4827-.4971.8143-.6013.3316-.1045.6913-.0805 1.0083.0662l4.7688 2.7677-2.0153 1.1638c-1.3398.776-2.6145-1.4246-3.9519.5879z" />
    </svg>
)

const ClaudeSVG = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
    </svg>
)

const GeminiSVG = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2L9.5 9.5L2 12L9.5 14.5L12 22L14.5 14.5L22 12L14.5 9.5L12 2Z" />
    </svg>
)

const PerplexitySVG = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
)

const GrokSVG = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" />
    </svg>
)

const PROVIDER_ICONS: Record<string, any> = {
    chatgpt: ChatGPTSVG,
    claude: ClaudeSVG,
    gemini: GeminiSVG,
    perplexity: PerplexitySVG,
    grok: GrokSVG
}

const PROVIDER_COLORS: Record<string, string> = {
    chatgpt: "text-green-500 bg-green-500/10",
    claude: "text-orange-500 bg-orange-500/10",
    gemini: "text-blue-500 bg-blue-500/10",
    perplexity: "text-cyan-500 bg-cyan-500/10",
    grok: "text-white bg-white/10"
}

export default function AIProvidersStep() {
    const { aiProviders, setAIProviders, nextStep, prevStep } = useOnboarding()

    const toggleProvider = (id: string) => {
        setAIProviders(aiProviders.map(p =>
            p.id === id ? { ...p, selected: !p.selected } : p
        ))
    }

    const selectedCount = aiProviders.filter(p => p.selected).length

    return (
        <div className="w-full flex justify-center animate-in fade-in duration-500">
            <Card className="w-full max-w-3xl p-10 space-y-8 shadow-2xl border-white/10 bg-black/40 backdrop-blur-xl">
                <div className="space-y-2 text-left">
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        Select AI providers
                    </h1>
                    <p className="text-muted-foreground">We'll monitor your brand's presence across these platforms</p>
                </div>

                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Suggested Providers</h2>
                    <span className="text-xs text-muted-foreground">{selectedCount} selected</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {aiProviders.map((provider) => {
                        const Icon = PROVIDER_ICONS[provider.id] || GeminiSVG
                        const colorClass = PROVIDER_COLORS[provider.id] || "text-primary bg-primary/10"

                        return (
                            <div
                                key={provider.id}
                                onClick={() => toggleProvider(provider.id)}
                                className={cn(
                                    "p-4 cursor-pointer transition-all duration-300 relative overflow-hidden group border rounded-lg bg-white/5 hover:bg-white/10",
                                    provider.selected ? "border-primary/50 shadow-lg shadow-primary/10" : "border-white/10 hover:border-white/20"
                                )}
                            >
                                {/* Selection Indicator */}
                                <div className="absolute top-3 right-3">
                                    <div className={cn(
                                        "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300",
                                        provider.selected
                                            ? "bg-primary text-primary-foreground scale-100"
                                            : "bg-white/5 text-muted-foreground group-hover:bg-white/10 scale-90 opacity-50 group-hover:opacity-100"
                                    )}>
                                        {provider.selected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shadow-inner", colorClass)}>
                                        <Icon className="w-6 h-6" />
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="font-bold text-sm text-white">{provider.name}</h3>
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-[10px] text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                                {provider.model}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Background Gradient */}
                                {provider.selected && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="flex justify-between pt-4">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        className="text-muted-foreground hover:text-white"
                    >
                        Back
                    </Button>
                    <Button
                        onClick={nextStep}
                        className="bg-white text-black hover:bg-white/90 px-8 h-11 rounded-md font-medium transition-all"
                    >
                        Confirm Selection
                    </Button>
                </div>
            </Card>
        </div>
    )
}
