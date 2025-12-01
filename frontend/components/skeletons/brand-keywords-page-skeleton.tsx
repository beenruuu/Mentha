import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"

export function BrandKeywordsPageSkeleton() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
                <div className="bg-[#FAFAFA] dark:bg-[#09090b] h-full flex flex-col h-screen overflow-hidden">
                    {/* Header Skeleton */}
                    <header className="flex items-center justify-between px-6 py-4 shrink-0">
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-8 h-8 rounded-lg" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                        <Skeleton className="h-10 w-36" />
                    </header>

                    <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl border-t border-l border-gray-200 dark:border-[#2A2A30] overflow-y-auto p-6 md:p-8 shadow-2xl relative z-10">
                        <div className="max-w-6xl mx-auto space-y-8">
                            {/* Stats Cards Skeleton */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <Card key={i} className="border-gray-200 dark:border-[#27272a]">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Skeleton className="h-3 w-20 mb-2" />
                                                    <Skeleton className="h-7 w-14" />
                                                </div>
                                                <Skeleton className="h-8 w-8 rounded-lg" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Keywords Table Skeleton */}
                            <Card className="border-gray-200 dark:border-[#27272a]">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Skeleton className="h-6 w-36 mb-2" />
                                            <Skeleton className="h-4 w-56" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-10 w-10 rounded-lg" />
                                            <Skeleton className="h-10 w-10 rounded-lg" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Search Bar */}
                                    <Skeleton className="h-10 w-full mb-6" />
                                    
                                    {/* Table Header */}
                                    <div className="flex gap-4 p-3 border-b border-gray-200 dark:border-[#2A2A30]">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-8" />
                                    </div>
                                    
                                    {/* Table Rows */}
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                        <div key={i} className="flex gap-4 p-4 border-b border-gray-100 dark:border-[#1A1A20] items-center">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-4 w-16" />
                                            <div className="space-y-1">
                                                <Skeleton className="h-3 w-12" />
                                                <Skeleton className="h-1.5 w-16 rounded-full" />
                                            </div>
                                            <Skeleton className="h-6 w-10 rounded-full" />
                                            <div className="flex gap-1">
                                                <Skeleton className="h-5 w-5 rounded" />
                                                <Skeleton className="h-5 w-5 rounded" />
                                                <Skeleton className="h-5 w-5 rounded" />
                                            </div>
                                            <Skeleton className="h-8 w-24 rounded" />
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
