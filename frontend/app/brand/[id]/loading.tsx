import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex h-screen bg-[#FAFAFA] dark:bg-[#09090b]">
      {/* Sidebar skeleton */}
      <div className="hidden md:flex w-64 flex-col border-r border-border/40 bg-background p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-24 rounded" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        
        {/* Content area */}
        <div className="flex-1 bg-white dark:bg-black rounded-tl-3xl p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          
          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-xl space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
          
          {/* Main content area */}
          <div className="border rounded-xl p-4 space-y-4">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
