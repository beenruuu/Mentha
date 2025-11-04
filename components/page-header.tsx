'use client'

import { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { UserAvatarMenu } from '@/components/user-avatar-menu'
import { useTranslations } from '@/lib/i18n'

interface PageHeaderProps {
  icon: ReactNode
  title: string
  showSearch?: boolean
}

export function PageHeader({ icon, title, showSearch = true }: PageHeaderProps) {
  const { t } = useTranslations()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white dark:bg-black">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex items-center gap-2">
        {icon}
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
      </div>
      {showSearch && (
        <>
          <div className="flex-1 max-w-md hidden sm:block mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input 
                placeholder={t.searchPlaceholder} 
                className="pl-10 pr-20 bg-white dark:bg-[#0A0A0A] border-gray-200 dark:border-[#2A2A30]" 
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A30] rounded">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A30] rounded">Y</kbd>
              </div>
            </div>
          </div>
        </>
      )}
      <div className="flex-1" />
      <UserAvatarMenu />
    </header>
  )
}

