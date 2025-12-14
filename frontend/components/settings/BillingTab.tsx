'use client'

import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BillingTabProps {
    t: Record<string, string>
}

export function BillingTab({ t }: BillingTabProps) {
    return (
        <div className="space-y-6">
            <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>{t.currentPlan}</CardTitle>
                    <CardDescription>{t.currentPlanDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{t.freePlan}</h3>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">{t.activeStatus}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{t.basicFeatures}</p>
                        </div>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Zap className="w-4 h-4 mr-2" />
                            {t.upgradeToPro}
                        </Button>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium mb-4">{t.billingHistory}</h4>
                        <div className="text-center py-8 border-2 border-dashed border-border/40 rounded-lg">
                            <p className="text-sm text-muted-foreground">{t.noInvoicesAvailable}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
