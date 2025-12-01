import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"

export function SettingsPageSkeleton() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-[#fdfdfc] dark:bg-[#050505] h-screen overflow-hidden flex flex-col">
                {/* Header Skeleton */}
                <header className="flex items-center justify-between px-8 py-6 bg-[#fdfdfc] dark:bg-[#050505] border-b border-border/40">
                    <div>
                        <Skeleton className="h-7 w-36 mb-2" />
                        <Skeleton className="h-4 w-56" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-full" />
                </header>

                <main className="flex-1 overflow-y-auto p-8 bg-[#fdfdfc] dark:bg-[#050505]">
                    <div className="max-w-4xl mx-auto">
                        {/* Tabs Skeleton */}
                        <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl border border-border/40 mb-8 w-fit">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-9 w-28 rounded-lg" />
                            ))}
                        </div>

                        {/* Profile Card Skeleton */}
                        <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <Skeleton className="h-6 w-48 mb-2" />
                                <Skeleton className="h-4 w-72" />
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Avatar Section */}
                                <div className="flex items-center gap-6">
                                    <Skeleton className="w-24 h-24 rounded-full" />
                                    <Skeleton className="h-10 w-32" />
                                </div>

                                {/* Form Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-10 w-full" />
                                </div>

                                <div className="flex justify-end">
                                    <Skeleton className="h-10 w-32" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
