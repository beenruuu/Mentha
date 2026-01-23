'use client'

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { setLanguage, type Language } from "@/lib/i18n"

interface AppearanceTabProps {
    t: Record<string, string>
    lang: Language
    onLanguageChange: (lang: Language) => void
}

export function AppearanceTab({ t, lang, onLanguageChange }: AppearanceTabProps) {
    const router = useRouter()

    const handleLanguageChange = (newLang: Language) => {
        setLanguage(newLang)
        onLanguageChange(newLang)
        if (typeof document !== 'undefined') {
            document.documentElement.lang = newLang
        }
        toast.success(`${t.languageChangedTo} ${newLang === 'es' ? 'Español' : 'English'}`)
        router.refresh()
    }

    return (
        <div className="space-y-6">
            <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>{t.appearanceTitle}</CardTitle>
                    <CardDescription>{t.appearanceDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-4">
                        <Label className="text-base">{t.theme}</Label>
                        <ThemeToggle />
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <Label className="text-base">{t.language}</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div
                                onClick={() => handleLanguageChange('es')}
                                className={`cursor-pointer relative overflow-hidden p-4 rounded-xl border transition-all duration-200 group ${lang === 'es'
                                    ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                                    : 'border-border/40 hover:border-emerald-500/30 hover:bg-emerald-500/5'
                                    }`}
                            >
                                <div className="flex flex-col gap-3">
                                    <span className="text-2xl">🇪🇸</span>
                                    <div>
                                        <p className={`font-medium ${lang === 'es' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>Español</p>
                                        <p className="text-xs text-muted-foreground">Spanish</p>
                                    </div>
                                </div>
                                {lang === 'es' && (
                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                )}
                            </div>
                            <div
                                onClick={() => handleLanguageChange('en')}
                                className={`cursor-pointer relative overflow-hidden p-4 rounded-xl border transition-all duration-200 group ${lang === 'en'
                                    ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                                    : 'border-border/40 hover:border-emerald-500/30 hover:bg-emerald-500/5'
                                    }`}
                            >
                                <div className="flex flex-col gap-3">
                                    <span className="text-2xl">🇺🇸</span>
                                    <div>
                                        <p className={`font-medium ${lang === 'en' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>English</p>
                                        <p className="text-xs text-muted-foreground">United States</p>
                                    </div>
                                </div>
                                {lang === 'en' && (
                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
