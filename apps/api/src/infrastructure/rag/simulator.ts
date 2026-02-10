import OpenAI from 'openai';
import { createSupabaseAdmin } from '../database/index';
import { env } from '../../config/index';
import { logger } from '../logging/index';

/**
 * RAG Simulation Service
 * Tests if your own content is "AI-readable" before worrying about external visibility
 *
 * "If your own RAG can't answer correctly using your docs, Perplexity won't either"
 */

/**
 * Document chunk for RAG
 */
interface DocChunk {
    id: string;
    content: string;
    source: string;
    embedding?: number[];
}

/**
 * RAG simulation result
 */
interface RAGResult {
    query: string;
    answer: string;
    sourcesUsed: string[];
    confidence: number;
    tokensUsed: number;
}

/**
 * RAG Simulation Service
 */
export class RAGSimulator {
    private client: OpenAI | null;
    private readonly embeddingModel = 'text-embedding-3-small';
    private readonly completionModel = 'gpt-4o-mini';

    constructor() {
        const apiKey = env.OPENAI_API_KEY;
        this.client = apiKey ? new OpenAI({ apiKey }) : null;
    }

    /**
     * Generate embedding for a text
     */
    async embed(text: string): Promise<number[]> {
        if (!this.client) throw new Error('OPENAI_API_KEY required');

        const response = await this.client.embeddings.create({
            model: this.embeddingModel,
            input: text,
        });

        return response.data[0]?.embedding ?? [];
    }

    /**
     * Cosine similarity between two vectors
     */
    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += (a[i] ?? 0) * (b[i] ?? 0);
            normA += (a[i] ?? 0) ** 2;
            normB += (b[i] ?? 0) ** 2;
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Simple in-memory vector search
     * In production, use pgvector or a dedicated vector DB
     */
    private findRelevantChunks(
        queryEmbedding: number[],
        chunks: DocChunk[],
        topK: number = 5
    ): DocChunk[] {
        const scored = chunks
            .filter(c => c.embedding)
            .map(chunk => ({
                chunk,
                score: this.cosineSimilarity(queryEmbedding, chunk.embedding!),
            }))
            .sort((a, b) => b.score - a.score);

        return scored.slice(0, topK).map(s => s.chunk);
    }

    /**
     * Simulate RAG: retrieve relevant content and generate answer
     */
    async simulateRAG(
        query: string,
        chunks: DocChunk[]
    ): Promise<RAGResult> {
        if (!this.client) throw new Error('OPENAI_API_KEY required');

        // Step 1: Embed the query
        const queryEmbedding = await this.embed(query);

        // Step 2: Find relevant chunks
        const relevantChunks = this.findRelevantChunks(queryEmbedding, chunks, 5);

        if (relevantChunks.length === 0) {
            return {
                query,
                answer: 'No relevant content found in the knowledge base.',
                sourcesUsed: [],
                confidence: 0,
                tokensUsed: 0,
            };
        }

        // Step 3: Build context
        const context = relevantChunks
            .map(c => `[Source: ${c.source}]\n${c.content}`)
            .join('\n\n---\n\n');

        // Step 4: Generate answer
        const response = await this.client.chat.completions.create({
            model: this.completionModel,
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful assistant. Answer the user's question based ONLY on the provided context. If the context doesn't contain enough information, say so.`,
                },
                {
                    role: 'user',
                    content: `Context:\n${context}\n\nQuestion: ${query}`,
                },
            ],
            temperature: 0.3,
            max_tokens: 500,
        });

        const answer = response.choices[0]?.message?.content ?? 'Unable to generate answer';
        const tokensUsed = response.usage?.total_tokens ?? 0;

        // Step 5: Calculate confidence (simple heuristic)
        const confidence = Math.min(relevantChunks.length / 5, 1) *
            (answer.length > 50 ? 1 : 0.5);

        return {
            query,
            answer,
            sourcesUsed: relevantChunks.map(c => c.source),
            confidence,
            tokensUsed,
        };
    }

    /**
     * Load FAQs from database and convert to chunks
     */
    async loadFAQChunks(entitySlug?: string): Promise<DocChunk[]> {
        const supabase = createSupabaseAdmin();

        let query = supabase
            .from('faq_vectors')
            .select('id, question, answer, category');

        if (entitySlug) {
            const { data: entity } = await supabase
                .from('entities')
                .select('id')
                .eq('slug', entitySlug)
                .single();

            if (entity) {
                query = query.eq('entity_id', entity.id);
            }
        }

        const { data } = await query;

        const chunks: DocChunk[] = [];
        for (const faq of data ?? []) {
            const content = `Q: ${faq.question}\nA: ${faq.answer}`;
            chunks.push({
                id: faq.id,
                content,
                source: faq.category ?? 'FAQ',
            });
        }

        // Generate embeddings for each chunk
        for (const chunk of chunks) {
            try {
                chunk.embedding = await this.embed(chunk.content);
            } catch (err) {
                logger.warn('Failed to embed chunk', { id: chunk.id });
            }
        }

        return chunks;
    }

    /**
     * Load claims from database and convert to chunks
     */
    async loadClaimChunks(entitySlug?: string): Promise<DocChunk[]> {
        const supabase = createSupabaseAdmin();

        let query = supabase
            .from('claims')
            .select('id, claim_text, claim_type, entities!inner(slug)');

        if (entitySlug) {
            query = query.eq('entities.slug', entitySlug);
        }

        const { data } = await query;

        const chunks: DocChunk[] = [];
        for (const claim of data ?? []) {
            chunks.push({
                id: claim.id,
                content: claim.claim_text,
                source: `Claim (${claim.claim_type})`,
            });
        }

        // Generate embeddings
        for (const chunk of chunks) {
            try {
                chunk.embedding = await this.embed(chunk.content);
            } catch (err) {
                logger.warn('Failed to embed chunk', { id: chunk.id });
            }
        }

        return chunks;
    }

    /**
     * Run a RAG quality test with predefined questions
     * Returns a score indicating how well your content answers queries
     */
    async runQualityTest(
        testQueries: string[],
        entitySlug?: string
    ): Promise<{
        score: number;
        results: Array<{ query: string; passed: boolean; answer: string }>;
    }> {
        const faqChunks = await this.loadFAQChunks(entitySlug);
        const claimChunks = await this.loadClaimChunks(entitySlug);
        const allChunks = [...faqChunks, ...claimChunks];

        if (allChunks.length === 0) {
            return {
                score: 0,
                results: testQueries.map(q => ({ query: q, passed: false, answer: 'No content available' })),
            };
        }

        const results: Array<{ query: string; passed: boolean; answer: string }> = [];

        for (const query of testQueries) {
            try {
                const result = await this.simulateRAG(query, allChunks);
                const passed = result.confidence > 0.5 && result.sourcesUsed.length > 0;
                results.push({
                    query,
                    passed,
                    answer: result.answer,
                });
            } catch (err) {
                results.push({
                    query,
                    passed: false,
                    answer: `Error: ${(err as Error).message}`,
                });
            }
        }

        const score = results.filter(r => r.passed).length / results.length;

        return { score, results };
    }
}

/**
 * Singleton instance
 */
let ragSimulator: RAGSimulator | null = null;

export function getRAGSimulator(): RAGSimulator {
    if (!ragSimulator) {
        ragSimulator = new RAGSimulator();
    }
    return ragSimulator;
}
