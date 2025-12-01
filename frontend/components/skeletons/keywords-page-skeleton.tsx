import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { PageHeader } from "@/components/layout/page-header"
import { TrendingUp } from "lucide-react"

export function KeywordsPageSkeleton() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <PageHeader 
                    icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
                    title="Keywords"
                />

                <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 bg-[#f5f5f5] dark:bg-[#0A0A0A]">
                    {/* Stats Cards Skeleton */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i} className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
                                <CardHeader className="pb-2">
                                    <Skeleton className="h-4 w-32 mb-2" />
                                    <Skeleton className="h-8 w-16" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-3 w-20" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Keywords Table Skeleton */}
                    <Card className="w-full bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <Skeleton className="h-6 w-44 mb-2" />
                                    <Skeleton className="h-4 w-64" />
                                </div>
                                <Skeleton className="h-10 w-32" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Search Bar Skeleton */}
                            <div className="flex items-center gap-2 mb-4">
                                <Skeleton className="h-10 flex-1" />
                            </div>

                            {/* Table Skeleton */}
                            <div className="overflow-x-auto">
                                <div className="inline-block min-w-full align-middle">
                                    {/* Table Header */}
                                    <div className="flex gap-4 p-3 border-b border-gray-200 dark:border-[#2A2A30]">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-12" />
                                    </div>
                                    
                                    {/* Table Rows */}
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                        <div key={i} className="flex gap-4 p-4 border-b border-gray-100 dark:border-[#1A1A20]">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-4 w-16" />
                                            <Skeleton className="h-4 w-16" />
                                            <Skeleton className="h-4 w-12" />
                                            <Skeleton className="h-6 w-10 rounded-full" />
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-4 w-4" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
