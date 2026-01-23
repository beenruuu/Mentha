'use client'

import { Bell } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface NotificationPreferences {
    rankingChanges: boolean
    newMentions: boolean
    weeklyReports: boolean
    productUpdates: boolean
}

interface NotificationsTabProps {
    t: Record<string, string>
    notifications: NotificationPreferences
    onToggle: (key: keyof NotificationPreferences) => void
}

export function NotificationsTab({ t, notifications, onToggle }: NotificationsTabProps) {
    return (
        <div className="space-y-6">
            <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>{t.emailNotifications}</CardTitle>
                    <CardDescription>{t.emailNotificationsDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">{t.rankingChanges}</Label>
                            <p className="text-sm text-muted-foreground">{t.receiveAlertsWhenBrandsChange}</p>
                        </div>
                        <Switch
                            checked={notifications.rankingChanges}
                            onCheckedChange={() => onToggle('rankingChanges')}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">{t.newMentions}</Label>
                            <p className="text-sm text-muted-foreground">{t.notificationsWhenNewMentions}</p>
                        </div>
                        <Switch
                            checked={notifications.newMentions}
                            onCheckedChange={() => onToggle('newMentions')}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">{t.weeklyReports}</Label>
                            <p className="text-sm text-muted-foreground">{t.weeklyPerformanceSummary}</p>
                        </div>
                        <Switch
                            checked={notifications.weeklyReports}
                            onCheckedChange={() => onToggle('weeklyReports')}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
