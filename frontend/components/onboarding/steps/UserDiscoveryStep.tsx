'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const DISCOVERY_SOURCES = [
    'Linkedin', 'Product Hunt', 'Google', 'A friend/colleague', 'X', 'At an event', 'Reddit', 'Instagram', 'Facebook', 'Other'
]

export default function UserDiscoveryStep() {
    const { userInfo, setUserInfo, nextStep, prevStep } = useOnboarding()
    const [lang, setLang] = useState<'en' | 'es'>('en')

    useEffect(() => {
        if (userInfo.country === 'ES') {
            setLang('es')
        } else {
            setLang('en')
        }
    }, [userInfo.country])

    const t = {
        title: lang === 'es' ? 'Una última cosa...' : 'One last thing...',
        subtitle: lang === 'es' ? '¿Cómo nos conociste?' : 'How did you hear about us?',
        next: lang === 'es' ? 'Siguiente' : 'Next',
        back: lang === 'es' ? 'Atrás' : 'Back',
    }

    const handleNext = () => {
        if (userInfo.discoverySource) {
            nextStep()
        }
    }

    return (
        <div className="w-full flex justify-center animate-in fade-in duration-500">
            <Card className="w-full max-w-3xl p-10 space-y-8 shadow-2xl border-white/10 bg-black/40 backdrop-blur-xl">
                <div className="space-y-2 text-left">
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        {t.title}
                    </h1>
                    <p className="text-muted-foreground">{t.subtitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {DISCOVERY_SOURCES.map((source) => (
                        <button
                            key={source}
                            onClick={() => setUserInfo({ ...userInfo, discoverySource: source })}
                            className={cn(
                                "px-4 py-3 text-sm font-medium rounded-md border transition-all duration-200 text-left",
                                userInfo.discoverySource === source
                                    ? "bg-white text-black border-white"
                                    : "bg-white/5 hover:bg-white/10 border-white/10 text-muted-foreground hover:text-white"
                            )}
                        >
                            {source}
                        </button>
                    ))}
                </div>

                <div className="flex justify-between pt-4">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        className="text-muted-foreground hover:text-white"
                    >
                        {t.back}
                    </Button>
                    <Button
                        onClick={handleNext}
                        className="bg-white text-black hover:bg-white/90 px-8 h-11 rounded-md font-medium transition-all"
                    >
                        {t.next}
                    </Button>
                </div>
            </Card>
        </div>
    )
}
