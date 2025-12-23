import Link from "next/link";
import { getAllPosts } from "@/lib/blog-data";
import { ArrowRight } from "lucide-react";
import Navbar from '@/components/landing/sections/Navbar'
import Footer from '@/components/landing/sections/Footer'

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#050505] text-gray-900 dark:text-white selection:bg-emerald-500/30 transition-colors">
      <Navbar />
      <main className="pt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">
            The Mentha Blog
          </h1>
          <p className="text-xl text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto">
            Insights, strategies, and guides for the new era of Answer Engine Optimization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] shadow-sm"
            >
              <div className="h-48 bg-gray-100 dark:bg-zinc-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 dark:from-emerald-900/50 to-gray-50 dark:to-zinc-900 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                  <span className="text-4xl opacity-20">📝</span>
                </div>
                <div className="absolute top-4 left-4 bg-white/80 dark:bg-black/50 backdrop-blur-md text-xs font-medium text-gray-900 dark:text-white px-3 py-1 rounded-full border border-gray-200 dark:border-white/10">
                  {post.category}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-zinc-400 mb-4">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>

                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {post.title}
                </h2>

                <p className="text-gray-500 dark:text-zinc-400 text-sm line-clamp-3 mb-6 flex-1">
                  {post.excerpt}
                </p>

                <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-500">
                  Read Article
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
