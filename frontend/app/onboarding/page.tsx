'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import AboutYouStep from '@/components/onboarding/steps/AboutYouStep'
import CompanyStep from '@/components/onboarding/steps/CompanyStep'
import BrandProfileStep from '@/components/onboarding/steps/BrandProfileStep'
import CompetitorsStep from '@/components/onboarding/steps/CompetitorsStep'
import ResearchPromptsStep from '@/components/onboarding/steps/ResearchPromptsStep'
import ScheduleStep from '@/components/onboarding/steps/ScheduleStep'
import SetupStep from '@/components/onboarding/steps/SetupStep'
import { Sparkles, BarChart3, Target, Zap } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'
import Image from 'next/image'

// Step-specific content for the right panel
const STEP_CONTENT = {
  'about-you': {
    titleEs: 'Bienvenido a Mentha',
    titleEn: 'Welcome to Mentha',
    descriptionEs: 'La plataforma que te ayuda a dominar tu presencia en los motores de búsqueda de IA.',
    descriptionEn: 'The platform that helps you dominate your presence in AI search engines.',
    icon: Sparkles,
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
  'research-prompts': {
    titleEs: 'Prompts de investigación',
    titleEn: 'Research prompts',
    descriptionEs: 'Define las consultas que usaremos para analizar cómo apareces en los motores de IA.',
    descriptionEn: 'Define the queries we will use to analyze how you appear in AI engines.',
    icon: Zap,
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

export default function OnboardingPage() {
  const { currentStep } = useOnboarding()
  const { lang } = useTranslations()

  const renderStep = () => {
    switch (currentStep) {
      case 'about-you':
        return <AboutYouStep />
      case 'company':
        return <CompanyStep />
      case 'brand-profile':
        return <BrandProfileStep />
      case 'competitors':
        return <CompetitorsStep />
      case 'research-prompts':
        return <ResearchPromptsStep />
      case 'schedule':
        return <ScheduleStep />
      case 'setup':
        return <SetupStep />
      default:
        return null
    }
  }

  const stepContent = STEP_CONTENT[currentStep] || STEP_CONTENT['about-you']
  const StepIcon = stepContent.icon

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden grid lg:grid-cols-2">
      {/* Left Column: Form Area */}
      <div className="flex flex-col justify-center p-4 lg:p-8 relative z-10 overflow-y-auto">
        {/* Logo */}
        <div className="absolute top-4 left-4 lg:top-6 lg:left-8">
          <Image
            src="/mentha-logo-white.svg"
            alt="Mentha"
            width={32}
            height={32}
            className="h-8 w-8"
            priority
          />
        </div>

        <div className="w-full max-w-2xl mx-auto pt-12 lg:pt-0">
          <div className="w-full">
            {renderStep()}
          </div>
        </div>
      </div>

      {/* Right Column: Decorative Area */}
      <div className="hidden lg:flex flex-col justify-center items-center relative bg-zinc-900 overflow-hidden border-l border-white/5">
        {/* Background Gradients */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-emerald-500/20 rounded-full blur-[150px] animate-pulse duration-[10s]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[80%] h-[80%] bg-emerald-500/15 rounded-full blur-[150px] animate-pulse duration-[10s] delay-2000" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center space-y-6 p-12 max-w-lg">
          <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-xl border border-white/10 shadow-2xl">
            <StepIcon className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight">
            {lang === 'es' ? stepContent.titleEs : stepContent.titleEn}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {lang === 'es' ? stepContent.descriptionEs : stepContent.descriptionEn}
          </p>
        </div>

        {/* Decorative Grid/Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

        {/* Step progress indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {['about-you', 'company', 'brand-profile', 'competitors', 'research-prompts', 'schedule'].map((step, index) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentStep === step 
                  ? 'w-8 bg-primary' 
                  : currentStep === 'setup' || Object.keys(STEP_CONTENT).indexOf(currentStep) > index
                    ? 'bg-primary/50'
                    : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
