import Image from 'next/image'
import { Info } from 'lucide-react'
import {
    Tooltip as TooltipUI,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslations } from "@/lib/i18n"
import { AI_PROVIDER_META } from './DashboardChart'

interface ModelPerformanceProps {
    modelPerformance: Record<string, number>
}

export function ModelPerformance({ modelPerformance }: ModelPerformanceProps) {
    const { t } = useTranslations()

    return (
        <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                {t.dashboardModelPerformance}
                <TooltipUI>
                    <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                        {t.dashboardModelPerformanceTooltip}
                    </TooltipContent>
                </TooltipUI>
            </h3>
            <div className="space-y-3">
                {AI_PROVIDER_META.map((provider) => {
                    const score = modelPerformance[provider.id] || 0
                    const hasData = modelPerformance[provider.id] !== undefined

                    return (
                        <div key={provider.id} className="flex items-center justify-between group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#111114] transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 p-1.5 text-gray-900 dark:text-white flex items-center justify-center">
                                    <Image
                                        src={provider.icon}
                                        alt={provider.name}
                                        width={20}
                                        height={20}
                                        className={provider.icon.includes('openai.svg') ? 'w-full h-full object-contain dark:invert' : 'w-full h-full object-contain'}
                                    />
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{provider.name}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-1 justify-end max-w-[140px]">
                                {hasData ? (
                                    <>
                                        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                style={{ width: `${score}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-mono text-emerald-500 font-medium w-9 text-right">
                                            {Math.round(score)}%
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-xs text-gray-400">{t.dashboardNoData}</span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
