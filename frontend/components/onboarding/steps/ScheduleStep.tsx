'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Bot, Calendar, Info, Sparkles } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const DAYS = [
    { id: 'L', labelEs: 'L', labelEn: 'M' },
    { id: 'M', labelEs: 'M', labelEn: 'T' },
    { id: 'X', labelEs: 'X', labelEn: 'W' },
    { id: 'J', labelEs: 'J', labelEn: 'T' },
    { id: 'V', labelEs: 'V', labelEn: 'F' },
    { id: 'S', labelEs: 'S', labelEn: 'S' },
    { id: 'D', labelEs: 'D', labelEn: 'S' },
]

const MODEL_LOGOS: Record<string, string> = {
    chatgpt: '/providers/openai.svg',
    claude: '/providers/claude-color.svg',
    perplexity: '/providers/perplexity-color.svg',
    gemini: '/providers/gemini-color.svg',
}

export default function ScheduleStep() {
    const { scheduleConfig, setScheduleConfig, nextStep, prevStep } = useOnboarding()
    const { lang } = useTranslations()

    const t = {
        title: lang === 'es' ? 'Configuración de seguimiento' : 'Tracking Configuration',
        subtitle: lang === 'es' 
            ? 'Selecciona los modelos de IA a monitorizar y los días de análisis' 
            : 'Select AI models to monitor and analysis days',
        aiModels: lang === 'es' ? 'Modelos de IA' : 'AI Models',
        aiModelsDesc: lang === 'es' 
            ? 'Selecciona qué motores de IA quieres trackear' 
            : 'Select which AI engines you want to track',
        credits: lang === 'es' ? 'créditos/día' : 'credits/day',
        schedule: lang === 'es' ? 'Días de análisis' : 'Analysis Days',
        scheduleDesc: lang === 'es' 
            ? 'Días en los que se generará y revisará data' 
            : 'Days when data will be generated and reviewed',
        placeholder: lang === 'es' 
            ? 'Esta configuración es orientativa. El sistema de créditos y planes no está definido.' 
            : 'This configuration is indicative. The credits and plans system is not defined.',
        next: lang === 'es' ? 'Continuar' : 'Continue',
        back: lang === 'es' ? 'Atrás' : 'Back',
        step: lang === 'es' ? 'Paso 6 de 7' : 'Step 6 of 7',
        enabled: lang === 'es' ? 'Activado' : 'Enabled',
        disabled: lang === 'es' ? 'Desactivado' : 'Disabled',
    }

    const toggleModel = (modelId: string) => {
        setScheduleConfig({
            ...scheduleConfig,
            models: scheduleConfig.models.map(m => 
                m.modelId === modelId ? { ...m, enabled: !m.enabled } : m
            )
        })
    }

    const toggleDay = (dayId: string) => {
        const isActive = scheduleConfig.activeDays.includes(dayId)
        setScheduleConfig({
            ...scheduleConfig,
            activeDays: isActive
                ? scheduleConfig.activeDays.filter(d => d !== dayId)
                : [...scheduleConfig.activeDays, dayId]
        })
    }

    const enabledModels = scheduleConfig.models.filter(m => m.enabled)
    const totalCredits = enabledModels.reduce((sum, m) => sum + (m.credits || 0), 0)

    return (
        <div className="w-full flex justify-center animate-in fade-in duration-500">
            <Card className="w-full max-w-2xl p-6 md:p-8 space-y-4 shadow-2xl border-white/10 bg-black/40 backdrop-blur-xl">
                {/* Step indicator */}
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {t.step}
                    </span>
                </div>

                <div className="space-y-2 text-left">
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        {t.title}
                    </h1>
                    <p className="text-muted-foreground">{t.subtitle}</p>
                </div>

                {/* Placeholder notice */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <Info className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-500/90">{t.placeholder}</p>
                </div>

                <div className="space-y-5">
                    {/* AI Models */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4 text-primary" />
                            <Label className="text-sm font-medium text-white">{t.aiModels}</Label>
                        </div>
                        <p className="text-xs text-muted-foreground">{t.aiModelsDesc}</p>
                        
                        <div className="grid grid-cols-2 gap-2">
                            {scheduleConfig.models.map((model) => (
                                <div 
                                    key={model.modelId}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
                                        model.enabled 
                                            ? "bg-primary/10 border-primary/30" 
                                            : "bg-white/5 border-white/10 hover:border-white/20"
                                    )}
                                    onClick={() => toggleModel(model.modelId)}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                                            {MODEL_LOGOS[model.modelId] ? (
                                                <Image
                                                    src={MODEL_LOGOS[model.modelId]}
                                                    alt={model.name}
                                                    width={18}
                                                    height={18}
                                                    className="object-contain"
                                                />
                                            ) : (
                                                <Bot className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{model.name}</p>
                                            {model.credits && (
                                                <p className="text-[10px] text-muted-foreground">
                                                    ~{model.credits} {t.credits}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Switch 
                                        checked={model.enabled}
                                        onCheckedChange={() => toggleModel(model.modelId)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Schedule Days */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <Label className="text-sm font-medium text-white">{t.schedule}</Label>
                        </div>
                        <p className="text-xs text-muted-foreground">{t.scheduleDesc}</p>
                        
                        <div className="flex gap-2 justify-center">
                            {DAYS.map((day) => {
                                const isActive = scheduleConfig.activeDays.includes(day.id)
                                return (
                                    <button
                                        key={day.id}
                                        onClick={() => toggleDay(day.id)}
                                        className={cn(
                                            "w-9 h-9 rounded-lg font-medium text-sm transition-all",
                                            isActive 
                                                ? "bg-primary text-primary-foreground" 
                                                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/10"
                                        )}
                                    >
                                        {lang === 'es' ? day.labelEs : day.labelEn}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-sm text-white">
                                {enabledModels.length} {lang === 'es' ? 'modelos activos' : 'active models'}
                            </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            ~{totalCredits * scheduleConfig.activeDays.length} {lang === 'es' ? 'créditos/semana' : 'credits/week'}
                        </span>
                    </div>
                </div>

                <div className="flex justify-between pt-2">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        className="text-muted-foreground hover:text-white"
                    >
                        {t.back}
                    </Button>
                    <Button
                        onClick={nextStep}
                        className="bg-white text-black hover:bg-white/90 px-8 h-10 rounded-md font-medium transition-all"
                    >
                        {t.next}
                    </Button>
                </div>
            </Card>
        </div>
    )
}
