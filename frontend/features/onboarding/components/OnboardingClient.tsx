'use client'

import Image from 'next/image'
import { ThemeToggleSimple } from '@/components/shared/theme-toggle-simple'
import AboutYouStep from '@/components/onboarding/steps/AboutYouStep'
import CompanyStep from '@/components/onboarding/steps/CompanyStep'
import BrandProfileStep from '@/components/onboarding/steps/BrandProfileStep'
import CompetitorsStep from '@/components/onboarding/steps/CompetitorsStep'
import DiscoveryPromptsStep from '@/components/onboarding/steps/DiscoveryPromptsStep'
import ScheduleStep from '@/components/onboarding/steps/ScheduleStep'
import SetupStep from '@/components/onboarding/steps/SetupStep'

import { useOnboardingLogic } from '../hooks/useOnboardingLogic'

export function OnboardingClient() {
  const { 
    currentStep, 
    stepContent, 
    lang, 
    steps,
    StepIcon 
  } = useOnboardingLogic()

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
      case 'discovery-prompts':
        return <DiscoveryPromptsStep />
      case 'schedule':
        return <ScheduleStep />
      case 'setup':
        return <SetupStep />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden grid md:grid-cols-2 transition-colors duration-300">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggleSimple />
      </div>

      {/* Left Column: Form Area */}
      <div className="flex flex-col justify-center p-4 md:p-8 relative z-10 overflow-y-auto">
        {/* Logo */}
        <div className="absolute top-4 left-4 md:top-6 md:left-8">
          <Image
            src="/mentha-logo-white.svg"
            alt="Mentha"
            width={32}
            height={32}
            className="h-8 w-8 invert dark:invert-0 transition-all"
            priority
          />
        </div>

        <div className="w-full max-w-2xl mx-auto pt-12 md:pt-0">
          <div className="w-full">
            {renderStep()}
          </div>
        </div>
      </div>

      {/* Right Column: Decorative Area */}
      <div className="hidden md:flex flex-col relative bg-zinc-50 dark:bg-zinc-900 overflow-hidden border-l border-border transition-colors duration-300">
        {/* Background Gradients */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[150px] animate-pulse duration-[10s]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[80%] h-[80%] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[150px] animate-pulse duration-[10s] delay-2000" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center space-y-6 p-12 max-w-lg mx-auto w-full">
          <div className="w-24 h-24 p-5 bg-white dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-xl border border-zinc-200 dark:border-white/10 shadow-2xl dark:shadow-none transition-colors duration-300">
            <StepIcon className="w-full h-full text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-foreground transition-colors duration-300">
            {lang === 'es' ? stepContent.titleEs : stepContent.titleEn}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed transition-colors duration-300">
            {lang === 'es' ? stepContent.descriptionEs : stepContent.descriptionEn}
          </p>
        </div>

        {/* Decorative Grid/Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-40 dark:opacity-100 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

        {/* Step progress indicator */}
        <div className="relative z-20 pb-12 flex justify-center items-center gap-2">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`rounded-full transition-all duration-300 ${currentStep === step
                ? 'w-8 h-2 bg-primary'
                : steps.indexOf(currentStep as string) > index
                  ? 'w-2 h-2 bg-primary/50'
                  : 'w-2 h-2 bg-zinc-300 dark:bg-zinc-700'
                }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
