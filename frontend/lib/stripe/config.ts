import Stripe from 'stripe'

// Lazy initialization to avoid build errors
let stripeClient: Stripe | null = null

export function getStripe() {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    } as any)
  }
  return stripeClient
}

// Mantener exportación para compatibilidad, pero usar getter
export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    const client = getStripe()
    if (!client) {
      throw new Error('Stripe client not initialized. Please configure STRIPE_SECRET_KEY.')
    }
    return (client as any)[prop]
  }
})

export const PLANS = {
  starter: {
    name: 'Starter',
    monthlyPriceId: process.env.STRIPE_PRICE_ID_STARTER_MONTHLY!,
    yearlyPriceId: process.env.STRIPE_PRICE_ID_STARTER_YEARLY!,
    features: [
      '5 Brand Analyses per month',
      '50 Keyword Trackings',
      'Basic AI Models (ChatGPT, Claude)',
      'Email Support',
      'Weekly Reports',
    ],
    limits: {
      brands: 2,
      analyses: 5,
      keywords: 50,
      competitors: 3,
    },
  },
  pro: {
    name: 'Pro',
    monthlyPriceId: process.env.STRIPE_PRICE_ID_PRO_MONTHLY!,
    yearlyPriceId: process.env.STRIPE_PRICE_ID_PRO_YEARLY!,
    features: [
      'Unlimited Brand Analyses',
      '500 Keyword Trackings',
      'All AI Models (ChatGPT, Claude, Perplexity, Gemini)',
      'Priority Support',
      'Daily Reports',
      'Advanced Recommendations',
      'Competitor Analysis',
    ],
    limits: {
      brands: 10,
      analyses: -1, // unlimited
      keywords: 500,
      competitors: 10,
    },
  },
  enterprise: {
    name: 'Enterprise',
    monthlyPriceId: process.env.STRIPE_PRICE_ID_ENTERPRISE_MONTHLY!,
    yearlyPriceId: process.env.STRIPE_PRICE_ID_ENTERPRISE_YEARLY!,
    features: [
      'Unlimited Everything',
      'Custom AI Model Integration',
      'Dedicated Account Manager',
      '24/7 Priority Support',
      'Real-time Reports',
      'White-label Options',
      'API Access',
      'Custom Integrations',
    ],
    limits: {
      brands: -1, // unlimited
      analyses: -1, // unlimited
      keywords: -1, // unlimited
      competitors: -1, // unlimited
    },
  },
}
