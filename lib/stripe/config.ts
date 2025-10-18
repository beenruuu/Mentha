import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
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
