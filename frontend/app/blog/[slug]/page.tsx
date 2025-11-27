import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/blog-data";
import Navbar from '@/components/landing/sections/Navbar'
import Footer from '@/components/landing/sections/Footer'
import BlogPostContent from './blog-post-content'

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
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
      <Navbar />
      <main className="pt-32 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <BlogPostContent post={post} />
      </main>
      
      <Footer />
    </div>
  );
}
