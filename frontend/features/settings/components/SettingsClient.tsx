'use client'

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { UserAvatarMenu } from "@/components/layout/user-avatar-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Local Imports
import { ProfileTab } from "./ProfileTab"
import { SecurityTab } from "./SecurityTab"
import { NotificationsTab } from "./NotificationsTab"
import { BillingTab } from "./BillingTab"
import { AppearanceTab } from "./AppearanceTab"
import { FeaturesTab } from "./FeaturesTab"
import { useSettingsData, type UserData } from "../hooks/useSettingsData"
import type { Language } from "@/lib/i18n"

interface SettingsClientProps {
    initialUser: UserData
}

export function SettingsClient({ initialUser }: SettingsClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const defaultTab = searchParams.get('tab') || 'profile'

    // Use Custom Hook
    const {
        user,
        firstName,
        setFirstName,
        lastName,
        setLastName,
        notifications,
        handleNotificationToggle,
        loadUser,
        lang,
        setLangState,
        t
    } = useSettingsData(initialUser)

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
                <header className="flex items-center justify-between px-6 py-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="-ml-1" />
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{t.configuration}</h1>
                    </div>
                    <UserAvatarMenu />
                </header>

                <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl overflow-hidden flex flex-col shadow-2xl relative z-10">
                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        <div className="mx-auto w-full">
                            <Tabs
                                value={defaultTab}
                                onValueChange={(value) => {
                                    router.push(`/settings?tab=${value}`)
                                }}
                                className="space-y-8"
                            >
                                <TabsContent value="profile">
                                    <ProfileTab
                                        t={t}
                                        user={user}
                                        firstName={firstName}
                                        setFirstName={setFirstName}
                                        lastName={lastName}
                                        setLastName={setLastName}
                                        onUserUpdated={loadUser}
                                    />
                                </TabsContent>

                                <TabsContent value="security">
                                    <SecurityTab t={t} />
                                </TabsContent>

                                <TabsContent value="notifications">
                                    <NotificationsTab
                                        t={t}
                                        notifications={notifications}
                                        onToggle={handleNotificationToggle}
                                    />
                                </TabsContent>

                                <TabsContent value="billing">
                                    <BillingTab t={t} />
                                </TabsContent>

                                <TabsContent value="appearance">
                                    <AppearanceTab
                                        t={t}
                                        lang={lang}
                                        onLanguageChange={setLangState}
                                    />
                                </TabsContent>

                                <TabsContent value="features">
                                    <FeaturesTab t={t} />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
