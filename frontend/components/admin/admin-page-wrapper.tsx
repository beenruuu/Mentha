'use client'

import { Menu, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'

interface AdminPageWrapperProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export function AdminPageWrapper({ title, subtitle, children, actions }: AdminPageWrapperProps) {
  const { setOpenMobile } = useSidebar()

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setOpenMobile(true)}
            className="md:hidden p-2 mr-2 rounded-lg hover:bg-secondary"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{title}</h1>
          {subtitle && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{subtitle}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {actions}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl overflow-hidden flex flex-col shadow-2xl relative z-10">
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {children}
        </div>
      </main>
    </>
  )
}
