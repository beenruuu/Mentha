'use client'

import Link from 'next/link'
import { CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { UserAvatarMenu } from '@/components/layout/user-avatar-menu'
import { useTranslations } from '@/lib/i18n'

export default function UpgradePage() {
  const { t } = useTranslations()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-600" />
            <h1 className="text-xl font-semibold">{t.upgradePlan}</h1>
          </div>
          <div className="flex-1" />
          <UserAvatarMenu />
        </header>

        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
          {/* Hero */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-center mb-8">
            <div className="lg:col-span-2">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">{t.upgradeToProUnlock}</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{t.upgradeDescription}</p>

              <div className="flex items-center gap-3">
                <a href="#start-upgrade" className="inline-block bg-black dark:bg-white text-white dark:text-black px-5 py-3 rounded-md text-sm hover:bg-gray-800 dark:hover:bg-gray-200">{t.startUpgrade}</a>
                <Link href="/dashboard" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">{t.backToPanel}</Link>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 bg-white dark:bg-black">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.yourPlan}</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white">{t.freePlan}</div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t.freeBasicTrial}</p>
                <div className="mt-4">
                  <a href="#start-upgrade" className="block w-full text-center bg-black dark:bg-black text-white dark:text-white px-3 py-2 rounded-md hover:bg-[#1E1E24]">{t.upgrade}</a>
                </div>
              </Card>
            </div>
          </div>

          {/* Features + Pricing */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 bg-white dark:bg-black">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide mb-2">{t.whyPro}</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">{t.whyProDescription}</p>
            </Card>

            <Card className="p-6 bg-white dark:bg-black">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide mb-2">{t.support}</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">{t.supportDescription}</p>
            </Card>

            <Card className="p-6 bg-white dark:bg-black">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide mb-2">{t.exports}</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">{t.exportsDescription}</p>
            </Card>
          </div>

          {/* Pricing Tiers */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-white dark:bg-black">
              <h5 className="text-lg font-semibold text-gray-900 dark:text-white">{t.proBasic}</h5>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">$29<span className="text-sm font-medium">{t.perMonth}</span></div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>{t.proBasicFeature1}</li>
                <li>{t.proBasicFeature2}</li>
                <li>{t.proBasicFeature3}</li>
              </ul>
              <div className="mt-6">
                <a className="inline-block w-full text-center bg-black dark:bg-black text-white dark:text-white px-4 py-2 rounded-md hover:bg-[#1E1E24]">{t.select}</a>
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-black border-2 border-black dark:border-[#2A2A30]">
              <h5 className="text-lg font-semibold text-gray-900 dark:text-white">{t.proPlus}</h5>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">$79<span className="text-sm font-medium">{t.perMonth}</span></div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>{t.proPlusFeature1}</li>
                <li>{t.proPlusFeature2}</li>
                <li>{t.proPlusFeature3}</li>
              </ul>
              <div className="mt-6">
                <a className="inline-block w-full text-center bg-black dark:bg-black text-white dark:text-white px-4 py-2 rounded-md hover:bg-[#1E1E24]">{t.select}</a>
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-black">
              <h5 className="text-lg font-semibold text-gray-900 dark:text-white">{t.enterprise}</h5>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{t.contact}<span className="text-sm font-medium">{t.perMonth}</span></div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>{t.enterpriseFeature1}</li>
                <li>{t.enterpriseFeature2}</li>
                <li>{t.enterpriseFeature3}</li>
              </ul>
              <div className="mt-6">
                <a className="inline-block w-full text-center bg-black dark:bg-black text-white dark:text-white px-4 py-2 rounded-md hover:bg-[#1E1E24]">{t.contactUs}</a>
              </div>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}




