import React from "react"
import { Info, ArrowUp } from "lucide-react"

const data = [
  { name: "Vercel", icon: "▲", iconBg: "bg-black", score: 75, change: 3 },
  { name: "Strava", icon: "S", iconBg: "bg-[#FC4C02]", score: 72, change: 0.4 },
  { name: "Airbnb", icon: "A", iconBg: "bg-[#FF5A5F]", score: 71, change: 6.6 },
  { name: "Revolut", icon: "R", iconBg: "bg-white border border-gray-300", score: 69, change: 4.6 },
]

export function BrandOverviewCard() {
  return (
    <div data-slot="card" className="text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm p-6 bg-white dark:bg-black">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Resumen de Marca</h2>
        <Info className="w-4 h-4 text-gray-400 dark:text-gray-500" />
      </div>

      <div className="space-y-4">
        {data.map((b) => (
          <div key={b.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 shrink-0 ${b.iconBg} rounded-full flex items-center justify-center`}>
                <span className={`${b.iconBg.includes("white") ? "text-black" : "text-white"} text-xs font-bold`}>{b.icon}</span>
              </div>
              <span className="text-sm font-medium text-[#0A0A0A] dark:text-white">{b.name}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full relative shrink-0">
                <svg viewBox="0 0 40 40" className="block w-10 h-10 -rotate-90" style={{ transformOrigin: "center" }} role="img" aria-hidden="true">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#e5e7eb" strokeWidth="3" className="dark:stroke-[#0A0A0F]" />
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${(b.score / 100) * 100.53} 100.53`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xs font-semibold text-[#0A0A0A] dark:text-white" style={{ lineHeight: "1", transform: "translateY(0.5px)" }}>{b.score}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-green-600 shrink-0">
                <ArrowUp className="w-3 h-3 shrink-0" />
                <span className="text-sm font-semibold">{b.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
