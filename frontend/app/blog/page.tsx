import Link from "next/link";
import { getAllPosts } from "@/lib/blog-data";
import { ArrowRight } from "lucide-react";

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-[#020817]">
      {/* Header */}
      <header className="relative border-b border-white/10">
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
              <span className="text-xl font-bold tracking-tight text-white">entha</span>
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
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition"
              >
                <ArrowRight className="h-4 w-4" />
                Create account
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-6">
            The Mentha Blog
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Insights, strategies, and guides for the new era of Answer Engine Optimization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link 
              key={post.slug} 
              href={`/blog/${post.slug}`}
              className="group flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]"
            >
              <div className="h-48 bg-slate-800 relative overflow-hidden">
                {/* Placeholder for actual image */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 to-slate-900 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                   <span className="text-4xl opacity-20">📝</span>
                </div>
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-xs font-medium text-white px-3 py-1 rounded-full border border-white/10">
                  {post.category}
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                
                <h2 className="text-xl font-semibold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                  {post.title}
                </h2>
                
                <p className="text-slate-400 text-sm line-clamp-3 mb-6 flex-1">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-500">
                  Read Article
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
      
      {/* Simple Footer for Blog */}
      <footer className="border-t border-white/10 bg-[#020817] py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Mentha. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
