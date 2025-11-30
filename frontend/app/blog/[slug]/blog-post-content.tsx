'use client'

import Link from "next/link";
import { useTranslations } from "@/lib/i18n";

interface BlogPost {
  title: string;
  category: string;
  readTime: string;
  author: string;
  date: string;
  content: string;
}

interface BlogPostContentProps {
  post: BlogPost;
}

export default function BlogPostContent({ post }: BlogPostContentProps) {
  const { t } = useTranslations();

  return (
    <>
      <Link 
        href="/blog"
        className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-8"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        {t.blogBackToBlog}
      </Link>

      <article>
        <header className="mb-12">
          <div className="flex items-center gap-3 text-sm text-emerald-600 dark:text-emerald-500 font-medium mb-4">
            <span className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              {post.category}
            </span>
            <span className="text-gray-400 dark:text-slate-500">•</span>
            <span className="text-gray-500 dark:text-slate-400">{post.readTime}</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-6 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex items-center gap-4 border-b border-gray-200 dark:border-white/10 pb-8">
            <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-lg">
              🤖
            </div>
            <div>
              <div className="text-gray-900 dark:text-white font-medium">{post.author}</div>
              <div className="text-gray-500 dark:text-slate-500 text-sm">{post.date}</div>
            </div>
          </div>
        </header>

        <div 
          className="prose prose-gray dark:prose-invert prose-lg max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-600 dark:prose-p:text-slate-300 prose-a:text-emerald-600 dark:prose-a:text-emerald-400 hover:prose-a:text-emerald-700 dark:hover:prose-a:text-emerald-300 prose-strong:text-gray-900 dark:prose-strong:text-white prose-li:text-gray-600 dark:prose-li:text-slate-300"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      <div className="mt-16 pt-8 border-t border-gray-200 dark:border-white/10">
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            {t.blogReadyToOptimize}
          </h3>
          <p className="text-gray-600 dark:text-slate-400 mb-6 max-w-lg mx-auto">
            {t.blogStartOptimizing}
          </p>
          <Link 
            href="/auth/signup"
            className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {t.blogGetStartedFree}
          </Link>
        </div>
      </div>
    </>
  );
}
