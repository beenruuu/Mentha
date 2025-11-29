'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

export type OnboardingStep =
    | 'user-identity'
    | 'user-professional'
    | 'user-company'
    | 'user-discovery'
    | 'brand-input'
    | 'ai-providers'
    | 'discovery-prompts'
    | 'analysis-progress'
    | 'completion'

export interface UserInfo {
    firstName: string
    lastName: string
    country: string
    industry: string
    role: string
    companyName: string
    discoverySource: string
    preferredLanguage: 'en' | 'es' | 'fr' | 'de' | 'it'
}

export interface BrandInfo {
    url: string
    domain: string
    favicon?: string
    logo?: string
    title?: string
    description?: string
    industry?: string
    location?: string
    founded?: string
    businessModel?: string
    services?: string[]  // Services inferred from the website
    id?: string  // Brand ID after creation
}

export interface AIProvider {
    id: string
    name: string
    model: string
    status: 'connected' | 'connect'
    selected: boolean
}

export interface DiscoveryPrompt {
    id: string
    text: string
    selected: boolean
    isCustom?: boolean
}

interface OnboardingContextType {
    currentStep: OnboardingStep
    setStep: (step: OnboardingStep) => void
    userInfo: UserInfo
    setUserInfo: (info: UserInfo) => void
    brandInfo: BrandInfo
    setBrandInfo: (info: BrandInfo) => void
    aiProviders: AIProvider[]
    setAIProviders: (providers: AIProvider[]) => void
    discoveryPrompts: DiscoveryPrompt[]
    setDiscoveryPrompts: (prompts: DiscoveryPrompt[]) => void
    nextStep: () => void
    prevStep: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('user-identity')

    const [userInfo, setUserInfo] = useState<UserInfo>({
        firstName: '', 
        lastName: '', 
        country: '', 
        industry: '',
        role: '',
        companyName: '',
        discoverySource: '',
        preferredLanguage: 'en'
    })

    const [brandInfo, setBrandInfo] = useState<BrandInfo>({
        url: '',
        domain: ''
    })

    const [aiProviders, setAIProviders] = useState<AIProvider[]>([
        { id: 'chatgpt', name: 'ChatGPT', model: 'GPT-5', status: 'connected', selected: true },
        { id: 'claude', name: 'Claude', model: 'Claude 4.5 Sonnet', status: 'connected', selected: true },
        { id: 'gemini', name: 'Google Gemini', model: 'Gemini 2.5 Flash', status: 'connected', selected: true },
        { id: 'perplexity', name: 'Perplexity', model: 'Sonar', status: 'connect', selected: false },
        { id: 'grok', name: 'Grok', model: 'Grok 4', status: 'connect', selected: false },
    ])

    // Discovery prompts will be generated dynamically based on brand info
    const [discoveryPrompts, setDiscoveryPrompts] = useState<DiscoveryPrompt[]>([])

    const steps: OnboardingStep[] = [
        'user-identity',
        'user-professional',
        'user-company',
        'user-discovery',
        'brand-input',
        'ai-providers',
        'discovery-prompts',
        'analysis-progress',
        'completion'
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
            brandInfo,
            setBrandInfo,
            aiProviders,
            setAIProviders,
            discoveryPrompts,
            setDiscoveryPrompts,
            nextStep,
            prevStep
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
