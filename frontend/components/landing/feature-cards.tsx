"use client"

import { useTranslations } from "@/lib/i18n"

export function FeatureCards() {
  const { t } = useTranslations()

  const features = [
    {
      title: t.featureAEOTitle,
      description: t.featureAEODescription,
      highlighted: true,
    },
    {
      title: t.featureCompetitorTitle,
      description: t.featureCompetitorDescription,
      highlighted: false,
    },
    {
      title: t.featureBrandTitle,
      description: t.featureBrandDescription,
      highlighted: false,
    },
  ]

  return (
    <section className="border-t border-black/10 dark:border-white/10 border-b border-black/10 dark:border-white/10">
      <div className="max-w-[1060px] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`p-6 flex flex-col gap-2 ${feature.highlighted
                  ? "bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 shadow-sm"
                  : "border border-black/5 dark:border-white/5"
                }`}
            >
              {feature.highlighted && (
                <div className="space-y-1 mb-2">
                  <div className="w-full h-0.5 bg-black/5 dark:bg-white/5"></div>
                  <div className="w-32 h-0.5 bg-emerald-500 dark:bg-emerald-400"></div>
                </div>
              )}
              <h3 className="text-black dark:text-white text-sm font-semibold leading-6">{feature.title}</h3>
              <p className="text-black/70 dark:text-white/60 text-sm leading-[22px] whitespace-pre-line">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
