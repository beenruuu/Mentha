
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  category: string;
  readTime: string;
  image: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "what-is-aeo-optimization",
    title: "What is AEO? The Complete Guide to Answer Engine Optimization",
    excerpt: "Discover why AEO is the new SEO. Learn how to optimize your content for AI search engines like ChatGPT, Perplexity, and Google SGE.",
    date: "October 24, 2023",
    author: "Mentha Team",
    category: "AEO Strategy",
    readTime: "5 min read",
    image: "/blog/aeo-guide.jpg",
    content: `
      <h2>The Shift from Search to Answers</h2>
      <p>For two decades, SEO has been about ranking for keywords. You optimize a page, get backlinks, and hope to appear in the top 10 blue links. But the game has changed.</p>
      <p>With the rise of Large Language Models (LLMs) and AI-powered search engines like ChatGPT, Claude, and Perplexity, users aren't just searching for links anymore—they're asking for answers.</p>
      
      <h2>What is Answer Engine Optimization (AEO)?</h2>
      <p>AEO is the art and science of optimizing your digital presence to be cited as the primary source of information by AI models. Unlike SEO, which targets a search engine's index, AEO targets the "knowledge" of an AI.</p>
      
      <h3>Key Differences Between SEO and AEO</h3>
      <ul>
        <li><strong>Target:</strong> SEO targets algorithms; AEO targets LLMs.</li>
        <li><strong>Goal:</strong> SEO wants clicks; AEO wants citations and "share of voice".</li>
        <li><strong>Content:</strong> SEO often encourages fluff; AEO demands concise, factual, and structured data.</li>
      </ul>

      <h2>How to Start with AEO</h2>
      <p>To win in this new era, you need to focus on <strong>Entity Authority</strong>. Ensure that your brand, products, and key concepts are clearly defined in a way that machines can understand. This means using Schema markup, clear definitions, and authoritative content that directly answers user questions.</p>
    `
  },
  {
    slug: "optimizing-for-chatgpt-search",
    title: "How to Optimize Your Brand for ChatGPT Search",
    excerpt: "ChatGPT is becoming a primary search tool for millions. Here are 5 actionable strategies to ensure your brand is recommended.",
    date: "November 2, 2023",
    author: "Mentha Team",
    category: "Practical Guides",
    readTime: "4 min read",
    image: "/blog/chatgpt-search.jpg",
    content: `
      <h2>Why ChatGPT Matters for Your Brand</h2>
      <p>ChatGPT isn't just a chatbot; with its browsing capabilities, it's a real-time answer engine. When a user asks, "What is the best CRM for small business?", you want ChatGPT to say <em>your</em> name.</p>

      <h2>5 Strategies for ChatGPT Visibility</h2>
      <ol>
        <li><strong>Be the Authority:</strong> Publish high-quality whitepapers and data studies. LLMs love citing primary data sources.</li>
        <li><strong>Structure Your Data:</strong> Use clear headings, bullet points, and tables. If an LLM can parse your content easily, it's more likely to use it.</li>
        <li><strong>Brand Co-occurrence:</strong> Get mentioned alongside other industry leaders. LLMs understand concepts by association.</li>
        <li><strong>Clear "About" Pages:</strong> Make sure your "About Us" page clearly defines who you are and what you do. This is often the first place an AI looks to understand an entity.</li>
        <li><strong>Monitor Your Mentions:</strong> Use tools like Mentha to track how often and in what context your brand is being mentioned by AI models.</li>
      </ol>
    `
  },
  {
    slug: "future-of-seo-2024",
    title: "The Future of SEO in 2024: It's All About Context",
    excerpt: "Keywords are dying. Context is king. Explore how semantic search and vector databases are reshaping the digital marketing landscape.",
    date: "November 15, 2023",
    author: "Mentha Team",
    category: "Industry Trends",
    readTime: "6 min read",
    image: "/blog/future-seo.jpg",
    content: `
      <h2>The Death of the Keyword?</h2>
      <p>Not quite, but the "exact match" keyword strategy is fading fast. Modern search engines and AI models use <strong>Vector Search</strong> to understand the <em>meaning</em> behind a query, not just the words.</p>

      <h2>Semantic Search Explained</h2>
      <p>Imagine searching for "apple". A keyword engine looks for the string "a-p-p-l-e". A semantic engine looks at the context: are you talking about fruit, technology, or a record label? In 2024, optimizing for context means creating content that covers a topic holistically.</p>

      <h2>Preparing for the Semantic Web</h2>
      <p>Focus on <strong>Topical Authority</strong>. Don't just write one post about a keyword. Build a cluster of content that covers every angle of a subject. This signals to AI models that you are a true expert in your field.</p>
    `
  }
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return blogPosts;
}
