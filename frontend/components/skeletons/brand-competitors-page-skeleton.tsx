import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"

export function BrandCompetitorsPageSkeleton() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
                {/* Header Skeleton */}
                <header className="flex items-center justify-between px-6 py-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <div>
                            <Skeleton className="h-5 w-40 mb-1" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    </div>
                    <Skeleton className="h-10 w-36" />
                </header>

                <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl border-t border-l border-gray-200 dark:border-[#2A2A30] overflow-y-auto p-6 md:p-8 shadow-2xl relative z-10">
                    <div className="max-w-6xl mx-auto space-y-8">
                        {/* Stats Cards Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="border-gray-200 dark:border-[#27272a]">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Skeleton className="h-4 w-24 mb-2" />
                                                <Skeleton className="h-8 w-16" />
                                            </div>
                                            <Skeleton className="h-10 w-10 rounded-lg" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Competitors Table Skeleton */}
                        <Card className="border-gray-200 dark:border-[#27272a]">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Skeleton className="h-6 w-40 mb-2" />
                                        <Skeleton className="h-4 w-64" />
                                    </div>
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Search Bar */}
                                <Skeleton className="h-10 w-full mb-6" />
                                
                                {/* Table Header */}
                                <div className="flex gap-4 p-3 border-b border-gray-200 dark:border-[#2A2A30]">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                
                                {/* Table Rows */}
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex gap-4 p-4 border-b border-gray-100 dark:border-[#1A1A20] items-center">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="w-8 h-8 rounded-lg" />
                                            <Skeleton className="h-4 w-28" />
                                        </div>
                                        <Skeleton className="h-4 w-36" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-3 w-12" />
                                            <Skeleton className="h-1.5 w-20 rounded-full" />
                                        </div>
                                        <Skeleton className="h-4 w-8" />
                                        <Skeleton className="h-8 w-8 rounded-md" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Insights Section Skeleton */}
                        <Card className="border-gray-200 dark:border-[#27272a]">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-5 w-5 rounded" />
                                    <Skeleton className="h-5 w-40" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 dark:border-[#27272a]">
                                        <Skeleton className="w-2 h-2 rounded-full mt-2" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-full" />
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
