'use client'

import { useState, useEffect } from 'react'
import { Check, X, Sparkles } from 'lucide-react'
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useTranslations } from '@/lib/i18n'

interface UpgradeModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
    const { t } = useTranslations()
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
    const [upgradeOrg, setUpgradeOrg] = useState(true)

    useEffect(() => {
        const handleOpenModal = () => onOpenChange(true)
        window.addEventListener('open-upgrade-modal', handleOpenModal)
        return () => window.removeEventListener('open-upgrade-modal', handleOpenModal)
    }, [onOpenChange])

    const monthlyPrice = 18
    const annualPrice = 15
    const currentPrice = billingPeriod === 'monthly' ? monthlyPrice : annualPrice
    const userCount = 1
    const subtotal = currentPrice * userCount
    const tax = subtotal * 0.21
    const total = subtotal + tax

    const features = [
        {
            title: t.unlimitedAnalyses || 'Análisis ilimitados',
            description: t.unlimitedAnalysesDesc || 'Analiza tu marca en todos los modelos de IA sin límites.',
        },
        {
            title: t.advancedInsights || 'Insights avanzados',
            description: t.advancedInsightsDesc || 'Accede a análisis profundos y tendencias de visibilidad.',
        },
        {
            title: t.prioritySupport || 'Soporte prioritario',
            description: t.prioritySupportDesc || 'Respuestas rápidas de nuestro equipo de expertos.',
        },
        {
            title: t.apiAccessFeature || 'Acceso API',
            description: t.apiAccessFeatureDesc || 'Integra Mentha con tus herramientas y automatiza flujos.',
        },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-7xl w-[95vw] p-0 gap-0 border border-border shadow-2xl bg-background overflow-hidden"
                showCloseButton={false}
            >
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px]">
                    {/* Left Column - Features */}
                    <div className="p-8 lg:p-10">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center mb-6">
                            <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl font-bold text-foreground mb-2">
                            {t.upgradeToProTitle || 'Actualizar a Pro'}
                        </h2>
                        <p className="text-muted-foreground text-base mb-8">
                            {t.upgradeToProSubtitle || 'Desbloquea todo el potencial de Mentha'}
                        </p>

                        {/* Features List */}
                        <div className="space-y-5">
                            {features.map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                                    </div>
                                    <div>
                                        <h4 className="text-foreground font-semibold">{feature.title}</h4>
                                        <p className="text-muted-foreground text-sm mt-1">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Scroll indicator */}
                        <div className="mt-8 flex items-center gap-2 text-muted-foreground/50 text-xs">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                            <span>{t.scrollDown || 'Desliza hacia abajo'}</span>
                        </div>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="bg-muted/40 dark:bg-muted/20 p-8 lg:p-10 border-t lg:border-t-0 lg:border-l border-border relative">
                        {/* Close Button */}
                        <button
                            onClick={() => onOpenChange(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>

                        {/* Header */}
                        <h3 className="text-lg font-semibold text-foreground mb-5">
                            {t.orderSummary || 'Resumen del pedido'}
                        </h3>

                        {/* Effective Today Badge */}
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-lg px-4 py-3 mb-5 border border-emerald-200 dark:border-emerald-500/20">
                            <p className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">{t.effectiveToday || 'Efectivo hoy'}</p>
                            <p className="text-emerald-600/70 dark:text-emerald-400/60 text-xs">{t.planWillUpgrade || 'El plan se actualizará hoy'}</p>
                        </div>

                        {/* Plan Selection */}
                        <div className="flex items-center justify-between py-3 border-b border-border">
                            <div>
                                <p className="text-foreground font-medium">Plan Pro</p>
                                <p className="text-muted-foreground text-sm">
                                    {billingPeriod === 'monthly' ? 'Facturación mensual' : 'Facturación anual'}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-foreground font-semibold text-lg">${currentPrice}</span>
                                <span className="text-muted-foreground text-sm">/mes</span>
                                <button
                                    onClick={() => setBillingPeriod(prev => prev === 'monthly' ? 'annual' : 'monthly')}
                                    className="ml-2 p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-muted rounded"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Upgrade Organization Toggle */}
                        <div className="flex items-center justify-between py-3 border-b border-border">
                            <div>
                                <p className="text-foreground text-sm">{t.upgradeOrganization || 'Actualizar organización'}</p>
                                <p className="text-muted-foreground text-xs">Facturación mensual</p>
                            </div>
                            <Switch
                                checked={upgradeOrg}
                                onCheckedChange={setUpgradeOrg}
                                className="data-[state=checked]:bg-emerald-500"
                            />
                        </div>

                        {/* User Count */}
                        <div className="flex items-center justify-between py-3 border-b border-border text-sm">
                            <p className="text-muted-foreground">{userCount} usuario(s)</p>
                            <p className="text-muted-foreground">{userCount} x ${currentPrice}</p>
                        </div>

                        {/* Pricing Breakdown */}
                        <div className="py-3 space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-muted-foreground">Subtotal</p>
                                <p className="text-foreground">${subtotal.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-muted-foreground">IVA (si aplica)</p>
                                <p className="text-muted-foreground">${tax.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Total */}
                        <div className="flex items-center justify-between py-4 mb-4">
                            <p className="text-foreground font-semibold">Total de hoy</p>
                            <p className="text-foreground font-bold text-xl">${total.toFixed(2)}</p>
                        </div>

                        {/* CTA Button */}
                        <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold h-12 rounded-lg shadow-md">
                            {t.confirmPayment || 'Confirmar pago'}
                        </Button>

                        {/* Terms */}
                        <p className="text-center text-muted-foreground text-xs mt-4 leading-relaxed">
                            Al continuar, aceptas nuestros{' '}
                            <a href="/terms" className="text-emerald-600 dark:text-emerald-400 underline">
                                Términos y Condiciones
                            </a>.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export const openUpgradeModal = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-upgrade-modal'))
    }
}
