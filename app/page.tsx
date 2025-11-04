'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, ArrowRight } from 'lucide-react'
import Image from 'next/image'

export default function LandingPage() {
  const router = useRouter()
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  const [isAnnual, setIsAnnual] = useState(true)

  useEffect(() => {
    // En modo demo, redirigir automáticamente al dashboard
    if (isDemoMode) {
      router.push('/dashboard')
    }
  }, [isDemoMode, router])

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between py-5">
            <Link href="/" className="flex items-end gap-1">
              <svg className="h-6 w-6 text-emerald-500" viewBox="0 0 40 40">
                <path fill="currentColor" d="M19.7,26.3l3.2-4.2c1.7-2.6,3.5-5.4,3.9-8.5l-1.8,3.4c-1.3,1.8-2.6,3.8-4.1,5.4s-2.3,2.3-2.7,2.4-.2,0-.2-.2c-1-3.3-1.1-7.5.3-10.7s6.4-8,9.5-10.6,2.5-2.1,2.7-2c2.5,4.1,4.3,9.4,3.1,14.3-1.5,6.1-7.9,10.2-13.9,10.7Z"/>
                <path fill="currentColor" d="M33.7,20.5v15.1c0,1-1.6,2.5-2.6,2.7-2.4.4-4.2-1-4.4-3.4s-.2-6.1,0-8,0-.4.2-.6,1.7-.9,2.1-1.2c1.8-1.2,3.3-2.7,4.7-4.5Z"/>
                <path fill="currentColor" d="M16.3,25.4c-.1.1-.9-.6-1.1-.7-1.6-1.5-3.1-3.8-4-5.8-.3,0-.1.3,0,.4.6,2.5,2.6,4.8,4.1,6.9-3.5-.3-7.2-2.6-8.2-6.2s.4-5.7,1.7-8.4c.1,0,1.4,1,1.6,1.1,1.9,1.6,5,4.4,5.8,6.7s.4,4,0,6Z"/>
                <path fill="currentColor" d="M7.3,24.4c1.9,2,4.3,3.2,7,3.9-.3,2.2.5,6.1-.4,8.1s-3.4,2.6-5.1,1.5-1.5-1.6-1.5-2.2v-11.2Z"/>
                <path fill="currentColor" d="M23.9,27.5v8.1c0,.4-.8,1.6-1.1,1.9-1.6,1.4-4.4,1.1-5.4-.9s-.5-1.4-.5-1.6v-6.7c2.4,0,4.7-.1,7-.8Z"/>
              </svg>
              <span className="text-xl font-bold tracking-tight">entha</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm text-white/80">
              <Link className="hover:text-white transition" href="/aeo-analysis">
                AEO Analysis
              </Link>
              <Link className="hover:text-white transition" href="/keywords">
                Keywords
              </Link>
              <Link className="hover:text-white transition" href="/competitors">
                Competitors
              </Link>
              <Link className="hover:text-white transition" href="/upgrade">
                Pricing
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link className="hidden sm:inline-flex text-sm text-white/80 hover:text-white transition" href="/auth/login">
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition"
              >
                <ArrowRight className="h-4 w-4" />
                Create account
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-4xl mx-auto pt-14 pb-12 sm:pt-20 md:pt-28 text-center px-4">
        {/* Social proof */}
        <div className="mb-6 flex items-center justify-center gap-4">
          <div className="flex -space-x-3">
            <img 
              src="https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/2201bb49-ba9d-4655-9360-c0350107a9fd_320w.jpg" 
              alt="Brand 1" 
              className="h-9 w-9 rounded-full ring-2 ring-black/60 object-cover" 
            />
            <img 
              src="https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/c1bfea42-f5c9-4b52-974e-36fe36212b17_320w.jpg" 
              alt="Brand 2" 
              className="h-9 w-9 rounded-full ring-2 ring-black/60 object-cover" 
            />
            <img 
              src="https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/b6d79211-32f1-430e-96b3-9b4d857c1482_320w.jpg" 
              alt="Brand 3" 
              className="h-9 w-9 rounded-full ring-2 ring-black/60 object-cover"
            />
            <img 
              src="https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/5bf79840-b7ed-4d8d-acd3-c5f5835a065e_320w.jpg" 
              alt="Brand 4" 
              className="h-9 w-9 rounded-full ring-2 ring-black/60 object-cover" 
            />
            <img 
              src="https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/590efc90-e69f-4f7e-a7c1-e54d0a7fe400_320w.jpg" 
              alt="Brand 5" 
              className="h-9 w-9 rounded-full ring-2 ring-black/60 object-cover" 
            />
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-emerald-500" />
              ))}
            </div>
            <p className="mt-1 text-xs font-medium text-white/70">140+ optimized brands</p>
          </div>
        </div>

        <h1 className="max-w-5xl mx-auto text-4xl sm:text-5xl md:text-7xl tracking-tighter">
          Ready to{' '}
          <span className="italic text-emerald-400 tracking-tight font-serif">
            dominate
          </span>{' '}
          AI search engines?
        </h1>

        <p className="max-w-2xl mx-auto mt-6 text-base sm:text-lg font-normal text-white/70">
          Optimize your brand visibility across ChatGPT, Claude, Perplexity, and Gemini. Get actionable insights powered by advanced AI analysis.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row mt-8 items-center justify-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset] text-base font-medium text-black bg-emerald-500 rounded-xl px-6 py-3 hover:bg-emerald-400 transition-colors"
          >
            Start Free Trial
          </Link>
          <Link
            href="/aeo-analysis"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-base font-medium text-white/90 backdrop-blur hover:bg-white/10 transition-colors"
          >
            Analyze Your Site
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mt-16 max-w-6xl mx-auto">
          {/* AEO Analysis */}
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b2421] p-6 md:p-8 lg:col-span-2 hover:border-emerald-400/30 hover:bg-[#0d2825] transition">
            <div className="absolute inset-0 opacity-[0.12]">
              <svg className="h-full w-full" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="gridA" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M24 0H0V24" stroke="#10b981" strokeOpacity="0.25" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="400" height="300" fill="url(#gridA)" />
                <circle cx="60" cy="90" r="2" fill="#10b981" />
                <circle cx="210" cy="60" r="2" fill="#10b981" />
                <circle cx="320" cy="140" r="2" fill="#10b981" />
                <path d="M50 210C100 160 170 170 220 130C270 90 320 100 350 70" stroke="#10b981" strokeOpacity="0.35" strokeWidth="1.2" fill="none" />
              </svg>
            </div>
            <div className="relative z-10">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-400/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-emerald-400 stroke-[1.5]">
                  <path d="M12 2a10 10 0 0 1 7.38 16.75" />
                  <path d="M12 8v8" />
                  <path d="M16 12H8" />
                  <path d="M2.5 8.875a10 10 0 0 0-.5 3" />
                  <path d="M2.83 16a10 10 0 0 0 2.43 3.4" />
                  <path d="M4.636 5.235a10 10 0 0 1 .891-.857" />
                  <path d="M8.644 21.42a10 10 0 0 0 7.631-.38" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl tracking-tight">
                AEO Analysis<br />
                <span className="text-emerald-400">powered by AI.</span>
              </h3>
              <p className="mt-3 text-sm md:text-base text-slate-400">
                Deep content analysis optimized for ChatGPT, Claude, and other AI engines.
              </p>
            </div>
          </section>

          {/* Keyword Tracking (Large) */}
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b2421] p-6 md:p-8 lg:col-span-4 hover:border-emerald-400/30 hover:bg-[#0d2825] transition">
            <div className="absolute inset-0 opacity-[0.09]">
              <svg className="h-full w-full" viewBox="0 0 800 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="800" height="300" fill="none" />
                <path d="M20 160C60 90 140 90 200 150C235 185 270 185 315 150C370 107 430 120 480 165C520 200 560 200 610 165C660 130 700 140 780 110" stroke="url(#fadeLine)" strokeWidth="2" strokeLinecap="round" />
                <g stroke="#10b981" strokeOpacity="0.25">
                  <path d="M0 40H800M0 80H800M0 120H800M0 160H800M0 200H800M0 240H800" />
                  <path d="M80 0V300M160 0V300M240 0V300M320 0V300M400 0V300M480 0V300M560 0V300M640 0V300M720 0V300" />
                </g>
              </svg>
            </div>
            <div className="relative z-10">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-400/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-emerald-400 stroke-[1.5]">
                  <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl tracking-tight">
                Track visibility.<br />
                <span className="text-emerald-400">Across all AI models.</span>
              </h3>
              <p className="mt-3 text-sm md:text-base text-slate-400 max-w-2xl">
                Monitor keyword performance and rankings in real-time across multiple AI search engines.
              </p>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 hover:border-emerald-400/30 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 stroke-[1.5]">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <p className="text-sm text-slate-300">ChatGPT</p>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 hover:border-emerald-400/30 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 stroke-[1.5]">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M9 3v18" />
                  </svg>
                  <p className="text-sm text-slate-300">Claude</p>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 hover:border-emerald-400/30 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 stroke-[1.5]">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                  <p className="text-sm text-slate-300">Perplexity</p>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 hover:border-emerald-400/30 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 stroke-[1.5]">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  <p className="text-sm text-slate-300">Gemini</p>
                </div>
              </div>
            </div>
          </section>

          {/* Competitor Analysis */}
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b2421] p-6 md:p-8 lg:col-span-2 hover:border-emerald-400/30 hover:bg-[#0d2825] transition">
            <div className="absolute inset-0 opacity-[0.12]">
              <svg className="h-full w-full" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="gridC" width="22" height="22" patternUnits="userSpaceOnUse">
                    <path d="M22 0H0V22" stroke="#10b981" strokeOpacity="0.25" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="400" height="300" fill="url(#gridC)" />
                <path d="M40 230C110 180 180 80 350 120" stroke="#10b981" strokeOpacity="0.35" strokeWidth="1.2" fill="none" />
                <circle cx="140" cy="150" r="3" fill="#10b981" />
                <circle cx="260" cy="120" r="3" fill="#10b981" />
                <circle cx="330" cy="140" r="3" fill="#10b981" />
              </svg>
            </div>
            <div className="relative z-10">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-400/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-emerald-400 stroke-[1.5]">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl tracking-tight">
                Competitor intelligence<br />
                <span className="text-emerald-400">made simple.</span>
              </h3>
              <p className="mt-3 text-sm md:text-base text-slate-400">
                Compare performance and discover opportunities to outrank rivals in AI responses.
              </p>
            </div>
          </section>

          {/* Brand Monitoring */}
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b2421] p-6 md:p-8 lg:col-span-2 hover:border-emerald-400/30 hover:bg-[#0d2825] transition">
            <div className="absolute inset-0 opacity-[0.10]">
              <svg className="h-full w-full" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="dotsD" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill="#10b981" fillOpacity="0.25" />
                  </pattern>
                </defs>
                <rect width="400" height="300" fill="url(#dotsD)" />
                <circle cx="200" cy="150" r="70" stroke="#10b981" strokeOpacity="0.35" strokeWidth="1.2" fill="none" />
                <circle cx="200" cy="150" r="36" stroke="#10b981" strokeOpacity="0.45" strokeWidth="1.2" fill="none" />
                <circle cx="200" cy="150" r="4" fill="#10b981" />
              </svg>
            </div>
            <div className="relative z-10">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-400/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-emerald-400 stroke-[1.5]">
                  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl tracking-tight">
                Brand protection.<br />
                <span className="text-emerald-400">24/7 monitoring.</span>
              </h3>
              <p className="mt-3 text-sm md:text-base text-slate-400">
                Track brand mentions and sentiment across AI platforms in real-time.
              </p>
            </div>
          </section>

          {/* AI Recommendations */}
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b2421] p-6 md:p-8 lg:col-span-2 hover:border-emerald-400/30 hover:bg-[#0d2825] transition">
            <div className="absolute inset-0 opacity-[0.12]">
              <svg className="h-full w-full" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="gridE" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M24 0H0V24" stroke="#10b981" strokeOpacity="0.2" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="400" height="300" fill="url(#gridE)" />
                <path d="M20 180C60 120 120 180 160 160C200 140 230 150 260 120C290 90 320 120 360 110" stroke="#10b981" strokeOpacity="0.45" strokeWidth="1.6" fill="none" />
              </svg>
            </div>
            <div className="relative z-10">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-400/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-emerald-400 stroke-[1.5]">
                  <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
                  <path d="M20 2v4" />
                  <path d="M22 4h-4" />
                  <circle cx="4" cy="20" r="2" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl tracking-tight">
                Smart insights.<br />
                <span className="text-emerald-400">Actionable results.</span>
              </h3>
              <p className="mt-3 text-sm md:text-base text-slate-400">
                Get AI-powered recommendations to improve your content and boost visibility.
              </p>
            </div>
          </section>
        </div>
      </section>

      {/* Results & Testimonials Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-[#0b2421] border border-white/10 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Star className="h-4 w-4" />
            <span>Success Stories</span>
          </div>
          <div className="mt-2">
            <h2 className="text-[44px] sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.9] text-white font-medium tracking-tighter">
              Results.
            </h2>
            <p className="mt-1 text-sm sm:text-base text-white/60">
              Real impact from real brands optimizing for AI
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Metrics Card */}
            <article className="sm:p-6 flex flex-col min-h-[420px] bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-lg justify-between">
              <div className="space-y-5">
                <div className="flex items-end gap-2">
                  <span className="text-5xl sm:text-6xl text-white font-medium tracking-tighter">98.5</span>
                  <span className="text-white/60 text-base">%</span>
                </div>
                <p className="text-sm text-white/70">
                  We've optimized <span className="font-medium text-white">5,000+ brands</span> with industry-leading AI visibility improvements.
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white">Mentha AEO™</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 bg-white/10 border border-white/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-emerald-400">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div className="h-7 w-7 bg-white/10 border border-white/20 -ml-2 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-emerald-400">
                      <path d="M12 2a10 10 0 0 1 7.38 16.75" />
                      <path d="M12 8v8" />
                      <path d="M16 12H8" />
                    </svg>
                  </div>
                  <div className="h-7 w-7 bg-white/10 border border-white/20 -ml-2 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-emerald-400">
                      <path d="M16 7h6v6" />
                      <path d="m22 7-8.5 8.5-5-5L2 17" />
                    </svg>
                  </div>
                  <span className="inline-flex items-center justify-center -ml-1 h-7 px-2 rounded-full bg-emerald-500 text-black text-xs font-medium">5K+</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M16 7h6v6" />
                    <path d="m22 7-8.5 8.5-5-5L2 17" />
                  </svg>
                  <span className="text-xs text-white/60">Optimizing across 30+ industries</span>
                </div>
              </div>
              <Link href="/auth/signup" className="mt-6 h-11 w-full rounded-full bg-emerald-500 text-black text-sm font-medium hover:bg-emerald-400 transition flex items-center justify-center">
                Start optimizing
              </Link>
            </article>

            {/* Testimonial Column 1 */}
            <div className="grid grid-rows-[auto_1fr] gap-4">
              <article className="flex bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-lg items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-md flex items-center justify-center text-white font-bold text-sm">
                    SC
                  </div>
                  <div>
                    <p className="text-sm font-medium tracking-tight leading-tight text-white">Sarah Chen</p>
                    <p className="text-xs text-white/60">TechFlow Solutions</p>
                  </div>
                </div>
                <span className="text-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </span>
              </article>

              <article className="sm:p-6 flex flex-col min-h-[420px] bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-lg justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-emerald-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-emerald-500" />
                    ))}
                  </div>
                  <span className="text-white/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M5 12h14" />
                      <path d="M12 5v14" />
                    </svg>
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl text-right leading-snug text-white font-medium tracking-tighter">
                  Mentha increased our ChatGPT visibility by 300% in just 3 weeks. Game-changing.
                </p>
              </article>
            </div>

            {/* Testimonial Column 2 */}
            <div className="grid grid-rows-[1fr_auto] gap-4">
              <article className="flex flex-col min-h-[420px] bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg justify-between">
                <p className="text-2xl sm:text-3xl text-center leading-snug text-white font-medium tracking-tighter">
                  Finally, a platform that understands AI optimization. Results in days, not months.
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-emerald-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-emerald-500" />
                    ))}
                  </div>
                  <span className="text-white/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M5 12h14" />
                      <path d="M12 5v14" />
                    </svg>
                  </span>
                </div>
              </article>

              <article className="flex gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-lg items-center">
                <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm">
                  MJ
                </div>
                <div>
                  <p className="text-sm font-medium tracking-tight leading-tight text-white">Marcus Johnson</p>
                  <p className="text-xs text-white/60">Innovate Labs</p>
                </div>
              </article>
            </div>

            {/* Testimonial Column 3 */}
            <div className="grid grid-rows-[auto_1fr] gap-4">
              <article className="flex bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-lg items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md flex items-center justify-center text-white font-bold text-sm">
                    MP
                  </div>
                  <div>
                    <p className="text-sm font-medium tracking-tight leading-tight text-white">Maya Patel</p>
                    <p className="text-xs text-white/60">Operations Director</p>
                  </div>
                </div>
                <span className="text-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </span>
              </article>

              <article className="sm:p-6 flex flex-col min-h-[420px] bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-lg justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-emerald-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-emerald-500" />
                    ))}
                  </div>
                  <span className="text-white/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M5 12h14" />
                      <path d="M12 5v14" />
                    </svg>
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl text-right leading-snug text-white font-medium tracking-tighter">
                  Seamless integration with our workflow. The AI insights are incredibly accurate.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="isolate overflow-hidden py-24 relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(16,185,129,0.08),transparent_60%)]" />

        <div className="z-10 max-w-7xl mx-auto px-6 md:px-8 relative">
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl font-medium text-white tracking-tight">
              Pricing Plans
            </h2>

            <div className="flex mt-6 gap-4 items-center justify-center">
              <span className={`text-sm transition-colors ${!isAnnual ? 'text-white' : 'text-white/70'}`}>Monthly</span>
              <button 
                onClick={() => setIsAnnual(!isAnnual)}
                className="relative inline-flex h-8 w-16 items-center rounded-full bg-white/10 p-1 ring-1 ring-white/15 transition hover:bg-white/15"
              >
                <span 
                  className={`inline-flex h-6 w-6 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-transform duration-200 will-change-transform ${isAnnual ? 'translate-x-8' : 'translate-x-0'}`} 
                />
              </button>
              <span className={`text-sm transition-colors ${isAnnual ? 'text-white' : 'text-white/70'}`}>
                Annual
                <span className={`ml-2 inline-flex items-center rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300 ring-1 ring-emerald-300/20 transition-opacity ${isAnnual ? 'opacity-100' : 'opacity-0'}`}>
                  Save 20%
                </span>
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 mt-10">
            {/* Starter Plan */}
            <div className="border-white/10 border rounded-3xl p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm uppercase tracking-[0.18em] text-white/60">Starter</div>
                  <div className="mt-2 flex items-end gap-2">
                    <div className="text-2xl font-medium tracking-tight text-white/80">Coming Soon</div>
                  </div>
                </div>
              </div>

              <Link href="/auth/signup" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium tracking-tight text-black hover:bg-white/90">
                Start Free
              </Link>

              <ul className="mt-6 space-y-3 text-sm text-white/75">
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 flex-shrink-0">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Up to 10 AEO analyses per month
                </li>
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 flex-shrink-0">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Basic keyword tracking
                </li>
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 flex-shrink-0">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  1 brand monitoring
                </li>
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 flex-shrink-0">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Community support
                </li>
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 flex-shrink-0">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Basic AI insights
                </li>
              </ul>
            </div>

            {/* Professional Plan (Featured) */}
            <div className="border-white/10 border ring-emerald-300/10 ring-1 rounded-3xl p-2 relative backdrop-blur-xl">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.06] to-transparent">
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent" />
                  <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_80%_0%,rgba(16,185,129,0.25),transparent_60%)]" />
                </div>

                <div className="relative p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm uppercase tracking-[0.18em] text-white/70">Professional</div>
                      <div className="mt-2 flex items-end gap-2">
                        <div className="text-2xl font-medium tracking-tight text-white/80">Coming Soon</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] text-emerald-300 ring-1 ring-emerald-300/25">
                      <Star className="h-3.5 w-3.5" />
                      Most Popular
                    </span>
                  </div>

                  <Link href="/auth/signup" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-500 px-4 py-3 text-sm font-medium tracking-tight text-black shadow-[0_10px_30px_rgba(16,185,129,0.25)] hover:from-emerald-300 hover:to-emerald-400">
                    Upgrade to Pro
                  </Link>

                  <ul className="mt-6 space-y-3 text-sm text-white/85">
                    <li className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 flex-shrink-0">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      Unlimited AEO analyses
                    </li>
                    <li className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 flex-shrink-0">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      Advanced keyword tracking across all AI models
                    </li>
                    <li className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 flex-shrink-0">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      Up to 5 brands & competitor analysis
                    </li>
                    <li className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 flex-shrink-0">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      Priority support with 24h response
                    </li>
                    <li className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 flex-shrink-0">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      Advanced AI recommendations
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="border-white/10 border rounded-3xl p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm uppercase tracking-[0.18em] text-white/60">Enterprise</div>
                  <div className="mt-2 flex items-end gap-2">
                    <div className="text-4xl font-medium tracking-tight text-white">Custom</div>
                  </div>
                </div>
              </div>

              <Link href="/auth/signup" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium tracking-tight text-white/90 hover:bg-white/10">
                Contact Sales
              </Link>

              <ul className="mt-6 space-y-3 text-sm text-white/75">
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 flex-shrink-0">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Unlimited everything
                </li>
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 flex-shrink-0">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Custom AI model training
                </li>
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 flex-shrink-0">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Dedicated account manager
                </li>
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 flex-shrink-0">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  White-label options
                </li>
                <li className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400 flex-shrink-0">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  API access & custom integrations
                </li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-white/50 text-center mt-6">
            Pricing will be available soon. Join the waitlist to get early access and exclusive discounts.
          </p>
        </div>
      </section>

      {/* Footer CTA */}
      <div className="w-full px-4 sm:px-6 lg:px-8 mt-8 sm:mt-10 mb-16 flex justify-center">
        <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-neutral-950 text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] p-6 sm:p-8 max-w-7xl w-full">
          {/* Background effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_-20%,rgba(16,185,129,0.08),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_80%_120%,rgba(16,185,129,0.06),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.15]" />
          </div>

          <div className="relative">
            <h2 className="text-[16vw] sm:text-[12vw] lg:text-[9vw] leading-[0.9] font-semibold tracking-tighter">
              <span className="block">Ready to dominate</span>
              <span className="block text-white/60">AI search engines?</span>
            </h2>

            <div className="mt-8 flex flex-col md:flex-row md:items-start md:justify-between gap-8">
              {/* Get Started */}
              <div className="flex-1">
                <p className="text-sm text-white/60 mb-3">Get Started</p>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 hover:bg-emerald-400 text-sm font-medium text-gray-900 tracking-tight bg-emerald-500 border-white/10 border rounded-full px-5 py-3 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>Start Free Trial</span>
                </Link>
              </div>

              {/* See It In Action */}
              <div className="flex-1">
                <p className="text-sm text-white/60 mb-3">See It In Action</p>
                <Link
                  href="/aeo-analysis"
                  className="inline-flex items-center gap-2 hover:bg-emerald-400 text-sm font-medium text-gray-900 tracking-tight bg-emerald-500 border-white/10 border rounded-full px-5 py-3 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 0 1 7.38 16.75" />
                    <path d="M12 8v8" />
                    <path d="M16 12H8" />
                  </svg>
                  <span>Analyze Your Site</span>
                </Link>
              </div>

              {/* Connect With Us */}
              <div className="flex-1">
                <p className="text-sm text-white/60 mb-3">Connect With Us</p>
                <div className="flex flex-wrap gap-3 items-center">
                  <Link
                    href="https://twitter.com/mentha"
                    target="_blank"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 tracking-tight bg-white border-white/10 border rounded-full px-4 py-3 hover:bg-white/90 transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                    </svg>
                    <span>Twitter</span>
                  </Link>
                  <Link
                    href="https://github.com/beenruuu/mentha"
                    target="_blank"
                    className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-gray-900 border border-white/10 hover:bg-white/90 transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                      <path d="M9 18c-4.51 2-5-2-7-2" />
                    </svg>
                  </Link>
                  <Link
                    href="https://linkedin.com/company/mentha"
                    target="_blank"
                    className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-gray-900 border border-white/10 hover:bg-white/90 transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect width="4" height="12" x="2" y="9" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-white/10" />

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Menu */}
              <div>
                <p className="text-sm text-white/60">Explore</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <Link href="/aeo-analysis" className="font-medium tracking-tight hover:underline">AEO Analysis</Link>
                  <Link href="/keywords" className="font-medium tracking-tight hover:underline">Keywords</Link>
                  <Link href="/competitors" className="font-medium tracking-tight hover:underline">Competitors</Link>
                  <Link href="/upgrade" className="font-medium tracking-tight hover:underline">Pricing</Link>
                </div>
              </div>

              {/* Legal */}
              <div>
                <p className="text-sm text-white/60">Legal</p>
                <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                  <Link href="#" className="font-medium tracking-tight hover:underline">Terms & Conditions</Link>
                  <Link href="#" className="font-medium tracking-tight hover:underline">Privacy Policy</Link>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-white/70">
              © 2025 Mentha — AI Engine Optimization Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


