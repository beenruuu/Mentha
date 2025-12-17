'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    WikipediaIcon,
    G2Icon,
    CapterraIcon,
    TechCrunchIcon,
    ForbesIcon,
    MediumIcon,
    ProductHuntIcon,
    TrustpilotIcon,
    LinkedInIcon,
    RedditIcon,
    QuoraIcon
} from "@/components/shared/authority-icons"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Shield, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/lib/i18n"

interface AuthoritySource {
    source: string
    type: string
    authority: number
    status: 'present' | 'missing' | 'error'
    impact: 'high' | 'medium' | 'low'
    url?: string | null
}

interface AuthoritySourcesCardProps {
    sources?: AuthoritySource[]
    className?: string
}

const sourceIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'Wikipedia': WikipediaIcon,
    'G2': G2Icon,
    'Capterra': CapterraIcon,
    'TechCrunch': TechCrunchIcon,
    'Forbes': ForbesIcon,
    'Medium': MediumIcon,
    'ProductHunt': ProductHuntIcon,
    'Trustpilot': TrustpilotIcon,
    'LinkedIn': LinkedInIcon,
    'Reddit': RedditIcon,
    'Quora': QuoraIcon,
}

// Default sources when no data available
const defaultSources: AuthoritySource[] = [
    { source: 'Wikipedia', type: 'Encyclopedia', authority: 95, status: 'missing', impact: 'high' },
    { source: 'G2', type: 'Review Platform', authority: 85, status: 'missing', impact: 'medium' },
    { source: 'Capterra', type: 'Review Platform', authority: 82, status: 'missing', impact: 'medium' },
    { source: 'TechCrunch', type: 'News', authority: 92, status: 'missing', impact: 'high' },
    { source: 'Forbes', type: 'News', authority: 95, status: 'missing', impact: 'high' },
    { source: 'Medium', type: 'Blog', authority: 75, status: 'missing', impact: 'low' },
    { source: 'ProductHunt', type: 'Community', authority: 80, status: 'missing', impact: 'medium' },
    { source: 'Trustpilot', type: 'Review Platform', authority: 88, status: 'missing', impact: 'medium' },
    { source: 'Reddit', type: 'Community', authority: 75, status: 'missing', impact: 'high' },
    { source: 'Quora', type: 'Community', authority: 70, status: 'missing', impact: 'high' },
]

export function AuthoritySourcesCard({ sources, className }: AuthoritySourcesCardProps) {
    const { t } = useTranslations()
    const displaySources = sources && sources.length > 0 ? sources : defaultSources

    const presentCount = displaySources.filter(s => s.status === 'present').length
    const totalCount = displaySources.length
    const presencePercentage = Math.round((presentCount / totalCount) * 100)

    return (
        <Card className={cn("border-border/50 shadow-sm rounded-xl", className)}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        {t.authoritySources}
                    </CardTitle>
                    <Badge
                        variant="secondary"
                        className={cn(
                            presencePercentage >= 50
                                ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                                : "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                        )}
                    >
                        {presentCount}/{totalCount} {t.verified}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
                    <div className="grid grid-cols-5 gap-2">
                        {displaySources.map((source) => {
                            const IconComponent = sourceIconMap[source.source]
                            const isPresent = source.status === 'present'

                            return (
                                <Tooltip key={source.source}>
                                    <TooltipTrigger asChild>
                                        <a
                                            href={isPresent && source.url ? source.url : undefined}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(
                                                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
                                                isPresent
                                                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                                                    : "bg-secondary/30 border-transparent cursor-default opacity-50"
                                            )}
                                        >
                                            {IconComponent && (
                                                <IconComponent
                                                    className={cn(
                                                        "w-5 h-5 mb-1.5",
                                                        isPresent
                                                            ? "text-emerald-600 dark:text-emerald-400"
                                                            : "text-muted-foreground"
                                                    )}
                                                />
                                            )}
                                            <span className={cn(
                                                "text-[10px] font-medium uppercase tracking-wider text-center",
                                                isPresent
                                                    ? "text-emerald-700 dark:text-emerald-400"
                                                    : "text-muted-foreground"
                                            )}>
                                                {source.source.length > 8 ? source.source.substring(0, 8) : source.source}
                                            </span>
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full mt-1.5",
                                                isPresent ? "bg-emerald-500" : "bg-red-400"
                                            )} />
                                        </a>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                        <div className="space-y-1">
                                            <div className="font-medium">{source.source}</div>
                                            <div className="text-xs text-muted-foreground">{source.type}</div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className={cn(
                                                    "font-medium",
                                                    isPresent ? "text-emerald-600" : "text-red-500"
                                                )}>
                                                    {isPresent ? t.present : t.notFound}
                                                </span>
                                                <span className="text-muted-foreground">•</span>
                                                <span className={cn(
                                                    source.impact === 'high' ? "text-red-500" :
                                                        source.impact === 'medium' ? "text-amber-500" : "text-muted-foreground"
                                                )}>
                                                    {source.impact} {t.impact}
                                                </span>
                                            </div>
                                            {isPresent && source.url && (
                                                <div className="flex items-center gap-1 text-xs text-primary">
                                                    <ExternalLink className="w-3 h-3" />
                                                    {t.clickToView}
                                                </div>
                                            )}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        })}
                    </div>
                </TooltipProvider>

                {/* Summary bar */}
                <div className="mt-4 pt-3 border-t border-border/40">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">{t.authorityCoverage}</span>
                        <span className={cn(
                            "font-medium",
                            presencePercentage >= 50 ? "text-emerald-600" : "text-amber-600"
                        )}>
                            {presencePercentage}%
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-1000",
                                presencePercentage >= 50 ? "bg-emerald-500" : "bg-amber-500"
                            )}
                            style={{ width: `${presencePercentage}%` }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
