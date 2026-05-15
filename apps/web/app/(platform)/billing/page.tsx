'use client';

import { CreditCard } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BillingPage() {
    return (
        <div className="space-y-6 max-w-4xl">
            <div className="mb-8">
                <h1 className="font-serif text-3xl font-light text-mentha-forest dark:text-mentha-beige">
                    Billing & Subscription
                </h1>
                <p className="font-sans text-sm text-mentha-forest/60 dark:text-mentha-beige/60 mt-1">
                    Manage your credits and plan
                </p>
            </div>

            <Card className="border-mentha-mint/20 bg-mentha-mint/5">
                <CardHeader className="text-center py-12">
                    <div className="mx-auto size-16 rounded-full bg-mentha-mint/10 flex items-center justify-center mb-4">
                        <CreditCard className="size-8 text-mentha-mint" />
                    </div>
                    <CardTitle className="font-serif text-3xl mb-2">Coming Soon</CardTitle>
                    <p className="text-mentha-forest/60 dark:text-mentha-beige/60 max-w-sm mx-auto">
                        Stripe integration is currently being finalized. All early adopters have
                        unlimited access during the v1.0 launch phase.
                    </p>
                </CardHeader>
                <CardContent className="flex justify-center pb-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-2xl text-center opacity-40">
                        <div className="p-4">
                            <h3 className="font-mono text-xs uppercase tracking-widest mb-2">
                                Free
                            </h3>
                            <p className="font-serif text-2xl font-semibold">0€</p>
                        </div>
                        <div className="p-4 border-x border-mentha-forest/10 dark:border-white/10">
                            <h3 className="font-mono text-xs uppercase tracking-widest mb-2">
                                Pro
                            </h3>
                            <p className="font-serif text-2xl font-semibold">49€</p>
                        </div>
                        <div className="p-4">
                            <h3 className="font-mono text-xs uppercase tracking-widest mb-2">
                                Enterprise
                            </h3>
                            <p className="font-serif text-2xl font-semibold">Custom</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
