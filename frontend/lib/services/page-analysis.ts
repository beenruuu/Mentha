import { fetchAPI } from '@/lib/api-client';

// Page Metadata
export interface PageMetadata {
  title: string;
  description: string;
  author: string;
  keywords: string;
  canonical: string;
  robots: string;
}

// Content Analysis
export interface ContentAnalysis {
  word_count: number;
  sentence_count: number;
  avg_words_per_sentence: number;
  content_length: number;
}

// AEO Signals
export interface AEOSignals {
  has_faq_structure: boolean;
  has_how_to_structure: boolean;
  has_article_structure: boolean;
  question_content_ratio: number;
  has_clear_entity_references: boolean;
  conversational_readiness_score: number;
}

// Link Info
export interface LinkInfo {
  href: string;
  text: string;
  title: string;
  is_external: boolean;
  nofollow: boolean;
}

// Image Info
export interface ImageInfo {
  src: string;
  alt: string;
  has_alt: boolean;
}

// Page Analysis Response
export interface PageAnalysisResponse {
  id?: string;
  user_id?: string;
  brand_id?: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata?: PageMetadata;
  content_analysis?: ContentAnalysis;
  seo_warnings: string[];
  headings: Record<string, string[]>;
  additional_tags: Record<string, any>;
  links: LinkInfo[];
  images: ImageInfo[];
  keywords: Record<string, number>;
  bigrams: Record<string, number>;
  trigrams: Record<string, number>;
  aeo_signals?: AEOSignals;
  content_hash?: string;
  created_at?: string;
  llm_analysis?: LLMAnalysisResponse;
  error?: string;
}

// N-E-E-A-T Scores
export interface NEEATScores {
  notability: number;
  experience: number;
  expertise: number;
  authority: number;
  trust: number;
  transparency: number;
}

// Entity Analysis
export interface EntityAnalysis {
  entity_assessment: string;
  knowledge_panel_readiness: number;
  key_improvements: string[];
}

// Credibility Analysis
export interface CredibilityAnalysis {
  credibility_assessment: string;
  neeat_scores?: NEEATScores;
  trust_signals: string[];
}

// Conversation Analysis
export interface ConversationAnalysis {
  conversation_readiness: string;
  query_patterns: string[];
  engagement_score: number;
  gaps: string[];
}

// Platform Presence
export interface PlatformPresence {
  platform_coverage: Record<string, string>;
  visibility_scores?: {
    search_engines: number;
    ai_assistants: number;
    knowledge_graphs: number;
    social: number;
  };
  optimization_opportunities: string[];
}

// LLM Analysis Scores
export interface LLMAnalysisScores {
  entity_score: number;
  credibility_score: number;
  conversation_score: number;
  platform_score: number;
  overall_score: number;
}

// LLM Analysis Response
export interface LLMAnalysisResponse {
  entity_analysis?: EntityAnalysis;
  credibility_analysis?: CredibilityAnalysis;
  conversation_analysis?: ConversationAnalysis;
  platform_presence?: PlatformPresence;
  scores?: LLMAnalysisScores;
  quick_wins: string[];
  strategic_recommendations: string[];
  error?: string;
}

// Website Crawl Keyword
export interface CrawlKeyword {
  word: string;
  count: number;
}

// Website Crawl Response
export interface WebsiteCrawlResponse {
  id?: string;
  user_id?: string;
  brand_id?: string;
  base_url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_pages: number;
  pages: PageAnalysisResponse[];
  keywords: CrawlKeyword[];
  duplicate_pages: string[][];
  errors: string[];
  created_at?: string;
  completed_at?: string;
}

// Request interfaces
export interface PageAnalysisRequest {
  url: string;
  analyze_headings?: boolean;
  analyze_extra_tags?: boolean;
  extract_links?: boolean;
  run_llm_analysis?: boolean;
  llm_provider?: 'openai' | 'anthropic' | 'openrouter';
}

export interface WebsiteCrawlRequest {
  base_url: string;
  sitemap_url?: string;
  max_pages?: number;
  follow_links?: boolean;
  run_llm_analysis?: boolean;
  llm_provider?: 'openai' | 'anthropic' | 'openrouter';
}

// Page Analysis Service
export const pageAnalysisService = {
  /**
   * Analyze a single page for SEO/AEO signals
   */
  analyzePage: async (request: PageAnalysisRequest): Promise<PageAnalysisResponse> => {
    return fetchAPI<PageAnalysisResponse>('/page-analysis/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Get a previously completed page analysis
   */
  getAnalysis: async (analysisId: string): Promise<PageAnalysisResponse> => {
    return fetchAPI<PageAnalysisResponse>(`/page-analysis/analyze/${analysisId}`);
  },

  /**
   * Start a website crawl
   */
  crawlWebsite: async (request: WebsiteCrawlRequest): Promise<WebsiteCrawlResponse> => {
    return fetchAPI<WebsiteCrawlResponse>('/page-analysis/crawl', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Get crawl status and results
   */
  getCrawlStatus: async (crawlId: string): Promise<WebsiteCrawlResponse> => {
    return fetchAPI<WebsiteCrawlResponse>(`/page-analysis/crawl/${crawlId}`);
  },

  /**
   * Run LLM analysis on page data
   */
  runLLMAnalysis: async (
    pageData: Record<string, any>,
    provider: 'openai' | 'anthropic' | 'openrouter' = 'openai'
  ): Promise<LLMAnalysisResponse> => {
    return fetchAPI<LLMAnalysisResponse>(`/page-analysis/llm-analyze?provider=${provider}`, {
      method: 'POST',
      body: JSON.stringify(pageData),
    });
  },

  /**
   * Extract keywords from a URL
   */
  extractKeywords: async (url: string): Promise<{
    url: string;
    keywords: Record<string, number>;
    bigrams: Record<string, number>;
    trigrams: Record<string, number>;
    word_count: number;
  }> => {
    return fetchAPI(`/page-analysis/keywords/extract?url=${encodeURIComponent(url)}`);
  },
};
