import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug } from "@/lib/blog-data";
import { ArrowRight } from "lucide-react";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

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
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Link 
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors mb-8"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to Blog
        </Link>

        <article>
          <header className="mb-12">
            <div className="flex items-center gap-3 text-sm text-emerald-500 font-medium mb-4">
              <span className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                {post.category}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{post.readTime}</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-6 leading-tight">
              {post.title}
            </h1>
            
            <div className="flex items-center gap-4 border-b border-white/10 pb-8">
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-lg">
                🤖
              </div>
              <div>
                <div className="text-white font-medium">{post.author}</div>
                <div className="text-slate-500 text-sm">{post.date}</div>
              </div>
            </div>
          </header>

          <div 
            className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-p:text-slate-300 prose-a:text-emerald-400 hover:prose-a:text-emerald-300 prose-strong:text-white prose-li:text-slate-300"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-semibold text-white mb-3">
              Ready to optimize for the future?
            </h3>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto">
              Start tracking your brand's visibility on ChatGPT, Claude, and Perplexity today.
            </p>
            <Link 
              href="/auth/signup"
              className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-white/10 bg-[#020817] py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Mentha. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
