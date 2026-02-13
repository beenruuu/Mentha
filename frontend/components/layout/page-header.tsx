'use client'

import { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { UserAvatarMenu } from '@/components/layout/user-avatar-menu'
import { useTranslations } from '@/lib/i18n'

interface PageHeaderProps {
  icon: ReactNode
  title: string
  showSearch?: boolean
  actions?: ReactNode
}

export function PageHeader({ icon, title, showSearch = true, actions }: PageHeaderProps) {
  const { t } = useTranslations()

  return (
    <header className="relative flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-gradient-to-r from-white to-gray-50/50 dark:from-black dark:to-black backdrop-blur-sm border-gray-200 dark:border-[#2A2A30]">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.02] to-transparent dark:from-emerald-500/[0.03] pointer-events-none" />

      <div className="relative flex items-center gap-2 z-10 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 bg-gray-300 dark:bg-gray-700" />

        {/* Title Section */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm">
            <div className="text-white [&>svg]:w-4 [&>svg]:h-4">
              {icon}
            </div>
          </div>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {title}
          </h1>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="flex-1 max-w-md hidden md:block mx-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder={t.searchPlaceholder}
                className="pl-10 pr-20 h-9 bg-white/80 dark:bg-[#0A0A0A]/80 border-gray-200 dark:border-[#2A2A30] shadow-sm hover:bg-white dark:hover:bg-[#0A0A0A] transition-colors focus:ring-2 focus:ring-emerald-500/20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-[#2A2A30] rounded shadow-sm">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-[#2A2A30] rounded shadow-sm">K</kbd>
              </div>
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Optional Actions */}
        {actions && (
          <>
            <div className="flex items-center gap-2">
              {actions}
            </div>
            <Separator orientation="vertical" className="mx-2 h-4 bg-gray-300 dark:bg-gray-700" />
          </>
        )}

        {/* User Avatar */}
        <UserAvatarMenu />
      </div>
    </header>
  )
}

