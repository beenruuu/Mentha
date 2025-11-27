'use client'

import React from 'react'
import { useTranslations } from '@/lib/i18n'

export default function PrivacyPage() {
  const { t } = useTranslations()
  
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">{t.privacyPolicy}</h1>
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-sm text-muted-foreground mb-6">{t.privacyLastUpdated} {new Date().toLocaleDateString()}</p>
        
        <h2>{t.privacySection1Title}</h2>
        <p>{t.privacySection1Text}</p>

        <h2>{t.privacySection2Title}</h2>
        <p>{t.privacySection2Text}</p>
        <ul>
          <li>{t.privacySection2Item1}</li>
          <li>{t.privacySection2Item2}</li>
          <li>{t.privacySection2Item3}</li>
          <li>{t.privacySection2Item4}</li>
        </ul>

        <h2>{t.privacySection3Title}</h2>
        <p>{t.privacySection3Text}</p>

        <h2>{t.privacySection4Title}</h2>
        <p>{t.privacySection4Text}</p>

        <h2>{t.privacySection5Title}</h2>
        <p>{t.privacySection5Text}</p>

        <h2>{t.privacySection6Title}</h2>
        <p>{t.privacySection6Text}</p>

        <h2>{t.privacySection7Title}</h2>
        <p>{t.privacySection7Text}</p>
      </div>
    </div>
  )
}
