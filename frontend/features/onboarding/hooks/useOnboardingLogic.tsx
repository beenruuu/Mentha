'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { useTranslations } from '@/lib/i18n'
import { Sparkles, BarChart3, Target } from 'lucide-react'
import Image from 'next/image'

// Icon Component
const MenthaIcon = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
     <Image 
       src="/mentha.svg" 
       alt="Mentha" 
       fill
       className="object-contain"
       priority
     />
  </div>
)

type Step = 'about-you' | 'company' | 'brand-profile' | 'competitors' | 'discovery-prompts' | 'schedule' | 'setup'

interface StepContent {
    titleEs: string
    titleEn: string
    descriptionEs: string
    descriptionEn: string
    icon: any
}

const STEP_CONTENT: Record<string, StepContent> = {
  'about-you': {
    titleEs: 'Bienvenido a Mentha',
    titleEn: 'Welcome to Mentha',
    descriptionEs: 'La plataforma que te ayuda a dominar tu presencia en los motores de búsqueda de IA.',
    descriptionEn: 'The platform that helps you dominate your presence in AI search engines.',
    icon: MenthaIcon,
  },
  'company': {
    titleEs: 'Análisis inteligente',
    titleEn: 'Smart analysis',
    descriptionEs: 'Analizamos tu sitio web para entender tu marca y sector, generando insights automáticos.',
    descriptionEn: 'We analyze your website to understand your brand and industry, generating automatic insights.',
    icon: BarChart3,
  },
  'brand-profile': {
    titleEs: 'Tu identidad de marca',
    titleEn: 'Your brand identity',
    descriptionEs: 'Perfecciona cómo quieres que tu marca sea representada en las respuestas de IA.',
    descriptionEn: 'Perfect how you want your brand to be represented in AI responses.',
    icon: Target,
  },
  'competitors': {
    titleEs: 'Conoce a tu competencia',
    titleEn: 'Know your competition',
    descriptionEs: 'Identifica y monitoriza a tus competidores para mantenerte siempre un paso adelante.',
    descriptionEn: 'Identify and monitor your competitors to always stay one step ahead.',
    icon: Target,
  },
  'discovery-prompts': {
    titleEs: 'Monitoriza búsquedas clave',
    titleEn: 'Monitor key searches',
    descriptionEs: 'Define qué consultas quieres rastrear para medir tu visibilidad en modelos de IA.',
    descriptionEn: 'Define which queries you want to track to measure your visibility in AI models.',
    icon: Sparkles,
  },
  'schedule': {
    titleEs: 'Configuración avanzada',
    titleEn: 'Advanced configuration',
    descriptionEs: 'Personaliza qué modelos de IA quieres trackear y con qué frecuencia.',
    descriptionEn: 'Customize which AI models you want to track and how often.',
    icon: BarChart3,
  },
  'setup': {
    titleEs: 'Casi listo',
    titleEn: 'Almost ready',
    descriptionEs: 'Estamos configurando todo para ti. En segundos tendrás acceso completo a tu dashboard.',
    descriptionEn: 'We are setting everything up for you. In seconds you will have full access to your dashboard.',
    icon: Sparkles,
  },
}

export function useOnboardingLogic() {
    const { currentStep } = useOnboarding()
    const { lang } = useTranslations()

    const stepContent = STEP_CONTENT[currentStep] || STEP_CONTENT['about-you']
    
    // Ordered steps for progress tracking
    const steps = ['about-you', 'company', 'brand-profile', 'competitors', 'discovery-prompts', 'schedule', 'setup']

    return {
        currentStep,
        stepContent,
        lang,
        steps,
        StepIcon: stepContent.icon
    }
}
