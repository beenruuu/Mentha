import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { PageHeader } from "@/components/layout/page-header"
import { Users } from "lucide-react"

export function CompetitorsPageSkeleton() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <PageHeader 
                    icon={<Users className="h-5 w-5 text-emerald-600" />}
                    title="Competitors"
                />

                <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 bg-[#f5f5f5] dark:bg-[#0A0A0A]">
                    {/* Stats Skeleton */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i} className="bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
                                <CardHeader className="pb-2">
                                    <Skeleton className="h-4 w-32 mb-2" />
                                    <Skeleton className="h-8 w-16" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-3 w-24" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Competitor Comparison Table Skeleton */}
                    <Card className="w-full bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Skeleton className="h-6 w-48 mb-2" />
                                    <Skeleton className="h-4 w-72" />
                                </div>
                                <Skeleton className="h-10 w-36" />
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
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                    
                                    {/* Table Rows */}
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="flex gap-4 p-4 border-b border-gray-100 dark:border-[#1A1A20]">
                                            <Skeleton className="h-4 w-28" />
                                            <Skeleton className="h-4 w-32" />
                                            <div className="space-y-1 w-20">
                                                <Skeleton className="h-4 w-16" />
                                                <Skeleton className="h-1 w-full" />
                                            </div>
                                            <Skeleton className="h-4 w-12" />
                                            <Skeleton className="h-6 w-12 rounded-full" />
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="h-4 w-4" />
                                                <Skeleton className="h-4 w-10" />
                                            </div>
                                            <div className="flex gap-1">
                                                <Skeleton className="h-5 w-16 rounded-full" />
                                                <Skeleton className="h-5 w-16 rounded-full" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gap Analysis Skeleton */}
                    <Card className="w-full bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
                        <CardHeader>
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-80" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i}>
                                        <div className="flex items-center justify-between mb-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                        <Skeleton className="h-2 w-full rounded-full" />
                                    </div>
                                ))}
                                <Skeleton className="h-3 w-40 mx-auto mt-4" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
