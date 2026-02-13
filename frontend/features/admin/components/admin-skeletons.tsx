'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton for a single stat card
 */
export function StatCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Stats grid skeleton
 */
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Chart card skeleton
 */
export function ChartSkeleton({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        {title ? (
          <>
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-4 w-56" />
          </>
        ) : (
          <>
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-4 w-56" />
          </>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-end gap-2 px-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton 
              key={i} 
              className="flex-1 rounded-t-md"
              style={{ height: `${Math.random() * 60 + 20}%` }} 
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Table skeleton
 */
export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 flex gap-4 border-b border-gray-200 dark:border-gray-800">
            {[...Array(cols)].map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
          {/* Rows */}
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="px-4 py-4 flex gap-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
              {[...Array(cols)].map((_, j) => (
                <Skeleton key={j} className="h-6 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * User row skeleton
 */
export function UserRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 animate-pulse">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  )
}

/**
 * List skeleton for geographic/industry data
 */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-24 rounded-full" />
                <Skeleton className="h-4 w-10" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Full page loading skeleton for admin dashboard
 */
export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8 p-6 md:p-8 animate-pulse">
      <StatsGridSkeleton count={4} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ListSkeleton />
        <ListSkeleton />
        <ListSkeleton />
      </div>
    </div>
  )
}

/**
 * Full page loading skeleton for users
 */
export function AdminUsersSkeleton() {
  return (
    <div className="space-y-4 p-6 md:p-8 animate-pulse">
      {/* Filter bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1 max-w-xs" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
      
      {/* Table */}
      <TableSkeleton rows={10} cols={8} />
    </div>
  )
}
