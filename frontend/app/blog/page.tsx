'use client'

import Link from "next/link";
import { getAllPosts, getCategories, getFeaturedPosts } from "@/lib/blog-data";
import { Search, ArrowRight, Sparkles, BookOpen, TrendingUp, Lightbulb } from "lucide-react";
import Navbar from '@/components/landing/sections/Navbar'
import Footer from '@/components/landing/sections/Footer'
import { useTranslations } from "@/lib/i18n";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";

const categoryIcons: Record<string, typeof BookOpen> = {
  'Tutorial': BookOpen,
  'Guía SEO': Lightbulb,
  'Tendencias': TrendingUp,
  'Estrategia AEO': Sparkles,
};

export default function BlogIndexPage() {
  const { t } = useTranslations();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const allPosts = getAllPosts();
  const categories = getCategories();
  const featuredPosts = getFeaturedPosts();

  const filteredPosts = useMemo(() => {
    return allPosts.filter(post => {
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      const matchesSearch = searchQuery === '' ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allPosts, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#050505] text-gray-900 dark:text-white selection:bg-emerald-500/30 transition-colors">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/10 dark:from-emerald-500/10 dark:via-transparent dark:to-emerald-500/5" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              {t.blogLatestPosts}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">
              {t.blogTitle}
            </h1>
            <p className="text-xl text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto mb-8">
              {t.blogDescription}
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.blogSearchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-sm"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-wrap items-center gap-3 mb-12"
        >
          <span className="text-sm font-medium text-gray-500 dark:text-zinc-500">
            {t.blogCategories}:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === 'all'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-white dark:bg-zinc-800/50 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-white/10 hover:border-emerald-500/50'
              }`}
          >
            {t.blogAllCategories}
          </button>
          {categories.map((category) => {
            const Icon = categoryIcons[category] || BookOpen;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === category
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-white dark:bg-zinc-800/50 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-white/10 hover:border-emerald-500/50'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {category}
              </button>
            );
          })}
        </motion.div>

        {/* Featured Post */}
        {selectedCategory === 'all' && searchQuery === '' && featuredPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-12"
          >
            <Link
              href={`/blog/${featuredPosts[0].slug}`}
              className="group block relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 md:p-12 text-white hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    {t.blogFeatured}
                  </span>
                  <span className="text-white/70 text-sm">
                    {featuredPosts[0].date} • {featuredPosts[0].readTime} {t.blogMinRead}
                  </span>
                </div>

                <h2 className="text-2xl md:text-4xl font-bold mb-4 group-hover:translate-x-1 transition-transform">
                  {featuredPosts[0].title}
                </h2>

                <p className="text-white/80 text-lg max-w-2xl mb-6">
                  {featuredPosts[0].excerpt}
                </p>

                <div className="flex items-center gap-2 text-white font-medium">
                  {t.blogReadArticle}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Posts Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => {
              const Icon = categoryIcons[post.category] || BookOpen;

              // Skip featured post in grid if showing all
              if (selectedCategory === 'all' && searchQuery === '' && post.featured) {
                return null;
              }

              return (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col h-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 dark:hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                  >
                    {/* Card Header with Gradient */}
                    <div className="h-40 relative overflow-hidden bg-gradient-to-br from-gray-100 dark:from-zinc-800 to-gray-50 dark:to-zinc-900">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="w-16 h-16 text-emerald-500/20 group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md text-xs font-medium text-gray-900 dark:text-white border border-gray-200 dark:border-white/10">
                          <Icon className="w-3.5 h-3.5 text-emerald-500" />
                          {post.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-zinc-400 mb-4">
                        <span>{post.date}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-600" />
                        <span>{post.readTime} {t.blogMinRead}</span>
                      </div>

                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {post.title}
                      </h2>

                      <p className="text-gray-500 dark:text-zinc-400 text-sm line-clamp-3 mb-6 flex-1">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-500">
                        {t.blogReadArticle}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Search className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-zinc-400 text-lg">
              {t.blogNoResults}
            </p>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
