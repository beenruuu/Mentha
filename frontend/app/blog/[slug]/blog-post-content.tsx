'use client'

import Link from "next/link";
import { useTranslations } from "@/lib/i18n";
import { ArrowLeft, Clock, User, Calendar, Share2, Twitter, Linkedin, Link as LinkIcon, ChevronRight } from "lucide-react";
import { useState } from "react";
import { getAllPosts } from "@/lib/blog-data";

interface BlogPost {
  slug?: string;
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
  const [copied, setCopied] = useState(false);

  // Get related posts (same category, excluding current)
  const allPosts = getAllPosts();
  const relatedPosts = allPosts
    .filter(p => p.category === post.category && p.slug !== post.slug)
    .slice(0, 2);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link');
    }
  };

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Back Navigation */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {t.blogBackToBlog}
      </Link>

      <article className="max-w-4xl mx-auto">
        {/* Article Header */}
        <header className="mb-12">
          {/* Category and Meta */}
          <div className="flex flex-wrap items-center gap-3 text-sm mb-6">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
              {post.category}
            </span>
            <span className="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400">
              <Clock className="w-4 h-4" />
              {post.readTime} {t.blogMinRead}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-8 leading-tight">
            {post.title}
          </h1>

          {/* Author and Date */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-lg font-semibold">
                M
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                  <User className="w-4 h-4 text-emerald-500" />
                  {post.author}
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-500 text-sm">
                  <Calendar className="w-4 h-4" />
                  {t.blogPublishedOn} {post.date}
                </div>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-zinc-500 mr-2">{t.blogShareArticle}:</span>
              <button
                onClick={shareOnTwitter}
                className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                aria-label="Share on Twitter"
              >
                <Twitter className="w-4 h-4" />
              </button>
              <button
                onClick={shareOnLinkedIn}
                className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                aria-label="Share on LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                aria-label="Copy link"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
              {copied && (
                <span className="text-xs text-emerald-500 animate-pulse">Copied!</span>
              )}
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div
          className="prose prose-gray dark:prose-invert prose-lg max-w-none 
            prose-headings:text-gray-900 dark:prose-headings:text-white 
            prose-headings:font-bold
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-3 prose-h2:border-b prose-h2:border-gray-200 dark:prose-h2:border-white/10
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-gray-800 dark:prose-h3:text-zinc-200
            prose-p:text-gray-600 dark:prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:mb-4
            prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
            prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
            prose-li:text-gray-600 dark:prose-li:text-zinc-300 prose-li:marker:text-emerald-500 prose-li:my-2
            prose-ul:my-6 prose-ol:my-6 prose-ul:pl-6 prose-ol:pl-6
            prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50 dark:prose-blockquote:bg-emerald-950/30 prose-blockquote:pl-6 prose-blockquote:pr-6 prose-blockquote:py-4 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:my-8
            prose-table:my-8 prose-table:w-full prose-table:border-collapse prose-table:overflow-hidden prose-table:rounded-xl
            prose-th:bg-gray-100 dark:prose-th:bg-zinc-800 prose-th:text-left prose-th:px-4 prose-th:py-3 prose-th:text-sm prose-th:font-semibold prose-th:text-gray-900 dark:prose-th:text-white prose-th:border-b prose-th:border-gray-200 dark:prose-th:border-white/10
            prose-td:px-4 prose-td:py-3 prose-td:text-sm prose-td:border-b prose-td:border-gray-100 dark:prose-td:border-white/5
            prose-pre:bg-gray-900 dark:prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:overflow-x-auto prose-pre:text-sm
            prose-code:text-emerald-600 dark:prose-code:text-emerald-400 prose-code:bg-emerald-50 dark:prose-code:bg-emerald-900/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
            [&_table]:shadow-sm [&_table]:border [&_table]:border-gray-200 dark:[&_table]:border-white/10"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="mt-16 pt-12 border-t border-gray-200 dark:border-white/10">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8">
            {t.blogRelatedPosts}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.slug}
                href={`/blog/${relatedPost.slug}`}
                className="group flex flex-col p-6 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-emerald-500/30 transition-all"
              >
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-2">
                  {relatedPost.category}
                </span>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2 line-clamp-2">
                  {relatedPost.title}
                </h4>
                <p className="text-sm text-gray-500 dark:text-zinc-400 line-clamp-2 mb-4 flex-1">
                  {relatedPost.excerpt}
                </p>
                <div className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-500 font-medium">
                  {t.blogReadArticle}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="mt-16 pt-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {t.blogReadyToOptimize}
            </h3>
            <p className="text-white/80 mb-8 max-w-lg mx-auto text-lg">
              {t.blogStartOptimizing}
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-sm font-semibold text-emerald-600 shadow-lg hover:bg-gray-50 transition-all hover:scale-105"
            >
              {t.blogGetStartedFree}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
