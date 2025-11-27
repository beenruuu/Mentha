'use client'

import React from 'react'
import { useTranslations } from '@/lib/i18n'

export default function TermsPage() {
  const { t } = useTranslations()
  
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">{t.termsAndConditions}</h1>
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-sm text-muted-foreground mb-6">{t.termsLastUpdated} {new Date().toLocaleDateString()}</p>
        
        <h2>{t.termsSection1Title}</h2>
        <p>{t.termsSection1Text}</p>

        <h2>{t.termsSection2Title}</h2>
        <p>{t.termsSection2Text}</p>

        <h2>{t.termsSection3Title}</h2>
        <p>{t.termsSection3Text}</p>

        <h2>{t.termsSection4Title}</h2>
        <p>{t.termsSection4Text}</p>

        <h2>{t.termsSection5Title}</h2>
        <p>{t.termsSection5Text}</p>

        <h2>{t.termsSection6Title}</h2>
        <p>{t.termsSection6Text}</p>

        <h2>{t.termsSection7Title}</h2>
        <p>{t.termsSection7Text}</p>

        <h2>{t.termsSection8Title}</h2>
        <p>{t.termsSection8Text}</p>
      </div>
    </div>
  )
}
