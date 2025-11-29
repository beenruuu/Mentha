import Link from 'next/link'

export default function SiteFooter() {
  return (
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
              <li><Link href="/dashboard" className="hover:text-emerald-400">Analysis</Link></li>
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
          </div>
        </div>
      </div>
    </footer>
  )
}
