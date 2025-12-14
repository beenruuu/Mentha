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
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                onClick={() => handleLanguageChange('es')}
                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${lang === 'es'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border/40 hover:border-border/80'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm text-lg">🇪🇸</div>
                                    <div>
                                        <p className="font-medium">{t.spanish}</p>
                                        <p className="text-xs text-muted-foreground">Español</p>
                                    </div>
                                </div>
                            </div>
                            <div
                                onClick={() => handleLanguageChange('en')}
                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${lang === 'en'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border/40 hover:border-border/80'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm text-lg">🇺🇸</div>
                                    <div>
                                        <p className="font-medium">{t.english}</p>
                                        <p className="text-xs text-muted-foreground">English</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
