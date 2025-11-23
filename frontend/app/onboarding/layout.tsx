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
            <div className="min-h-screen bg-white dark:bg-black flex flex-col">
                <main className="flex-1 flex flex-col">
                    {children}
                </main>
            </div>
        </OnboardingProvider>
    )
}
