import { Skeleton } from "@/components/ui/skeleton"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"

export function NotificationsPageSkeleton() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
                {/* Header Skeleton */}
                <header className="flex items-center justify-between px-6 py-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-6 w-36" />
                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-9 w-32" />
                </header>

                <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl border-t border-l border-gray-200 dark:border-[#2A2A30] overflow-hidden flex shadow-2xl relative z-10">
                    <div className="flex w-full h-full">
                        {/* Left Column: Notification List Skeleton */}
                        <div className="w-full md:w-[400px] border-r border-gray-100 dark:border-[#1A1A20] overflow-y-auto bg-gray-50/30 dark:bg-[#0C0C0E]">
                            <div className="p-4 space-y-6">
                                {/* Today Section */}
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-12 ml-2 mb-2" />
                                    <div className="space-y-1">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="w-full p-3 rounded-lg flex gap-3">
                                                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <Skeleton className="h-4 w-32" />
                                                        <Skeleton className="h-3 w-14" />
                                                    </div>
                                                    <Skeleton className="h-3 w-full" />
                                                    <Skeleton className="h-3 w-2/3 mt-1" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Yesterday Section */}
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-20 ml-2 mb-2" />
                                    <div className="space-y-1">
                                        {[1, 2].map((i) => (
                                            <div key={i} className="w-full p-3 rounded-lg flex gap-3">
                                                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <Skeleton className="h-4 w-40" />
                                                        <Skeleton className="h-3 w-14" />
                                                    </div>
                                                    <Skeleton className="h-3 w-full" />
                                                    <Skeleton className="h-3 w-1/2 mt-1" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Earlier Section */}
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-16 ml-2 mb-2" />
                                    <div className="space-y-1">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="w-full p-3 rounded-lg flex gap-3">
                                                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <Skeleton className="h-4 w-36" />
                                                        <Skeleton className="h-3 w-14" />
                                                    </div>
                                                    <Skeleton className="h-3 w-full" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Detail View Skeleton */}
                        <div className="flex-1 overflow-y-auto bg-white dark:bg-black hidden md:block">
                            <div className="p-8 max-w-2xl mx-auto">
                                <div className="flex items-center gap-4 mb-6">
                                    <Skeleton className="w-12 h-12 rounded-full" />
                                    <div>
                                        <Skeleton className="h-6 w-48 mb-2" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />

                                    <div className="mt-8 flex gap-3">
                                        <Skeleton className="h-10 w-28" />
                                        <Skeleton className="h-10 w-24" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
