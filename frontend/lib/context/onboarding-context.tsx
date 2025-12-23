'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

export type OnboardingStep =
    | 'about-you'        // Paso 1: Nombre, apellidos, experiencia SEO
    | 'company'          // Paso 2: URL sitio web, ubicación
    | 'brand-profile'    // Paso 3: Logo, nombre, dominio, categoría, descripción
    | 'competitors'      // Paso 4: Competidores detectados
    | 'research-prompts' // Paso 5: Prompts branded/non-branded
    | 'schedule'         // Paso 6: Configuración de modelos IA (placeholder)
    | 'setup'            // Paso 7: Activación y procesamiento

export interface UserInfo {
    firstName: string
    lastName: string
    seoExperience?: string  // Opcional: experiencia en SEO/IA
}

export interface CompanyInfo {
    websiteUrl: string
    location: string  // Código país ej: ES, US, etc.
    corporateDomain?: string  // Dominio corporativo para auto-unión
}

export interface BrandProfile {
    logo?: string
    name: string
    domain: string
    category: string
    description: string
    // New fields for scope-aware competitor discovery
    businessScope?: 'local' | 'regional' | 'national' | 'international'
    city?: string
    industrySpecific?: string
}

export interface Competitor {
    id: string
    name: string
    domain: string
    logo?: string
    sources?: ('llm_knowledge' | 'web_search' | 'manual' | 'analysis' | 'openai' | 'firecrawl' | 'gemini' | 'google' | 'claude' | 'anthropic' | 'perplexity')[]
    source?: string  // Single source for API submission
    confidence?: 'high' | 'medium' | 'low'
}

export interface ResearchPrompt {
    id: string
    text: string
    type: 'branded' | 'non-branded'
    isCustom?: boolean
}

export interface AIModelSchedule {
    modelId: string
    name: string
    enabled: boolean
    credits?: number  // Placeholder - concepto orientativo
}

export interface ScheduleConfig {
    models: AIModelSchedule[]
    activeDays: string[]  // L, M, X, J, V, S, D
}

interface OnboardingContextType {
    currentStep: OnboardingStep
    setStep: (step: OnboardingStep) => void

    // Paso 1
    userInfo: UserInfo
    setUserInfo: (info: UserInfo) => void

    // Paso 2
    companyInfo: CompanyInfo
    setCompanyInfo: (info: CompanyInfo) => void
    isAnalyzing: boolean
    setIsAnalyzing: (analyzing: boolean) => void

    // Paso 3
    brandProfile: BrandProfile
    setBrandProfile: (profile: BrandProfile) => void

    // Paso 4
    competitors: Competitor[]
    setCompetitors: (competitors: Competitor[]) => void

    // Paso 5
    researchPrompts: ResearchPrompt[]
    setResearchPrompts: (prompts: ResearchPrompt[]) => void

    // Paso 6
    scheduleConfig: ScheduleConfig
    setScheduleConfig: (config: ScheduleConfig) => void

    // Navegación
    nextStep: () => void
    prevStep: () => void

    // Brand ID después de creación
    brandId?: string
    setBrandId: (id: string) => void

    // Analysis status for tracking background analysis
    analysisStatus: 'idle' | 'analyzing' | 'completed' | 'error'
    setAnalysisStatus: (status: 'idle' | 'analyzing' | 'completed' | 'error') => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('about-you')

    // Paso 1 - Acerca de ti
    const [userInfo, setUserInfo] = useState<UserInfo>({
        firstName: '',
        lastName: '',
        seoExperience: ''
    })

    // Paso 2 - Empresa
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
        websiteUrl: '',
        location: ''
    })
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    // Paso 3 - Perfil de Marca
    const [brandProfile, setBrandProfile] = useState<BrandProfile>({
        logo: '',
        name: '',
        domain: '',
        category: '',
        description: '',
        businessScope: 'national',
        city: '',
        industrySpecific: ''
    })

    // Paso 4 - Competidores
    const [competitors, setCompetitors] = useState<Competitor[]>([])

    // Paso 5 - Research Prompts
    const [researchPrompts, setResearchPrompts] = useState<ResearchPrompt[]>([])

    // Paso 6 - Schedule (placeholder)
    const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
        models: [
            { modelId: 'chatgpt', name: 'ChatGPT', enabled: true, credits: 10 },
            { modelId: 'claude', name: 'Claude', enabled: true, credits: 10 },
            { modelId: 'perplexity', name: 'Perplexity', enabled: false, credits: 15 },
            { modelId: 'gemini', name: 'Gemini', enabled: false, credits: 10 },
        ],
        activeDays: ['L', 'M', 'X', 'J', 'V']
    })

    // Brand ID
    const [brandId, setBrandId] = useState<string | undefined>()

    // Analysis status for tracking background analysis
    const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'completed' | 'error'>('idle')

    const steps: OnboardingStep[] = [
        'about-you',
        'company',
        'brand-profile',
        'competitors',
        'research-prompts',
        'schedule',
        'setup'
    ]

    const nextStep = () => {
        const currentIndex = steps.indexOf(currentStep)
        if (currentIndex < steps.length - 1) {
            setCurrentStep(steps[currentIndex + 1])
        }
    }

    const prevStep = () => {
        const currentIndex = steps.indexOf(currentStep)
        if (currentIndex > 0) {
            setCurrentStep(steps[currentIndex - 1])
        }
    }

    return (
        <OnboardingContext.Provider value={{
            currentStep,
            setStep: setCurrentStep,
            userInfo,
            setUserInfo,
            companyInfo,
            setCompanyInfo,
            isAnalyzing,
            setIsAnalyzing,
            brandProfile,
            setBrandProfile,
            competitors,
            setCompetitors,
            researchPrompts,
            setResearchPrompts,
            scheduleConfig,
            setScheduleConfig,
            nextStep,
            prevStep,
            brandId,
            setBrandId,
            analysisStatus,
            setAnalysisStatus
        }}>
            {children}
        </OnboardingContext.Provider>
    )
}

export function useOnboarding() {
    const context = useContext(OnboardingContext)
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider')
    }
    return context
}
