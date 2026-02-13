"use client"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/lib/i18n"

export function DashboardPreview() {
  const { t } = useTranslations()

  return (
    <section className="relative pb-16">
      <div className="max-w-[1060px] mx-auto px-4">
        {/* Dashboard Interface Mockup */}
        <div className="relative bg-white dark:bg-[#0a0a0a] rounded-lg shadow-lg border border-black/10 dark:border-white/10 overflow-hidden">
          {/* Dashboard Header */}
          <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="text-black dark:text-white font-semibold">Mentha</div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-sm text-black/60 dark:text-white/60">{t.dashAccount || "Account"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-full"></div>
            </div>
          </div>

          {/* Sidebar and Main Content */}
          <div className="flex">
            {/* Sidebar */}
            <div className="w-48 bg-black/5 dark:bg-black/20 border-r border-black/10 dark:border-white/10 p-4 hidden md:block">
              <nav className="space-y-2">
                <div className="text-xs font-medium text-black/40 dark:text-white/40 uppercase tracking-wide mb-3">
                  {t.dashNavigation || "Navigation"}
                </div>
                {[
                  { name: t.dashNavHome || "Home", active: true },
                  { name: t.dashNavCustomers || "Customers" },
                  { name: t.dashNavBilling || "Billing" },
                  { name: t.dashNavSchedules || "Schedules" },
                  { name: t.dashNavInvoices || "Invoices" },
                  { name: t.dashNavProducts || "Products" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className={`text-sm py-1 cursor-pointer transition-colors ${
                      item.active
                        ? "text-emerald-600 dark:text-emerald-400 font-medium"
                        : "text-black dark:text-white/70 hover:text-emerald-500 dark:hover:text-emerald-400"
                    }`}
                  >
                    {item.name}
                  </div>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-black dark:text-white">{t.dashSchedules || "Schedules"}</h2>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm border-none">
                  {t.dashCreateSchedule || "Create schedule"}
                </Button>
              </div>

              {/* Table Mockup */}
              <div className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg overflow-hidden">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 p-4 bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 text-sm font-medium text-black/60 dark:text-white/60">
                  <div>{t.dashCustomer || "Customer"}</div>
                  <div className="hidden md:block">{t.dashStatus || "Status"}</div>
                  <div className="hidden md:block">{t.dashProducts || "Products"}</div>
                  <div>{t.dashTotal || "Total"}</div>
                  <div className="hidden md:block">{t.dashStartDate || "Start date"}</div>
                  <div className="hidden md:block">{t.dashEndDate || "End date"}</div>
                </div>

                {/* Table Rows */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-3 md:grid-cols-6 gap-4 p-4 border-b border-black/5 dark:border-white/5 text-sm text-black dark:text-white/80"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        H
                      </div>
                      <span className="truncate">Hypernise</span>
                    </div>
                    <div className="hidden md:block">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          i % 3 === 0
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                            : i % 3 === 1
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                              : "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/60"
                        }`}
                      >
                        {i % 3 === 0 ? t.dashComplete || "Complete" : i % 3 === 1 ? t.dashActive || "Active" : t.dashDraft || "Draft"}
                      </span>
                    </div>
                    <div className="text-black/40 dark:text-white/40 hidden md:block truncate">Platform access fee</div>
                    <div className="font-medium">$3,862.32</div>
                    <div className="text-black/40 dark:text-white/40 hidden md:block">1 Aug 2024</div>
                    <div className="text-black/40 dark:text-white/40 hidden md:block">10 Jun 2024</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

