import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"

export function DashboardPageSkeleton() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
                {/* Header Skeleton */}
                <header className="flex items-center justify-between px-6 py-4 shrink-0">
                    <div>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-9 w-9 rounded-md" />
                </header>

                <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl border-t border-l border-gray-200 dark:border-[#2A2A30] overflow-y-auto p-6 shadow-2xl relative z-10">
                    <div className="max-w-8xl mx-auto space-y-6">
                        
                        {/* Top Row: AI Providers Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Card key={i} className="border-gray-200 dark:border-[#27272a] shadow-sm">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div>
                                                <Skeleton className="h-4 w-20 mb-1" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-7 w-12" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Middle Row: Chart & Recommendations Skeleton */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Chart Skeleton - Takes 2 cols */}
                            <Card className="lg:col-span-2 border-gray-200 dark:border-[#27272a] shadow-sm">
                                <CardHeader>
                                    <Skeleton className="h-5 w-40 mb-2" />
                                    <Skeleton className="h-4 w-64" />
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] w-full flex items-end justify-between gap-2 px-4">
                                        {[65, 45, 80, 55, 70, 40, 85, 60].map((height, i) => (
                                            <Skeleton 
                                                key={i} 
                                                className="flex-1" 
                                                style={{ height: `${height}%` }} 
                                            />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recommendations Skeleton - Takes 1 col */}
                            <Card className="border-gray-200 dark:border-[#27272a] shadow-sm flex flex-col h-full">
                                <CardHeader>
                                    <Skeleton className="h-5 w-44 mb-2" />
                                    <Skeleton className="h-4 w-36" />
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#27272a]/50">
                                            <Skeleton className="w-4 h-4 rounded-full mt-0.5" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-3 w-full" />
                                                <Skeleton className="h-3 w-3/4" />
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Bottom Row: Details Grid Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Competitors Skeleton */}
                            <Card className="border-gray-200 dark:border-[#27272a] shadow-sm">
                                <CardHeader>
                                    <Skeleton className="h-5 w-28 mb-2" />
                                    <Skeleton className="h-4 w-48" />
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div>
                                                <Skeleton className="h-4 w-28 mb-1" />
                                                <Skeleton className="h-3 w-36" />
                                            </div>
                                            <Skeleton className="h-4 w-10" />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Keywords Skeleton */}
                            <Card className="border-gray-200 dark:border-[#27272a] shadow-sm">
                                <CardHeader>
                                    <Skeleton className="h-5 w-32 mb-2" />
                                    <Skeleton className="h-4 w-40" />
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div>
                                                <Skeleton className="h-4 w-24 mb-1" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                            <Skeleton className="h-4 w-10" />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Recent Activity Skeleton */}
                            <Card className="border-gray-200 dark:border-[#27272a] shadow-sm">
                                <CardHeader>
                                    <Skeleton className="h-5 w-32 mb-2" />
                                    <Skeleton className="h-4 w-28" />
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                            <Skeleton className="w-2 h-2 rounded-full mt-2" />
                                            <div className="flex-1">
                                                <Skeleton className="h-4 w-3/4 mb-1" />
                                                <Skeleton className="h-3 w-full" />
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
