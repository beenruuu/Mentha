import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"

export function BrandPageSkeleton() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
                {/* Header Skeleton */}
                <header className="flex items-center justify-between px-6 py-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <div>
                            <Skeleton className="h-5 w-40 mb-1" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    </div>
                    <Skeleton className="h-9 w-32" />
                </header>

                <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl border-t border-l border-gray-200 dark:border-[#2A2A30] overflow-y-auto p-6 md:p-8 shadow-2xl relative z-10">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Quick Stats Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 rounded-xl border border-border/40 bg-card/50">
                                    <div className="flex justify-between items-start mb-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-4 rounded-full" />
                                    </div>
                                    <Skeleton className="h-8 w-16 mb-2" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Content Skeleton */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Actionable Insights Skeleton */}
                                <Card className="border-border/40 shadow-sm bg-card/50">
                                    <CardHeader>
                                        <div className="flex justify-between">
                                            <Skeleton className="h-6 w-48" />
                                            <Skeleton className="h-8 w-24" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="p-4 rounded-xl border border-border/40">
                                                <div className="flex gap-4">
                                                    <Skeleton className="w-2 h-2 rounded-full mt-2" />
                                                    <div className="space-y-2 flex-1">
                                                        <Skeleton className="h-4 w-3/4" />
                                                        <Skeleton className="h-3 w-full" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                {/* Top Keywords Skeleton */}
                                <Card className="border-border/40 shadow-sm bg-card/50">
                                    <CardHeader>
                                        <div className="flex justify-between">
                                            <Skeleton className="h-6 w-48" />
                                            <Skeleton className="h-8 w-20" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="flex justify-between p-3">
                                                <Skeleton className="h-4 w-32" />
                                                <div className="flex gap-4">
                                                    <Skeleton className="h-4 w-16" />
                                                    <Skeleton className="h-5 w-12 rounded-full" />
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar Skeleton */}
                            <div className="space-y-8">
                                {/* Competitors Skeleton */}
                                <Card className="border-border/40 shadow-sm bg-card/50">
                                    <CardHeader>
                                        <div className="flex justify-between">
                                            <Skeleton className="h-5 w-32" />
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <Skeleton className="w-8 h-8 rounded-lg" />
                                                    <Skeleton className="h-4 w-24" />
                                                </div>
                                                <Skeleton className="h-3 w-8" />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                {/* Technical Health Skeleton */}
                                <Card className="border-border/40 shadow-sm bg-card/50">
                                    <CardHeader>
                                        <Skeleton className="h-5 w-40" />
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="space-y-2">
                                                <div className="flex justify-between">
                                                    <Skeleton className="h-3 w-24" />
                                                    <Skeleton className="h-3 w-16" />
                                                </div>
                                                <Skeleton className="h-1.5 w-full rounded-full" />
                                            </div>
                                        ))}
                                        <div className="grid grid-cols-2 gap-2">
                                            {[1, 2, 3, 4].map((i) => (
                                                <Skeleton key={i} className="h-4 w-full" />
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
