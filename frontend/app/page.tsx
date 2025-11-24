"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, BarChart3, Check, Globe, Layout, Search, Shield, Zap } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  const router = useRouter()
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  const [isAnnual, setIsAnnual] = useState(true)
  
  const aiProviders = [
    { name: 'OpenAI', src: '/providers/openai.svg' },
    { name: 'Claude', src: '/providers/claude-color.svg' },
    { name: 'Perplexity', src: '/providers/perplexity-color.svg' },
    { name: 'Gemini', src: '/providers/gemini-color.svg' }
  ]

  useEffect(() => {
    if (isDemoMode) {
      router.push('/dashboard')
    }
  }, [isDemoMode, router])

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 40 40">
                  <path fill="currentColor" d="M19.7,26.3l3.2-4.2c1.7-2.6,3.5-5.4,3.9-8.5l-1.8,3.4c-1.3,1.8-2.6,3.8-4.1,5.4s-2.3,2.3-2.7,2.4-.2,0-.2-.2c-1-3.3-1.1-7.5.3-10.7s6.4-8,9.5-10.6,2.5-2.1,2.7-2c2.5,4.1,4.3,9.4,3.1,14.3-1.5,6.1-7.9,10.2-13.9,10.7Z"/>
                  <path fill="currentColor" d="M33.7,20.5v15.1c0,1-1.6,2.5-2.6,2.7-2.4.4-4.2-1-4.4-3.4s-.2-6.1,0-8,0-.4.2-.6,1.7-.9,2.1-1.2c1.8-1.2,3.3-2.7,4.7-4.5Z"/>
                  <path fill="currentColor" d="M16.3,25.4c-.1.1-.9-.6-1.1-.7-1.6-1.5-3.1-3.8-4-5.8-.3,0-.1.3,0,.4.6,2.5,2.6,4.8,4.1,6.9-3.5-.3-7.2-2.6-8.2-6.2s.4-5.7,1.7-8.4c.1,0,1.4,1,1.6,1.1,1.9,1.6,5,4.4,5.8,6.7s.4,4,0,6Z"/>
                  <path fill="currentColor" d="M7.3,24.4c1.9,2,4.3,3.2,7,3.9-.3,2.2.5,6.1-.4,8.1s-3.4,2.6-5.1,1.5-1.5-1.6-1.5-2.2v-11.2Z"/>
                  <path fill="currentColor" d="M23.9,27.5v8.1c0,.4-.8,1.6-1.1,1.9-1.6,1.4-4.4,1.1-5.4-.9s-.5-1.4-.5-1.6v-6.7c2.4,0,4.7-.1,7-.8Z"/>
                </svg>
              </div>
              <span className="text-lg font-semibold tracking-tight">Mentha</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
              <Link className="hover:text-white transition-colors" href="/aeo-analysis">Product</Link>
              <Link className="hover:text-white transition-colors" href="/competitors">Solutions</Link>
              <Link className="hover:text-white transition-colors" href="/upgrade">Pricing</Link>
              <Link className="hover:text-white transition-colors" href="/blog">Resources</Link>
            </nav>

            <div className="flex items-center gap-4">
              <Link className="hidden sm:inline-flex text-sm font-medium text-zinc-400 hover:text-white transition-colors" href="/auth/login">
                Log in
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="bg-emerald-500 text-black hover:bg-emerald-400 font-medium rounded-full px-5">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-16">
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-6 lg:px-8 mb-24">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400 mb-8">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              The Future of SEO is Here
            </div>
            
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-7xl mb-8">
              Dominate the <span className="text-emerald-500">AI Search</span> Landscape
            </h1>
            
            <p className="max-w-2xl text-lg text-zinc-400 mb-10 leading-relaxed">
              Traditional SEO is fading. Mentha helps B2B brands optimize for the new era of search engines—ChatGPT, Claude, Perplexity, and Gemini.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md mx-auto">
              <Link href="/auth/signup" className="w-full">
                <Button size="lg" className="w-full bg-emerald-500 text-black hover:bg-emerald-400 rounded-full h-12 text-base">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/aeo-analysis" className="w-full">
                <Button size="lg" variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-full h-12 text-base">
                  Analyze Your Site
                </Button>
              </Link>
            </div>

            <div className="mt-16 pt-8 border-t border-white/5 w-full max-w-5xl">
              <p className="text-sm text-zinc-500 mb-6">Trusted by forward-thinking marketing teams</p>
              <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                {/* Placeholder logos for B2B feel */}
                {['Acme Corp', 'GlobalTech', 'Nebula', 'Vertex', 'Horizon'].map((brand) => (
                  <div key={brand} className="text-xl font-bold text-white flex items-center gap-2">
                    <div className="h-6 w-6 bg-white/20 rounded-full"></div>
                    {brand}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Providers Section */}
        <section className="mx-auto max-w-7xl px-6 lg:px-8 mb-32">
          <div className="text-center">
            <div className="mb-10">
              <h2 id="providers-title" className="text-2xl font-medium text-white">Optimized for all major AI Engines</h2>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-12 items-center justify-items-center py-6">
              {aiProviders.map((provider) => (
                <div key={provider.name} className="flex flex-col items-center">
                  <div className="h-16 w-36 flex items-center justify-center">
                      <Image
                        src={provider.src}
                        alt={provider.name}
                        width={120}
                        height={40}
                        className="object-contain"
                      />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mx-auto max-w-7xl px-6 lg:px-8 mb-32">
          <div className="mb-16">
            <h2 className="text-3xl font-semibold text-white mb-4">Comprehensive AI Optimization</h2>
            <p className="text-zinc-400 max-w-2xl">Everything you need to track, analyze, and improve your brand's visibility in Large Language Models.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "AEO Analysis",
                desc: "Deep dive into how AI models interpret your content and brand entities.",
                icon: Search,
                colSpan: "md:col-span-2"
              },
              {
                title: "Competitor Intel",
                desc: "Benchmark your share of voice against key market rivals.",
                icon: BarChart3,
                colSpan: "md:col-span-1"
              },
              {
                title: "Brand Protection",
                desc: "Monitor sentiment and accuracy of AI-generated responses about your brand.",
                icon: Shield,
                colSpan: "md:col-span-1"
              },
              {
                title: "Smart Recommendations",
                desc: "Actionable insights to structure data for better AI consumption.",
                icon: Zap,
                colSpan: "md:col-span-2"
              }
            ].map((feature, i) => (
              <div key={i} className={`${feature.colSpan} group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/20 p-8 hover:border-emerald-500/30 transition-colors`}>
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SEO vs GEO Comparison */}
        <section className="mx-auto max-w-7xl px-6 lg:px-8 mb-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-semibold text-white mb-6">The Paradigm Shift</h2>
              <p className="text-zinc-400 mb-8 text-lg">
                Search behavior is changing. Users are asking questions, not just searching for keywords. 
                Your optimization strategy needs to evolve from keywords to entities and context.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-none pt-1">
                    <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs">VS</div>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-2">Traditional SEO</h4>
                    <p className="text-sm text-zinc-500">Optimizing for 10 blue links, focusing on keywords and backlinks.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-none pt-1">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-2">Mentha GEO</h4>
                    <p className="text-sm text-zinc-500">Optimizing for the single best answer, focusing on entities, authority, and structured data.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative rounded-2xl border border-white/10 bg-zinc-900/50 p-1">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur opacity-30"></div>
              <div className="relative rounded-xl bg-[#0A0A0A] p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                  <div className="h-3 w-3 rounded-full bg-red-500/20"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500/20"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500/20"></div>
                </div>
                <div className="space-y-4">
                  <div className="bg-zinc-900/50 p-4 rounded-lg w-3/4">
                    <div className="h-2 w-1/3 bg-zinc-700 rounded mb-2"></div>
                    <div className="h-2 w-1/2 bg-zinc-800 rounded"></div>
                  </div>
                  <div className="bg-emerald-900/10 border border-emerald-500/10 p-4 rounded-lg ml-auto w-3/4">
                    <div className="h-2 w-1/4 bg-emerald-500/30 rounded mb-2"></div>
                    <div className="h-2 w-full bg-emerald-500/10 rounded mb-1"></div>
                    <div className="h-2 w-2/3 bg-emerald-500/10 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="mx-auto max-w-7xl px-6 lg:px-8 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-zinc-400">Choose the plan that fits your growth stage.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Starter",
                price: "Free",
                desc: "For individuals exploring AEO.",
                features: ["10 Analyses/mo", "Basic Tracking", "Community Support"]
              },
              {
                name: "Pro",
                price: "Coming Soon",
                desc: "For growing brands and agencies.",
                features: ["Unlimited Analyses", "Competitor Tracking", "Priority Support", "API Access"],
                highlight: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                desc: "For large organizations.",
                features: ["Custom Models", "Dedicated Manager", "SLA", "White Label"]
              }
            ].map((plan, i) => (
              <div key={i} className={`flex flex-col p-8 rounded-2xl border ${plan.highlight ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-white/10 bg-zinc-900/20'}`}>
                <h3 className="text-lg font-medium text-white mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-white mb-4">{plan.price}</div>
                <p className="text-sm text-zinc-400 mb-8">{plan.desc}</p>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-center text-sm text-zinc-300">
                      <Check className="h-4 w-4 text-emerald-500 mr-3" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full ${plan.highlight ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                  {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-3xl bg-emerald-900/20 border border-emerald-500/20 p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-semibold text-white mb-6">Ready to optimize for the future?</h2>
              <p className="text-zinc-400 max-w-xl mx-auto mb-8">
                Join thousands of marketers who are already adapting their strategy for the age of Artificial Intelligence.
              </p>
              <Link href="/auth/signup">
                <Button size="lg" className="bg-emerald-500 text-black hover:bg-emerald-400 rounded-full px-8">
                  Start Your Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#020202] py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 rounded bg-emerald-500/20 flex items-center justify-center">
                  <svg viewBox="0 0 40 40" className="h-4 w-4 text-emerald-500" aria-hidden="true" fill="currentColor">
                    <path d="M19.7,26.3l3.2-4.2c1.7-2.6,3.5-5.4,3.9-8.5l-1.8,3.4c-1.3,1.8-2.6,3.8-4.1,5.4s-2.3,2.3-2.7,2.4-.2,0-.2-.2c-1-3.3-1.1-7.5.3-10.7s6.4-8,9.5-10.6,2.5-2.1,2.7-2c2.5,4.1,4.3,9.4,3.1,14.3-1.5,6.1-7.9,10.2-13.9,10.7Z" />
                    <path d="M33.7,20.5v15.1c0,1-1.6,2.5-2.6,2.7-2.4.4-4.2-1-4.4-3.4s-.2-6.1,0-8,0-.4.2-.6,1.7-.9,2.1-1.2c1.8-1.2,3.3-2.7,4.7-4.5Z" />
                    <path d="M16.3,25.4c-.1.1-.9-.6-1.1-.7-1.6-1.5-3.1-3.8-4-5.8-.3,0-.1.3,0,.4.6,2.5,2.6,4.8,4.1,6.9-3.5-.3-7.2-2.6-8.2-6.2s.4-5.7,1.7-8.4c.1,0,1.4,1,1.6,1.1,1.9,1.6,5,4.4,5.8,6.7s.4,4,0,6Z" />
                    <path d="M7.3,24.4c1.9,2,4.3,3.2,7,3.9-.3,2.2.5,6.1-.4,8.1s-3.4,2.6-5.1,1.5-1.5-1.6-1.5-2.2v-11.2Z" />
                    <path d="M23.9,27.5v8.1c0,.4-.8,1.6-1.1,1.9-1.6,1.4-4.4,1.1-5.4-.9s-.5-1.4-.5-1.6v-6.7c2.4,0,4.7-.1,7-.8Z" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-white">Mentha</span>
              </Link>
              <p className="text-sm text-zinc-500">
                The first AEO platform designed for the modern web.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><Link href="/aeo-analysis" className="hover:text-emerald-400">Analysis</Link></li>
                <li><Link href="/keywords" className="hover:text-emerald-400">Keywords</Link></li>
                <li><Link href="/competitors" className="hover:text-emerald-400">Competitors</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><Link href="/about" className="hover:text-emerald-400">About</Link></li>
                <li><Link href="/blog" className="hover:text-emerald-400">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-emerald-400">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><Link href="/legal/privacy" className="hover:text-emerald-400">Privacy</Link></li>
                <li><Link href="/legal/terms" className="hover:text-emerald-400">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <p className="text-xs text-zinc-600">© 2025 Mentha Inc. All rights reserved.</p>
              </div>
            <div className="flex gap-4">
              {/* Social icons could go here */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}


