'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import UserIdentityStep from '@/components/onboarding/steps/UserIdentityStep'
import UserProfessionalStep from '@/components/onboarding/steps/UserProfessionalStep'
import UserCompanyStep from '@/components/onboarding/steps/UserCompanyStep'
import UserDiscoveryStep from '@/components/onboarding/steps/UserDiscoveryStep'
import BrandInputStep from '@/components/onboarding/steps/BrandInputStep'
import AnalysisWizardStep from '@/components/onboarding/steps/AnalysisWizardStep'
import AIProvidersStep from '@/components/onboarding/steps/AIProvidersStep'
import DiscoveryPromptsStep from '@/components/onboarding/steps/DiscoveryPromptsStep'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function OnboardingPage() {
  const { currentStep } = useOnboarding()

  const renderStep = () => {
    switch (currentStep) {
      case 'user-identity':
        return <UserIdentityStep />
      case 'user-professional':
        return <UserProfessionalStep />
      case 'user-company':
        return <UserCompanyStep />
      case 'user-discovery':
        return <UserDiscoveryStep />
      case 'brand-input':
        return <BrandInputStep />
      case 'analysis-wizard':
        return <AnalysisWizardStep />
      case 'ai-providers':
        return <AIProvidersStep />
      case 'discovery-prompts':
        return <DiscoveryPromptsStep />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden grid lg:grid-cols-2">
      {/* Left Column: Form Area */}
      <div className="flex flex-col justify-center p-8 lg:p-16 relative z-10 overflow-y-auto">
        <div className="w-full max-w-xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: Decorative Area */}
      <div className="hidden lg:flex flex-col justify-center items-center relative bg-zinc-900 overflow-hidden border-l border-white/5">
        {/* Background Gradients */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-primary/20 rounded-full blur-[150px] animate-pulse duration-[10s]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[80%] h-[80%] bg-purple-500/20 rounded-full blur-[150px] animate-pulse duration-[10s] delay-2000" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center space-y-6 p-12 max-w-lg">
          <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-xl border border-white/10 shadow-2xl">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight">
            Optimize your brand for the <span className="text-primary">Generative Engine Era</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Join thousands of forward-thinking companies mastering their presence on ChatGPT, Claude, Gemini, and more.
          </p>
        </div>

        {/* Decorative Grid/Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>
    </div>
  )
}
