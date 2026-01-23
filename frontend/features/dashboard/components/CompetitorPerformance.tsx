import Image from 'next/image'
import { Info } from 'lucide-react'
import {
    Tooltip as TooltipUI,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslations } from "@/lib/i18n"
import { type Brand } from "@/features/brand/api/brands"
import { type Competitor } from "@/features/competitors/api/competitors"

interface CompetitorPerformanceProps {
    viewingCompetitor: Competitor | null
    selectedBrand: Brand
    competitors: Competitor[]
    currentRank: number
    onViewCompetitor: (competitor: Competitor | null) => void
}

export function CompetitorPerformance({
    viewingCompetitor,
    selectedBrand,
    competitors,
    currentRank,
    onViewCompetitor
}: CompetitorPerformanceProps) {
    const { t } = useTranslations()

    return (
        <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                {t.dashboardCompetitionPerformance}
                <TooltipUI>
                    <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                        {t.dashboardCompetitionPerformanceTooltip}
                    </TooltipContent>
                </TooltipUI>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{t.dashboardLive}</span>
            </h3>
            <div className="space-y-3">
                {viewingCompetitor && selectedBrand && (
                    <button
                        onClick={() => onViewCompetitor(null)}
                        className="w-full flex items-center justify-between group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#111114] transition-colors cursor-pointer text-left border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center overflow-hidden">
                                <img
                                    src={`https://www.google.com/s2/favicons?domain=${selectedBrand.domain}&sz=32`}
                                    alt={selectedBrand.name}
                                    className="w-4 h-4 object-contain"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                        e.currentTarget.parentElement!.innerHTML = `<span class="text-[10px] font-bold">${selectedBrand.name.charAt(0)}</span>`
                                    }}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{selectedBrand.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">{t.yourBrand || 'Tu marca'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 justify-end">
                            <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${currentRank}%` }}
                                />
                            </div>
                            <span className="text-xs font-mono text-emerald-600 w-8 text-right">{currentRank}%</span>
                        </div>
                    </button>
                )}
                {(viewingCompetitor
                    ? competitors.filter(c => c.id !== viewingCompetitor.id).slice(0, 4)
                    : competitors.slice(0, 5)
                ).map((comp) => (
                    <button
                        key={comp.id}
                        onClick={() => !viewingCompetitor && onViewCompetitor(comp)}
                        className={`w-full flex items-center justify-between group p-2 rounded-lg transition-colors text-left ${viewingCompetitor ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-[#111114] cursor-pointer'
                            }`}
                        disabled={!!viewingCompetitor}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                                <img
                                    src={`https://www.google.com/s2/favicons?domain=${comp.domain}&sz=32`}
                                    alt={comp.name}
                                    className="w-4 h-4 object-contain"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                        e.currentTarget.parentElement!.innerHTML = `<span class="text-[10px] font-bold">${comp.name.charAt(0)}</span>`
                                    }}
                                />
                            </div>
                            <span className={`text-sm font-medium ${viewingCompetitor ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'} transition-colors`}>{comp.name}</span>
                        </div>
                        <div className="flex items-center gap-3 justify-end">
                            <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${viewingCompetitor ? 'bg-gray-400 dark:bg-gray-600' : 'bg-gray-900 dark:bg-white'} rounded-full`}
                                    style={{ width: `${comp.visibility_score || 0}%` }}
                                />
                            </div>
                            <span className={`text-xs font-mono ${viewingCompetitor ? 'text-gray-400' : 'text-gray-500'} w-8 text-right`}>{comp.visibility_score || 0}%</span>
                        </div>
                    </button>
                ))}
                {competitors.length === 0 && !viewingCompetitor && (
                    <div className="text-sm text-gray-500 italic">{t.noCompetitorsTracked}</div>
                )}
            </div>
        </div>
    )
}
