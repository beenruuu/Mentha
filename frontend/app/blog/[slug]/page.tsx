import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/blog-data";
import { Navbar as Header } from "@/components/landing";
import FooterSection from "@/components/landing/footer-section";
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
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white selection:bg-emerald-500/30 transition-colors">
      <Header />
      <main className="pt-32 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <BlogPostContent post={post} />
      </main>
      
      <FooterSection />
    </div>
  );
}
