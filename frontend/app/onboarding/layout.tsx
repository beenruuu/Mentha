import { Metadata } from "next"
import { OnboardingProvider } from "@/lib/context/onboarding-context"

export const metadata: Metadata = {
    title: "Onboarding - Mentha",
    description: "Get started with Mentha",
}

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <OnboardingProvider>
            {children}
        </OnboardingProvider>
    )
}
