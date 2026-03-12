'use client';

import { KeywordsTable } from '@/components/keywords/keywords-table';

export default function KeywordsPage() {
    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="font-serif text-3xl font-light text-mentha-forest dark:text-mentha-beige">
                    Keywords
                </h1>
                <p className="font-sans text-sm text-mentha-forest/60 dark:text-mentha-beige/60 mt-1">
                    Manage search queries to track your brand&apos;s AI visibility
                </p>
            </div>

            <KeywordsTable />
        </div>
    );
}
