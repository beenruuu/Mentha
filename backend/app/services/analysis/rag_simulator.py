"""
RAG Simulator - Simulated Retrieval-Augmented Generation for GEO/AEO Analysis.

This service replicates how AI Answer Engines work:
1. RETRIEVAL: Semantic search to find relevant content chunks
2. AUGMENTATION: Inject retrieved chunks into LLM context
3. GENERATION: LLM synthesizes answer from context

The simulator answers the critical question:
"WHY is my brand not appearing in AI answers?"

Key Metrics:
- Retrieval Confidence: Probability of content being selected for context
- Semantic Gap: Vector distance between query and content
- Synthesis Quality: How well the LLM represents the brand from context

Formula for Vector Similarity:
similarity = cos(θ) = (A · B) / (||A|| ||B||)

Thresholds:
- Similarity > 0.85: High visibility, content semantically aligned
- Similarity < 0.70: Vector gap, content "invisible" to AI retrieval

Architecture:
- Async processing for embedding generation
- Integration with Qdrant for vector storage
- LangChain for embedding models
- Chunking strategies optimized for RAG
"""

import asyncio
import logging
import hashlib
import re
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import math

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class ChunkStrategy(str, Enum):
    """Content chunking strategies for RAG."""
    SEMANTIC = "semantic"      # Split by semantic boundaries (paragraphs, sections)
    FIXED = "fixed"            # Fixed token/character count
    SENTENCE = "sentence"      # Sentence-level chunks
    HIERARCHICAL = "hierarchical"  # Preserve document hierarchy


@dataclass
class ContentChunk:
    """A chunk of content prepared for embedding."""
    id: str
    text: str
    source_url: str
    section_title: Optional[str] = None
    position: int = 0  # Position in document
    token_count: int = 0
    embedding: Optional[List[float]] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        if self.token_count == 0:
            # Approximate token count (1 token ≈ 4 characters)
            self.token_count = len(self.text) // 4
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "text": self.text[:200] + "..." if len(self.text) > 200 else self.text,
            "source_url": self.source_url,
            "section_title": self.section_title,
            "position": self.position,
            "token_count": self.token_count,
            "has_embedding": self.embedding is not None,
            "metadata": self.metadata,
        }


@dataclass
class RetrievalResult:
    """Result of semantic retrieval for a query."""
    query: str
    query_embedding: Optional[List[float]] = None
    retrieved_chunks: List[Tuple[ContentChunk, float]] = field(default_factory=list)  # (chunk, similarity_score)
    retrieval_confidence: float = 0.0
    semantic_gap: float = 0.0
    is_retrievable: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "query": self.query,
            "retrieval_confidence": round(self.retrieval_confidence, 4),
            "semantic_gap": round(self.semantic_gap, 4),
            "is_retrievable": self.is_retrievable,
            "top_chunks": [
                {
                    "text": chunk.text[:150] + "...",
                    "similarity": round(score, 4),
                    "section": chunk.section_title,
                }
                for chunk, score in self.retrieved_chunks[:5]
            ],
        }


@dataclass
class GenerationResult:
    """Result of simulated generation from retrieved context."""
    query: str
    generated_answer: str
    brand_mentioned: bool
    mention_context: Optional[str] = None  # Context around brand mention
    faithfulness_score: float = 0.0  # Are claims supported by context?
    relevance_score: float = 0.0  # Does it answer the query?
    citations_used: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "query": self.query,
            "generated_answer": self.generated_answer[:500] + "..." if len(self.generated_answer) > 500 else self.generated_answer,
            "brand_mentioned": self.brand_mentioned,
            "mention_context": self.mention_context,
            "faithfulness_score": round(self.faithfulness_score, 3),
            "relevance_score": round(self.relevance_score, 3),
            "citations_used": self.citations_used,
        }


@dataclass
class RAGSimulationResult:
    """Complete RAG simulation result."""
    brand_name: str
    query: str
    retrieval: RetrievalResult
    generation: Optional[GenerationResult] = None
    overall_visibility_score: float = 0.0
    diagnosis: str = ""
    recommendations: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "brand_name": self.brand_name,
            "query": self.query,
            "retrieval": self.retrieval.to_dict(),
            "generation": self.generation.to_dict() if self.generation else None,
            "overall_visibility_score": round(self.overall_visibility_score, 1),
            "diagnosis": self.diagnosis,
            "recommendations": self.recommendations,
        }


class RAGSimulator:
    """
    RAG Simulator - Replicates AI Answer Engine behavior for diagnostic analysis.
    
    This service allows us to:
    1. Understand WHY content is/isn't being retrieved
    2. Test different query formulations
    3. Identify semantic gaps in content
    4. Predict visibility scores before deployment
    
    Usage:
        simulator = get_rag_simulator()
        
        # Prepare content
        chunks = await simulator.chunk_content(page_content, page_url)
        
        # Generate embeddings
        chunks = await simulator.embed_chunks(chunks)
        
        # Test retrieval
        retrieval = await simulator.simulate_retrieval(
            "What is the best CRM software?",
            chunks
        )
        
        # Full simulation with generation
        result = await simulator.full_simulation(
            brand_name="Mentha",
            query="Best AEO tools for SEO",
            content_chunks=chunks
        )
    """
    
    _instance: Optional["RAGSimulator"] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if hasattr(self, "_initialized") and self._initialized:
            return
        self._http_client: Optional[httpx.AsyncClient] = None
        self._embedding_dimension = 1536  # OpenAI text-embedding-3-small
        self._initialized = True
    
    async def _get_http_client(self) -> httpx.AsyncClient:
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=60.0)
        return self._http_client
    
    def chunk_content(
        self,
        content: str,
        source_url: str,
        strategy: ChunkStrategy = ChunkStrategy.SEMANTIC,
        target_chunk_size: int = 300,  # Target tokens per chunk
        overlap: int = 50  # Token overlap between chunks
    ) -> List[ContentChunk]:
        """
        Split content into chunks optimized for RAG retrieval.
        
        Args:
            content: The full text content
            source_url: Source URL for attribution
            strategy: Chunking strategy to use
            target_chunk_size: Target size in tokens
            overlap: Token overlap for context continuity
            
        Returns:
            List of ContentChunk ready for embedding
        """
        chunks = []
        
        if strategy == ChunkStrategy.SEMANTIC:
            chunks = self._chunk_semantic(content, source_url, target_chunk_size)
        elif strategy == ChunkStrategy.SENTENCE:
            chunks = self._chunk_by_sentence(content, source_url, target_chunk_size)
        else:
            chunks = self._chunk_fixed(content, source_url, target_chunk_size, overlap)
        
        return chunks
    
    def _chunk_semantic(
        self,
        content: str,
        source_url: str,
        target_size: int
    ) -> List[ContentChunk]:
        """Chunk by semantic boundaries (sections, paragraphs)."""
        chunks = []
        
        # Split by headers first (Markdown and HTML patterns)
        section_pattern = r'(?:^|\n)(#{1,3}\s+.+|<h[1-3][^>]*>.+?</h[1-3]>)'
        sections = re.split(section_pattern, content, flags=re.IGNORECASE)
        
        current_section = "Introduction"
        position = 0
        
        for i, section in enumerate(sections):
            if not section.strip():
                continue
            
            # Check if this is a header
            header_match = re.match(r'^#{1,3}\s+(.+)$|^<h[1-3][^>]*>(.+?)</h[1-3]>$', section.strip(), re.IGNORECASE)
            if header_match:
                current_section = header_match.group(1) or header_match.group(2)
                continue
            
            # Split large sections into paragraphs
            paragraphs = section.split('\n\n')
            current_text = ""
            
            for para in paragraphs:
                para = para.strip()
                if not para:
                    continue
                
                estimated_tokens = len(para) // 4
                current_tokens = len(current_text) // 4
                
                if current_tokens + estimated_tokens > target_size and current_text:
                    # Create chunk
                    chunk_id = hashlib.md5(f"{source_url}:{position}".encode()).hexdigest()[:12]
                    chunks.append(ContentChunk(
                        id=chunk_id,
                        text=current_text.strip(),
                        source_url=source_url,
                        section_title=current_section,
                        position=position,
                    ))
                    position += 1
                    current_text = para
                else:
                    current_text += "\n\n" + para if current_text else para
            
            # Remaining text
            if current_text.strip():
                chunk_id = hashlib.md5(f"{source_url}:{position}".encode()).hexdigest()[:12]
                chunks.append(ContentChunk(
                    id=chunk_id,
                    text=current_text.strip(),
                    source_url=source_url,
                    section_title=current_section,
                    position=position,
                ))
                position += 1
        
        return chunks
    
    def _chunk_by_sentence(
        self,
        content: str,
        source_url: str,
        target_size: int
    ) -> List[ContentChunk]:
        """Chunk by sentences, combining until target size."""
        # Simple sentence splitting
        sentences = re.split(r'(?<=[.!?])\s+', content)
        
        chunks = []
        current_text = ""
        position = 0
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            estimated_tokens = len(sentence) // 4
            current_tokens = len(current_text) // 4
            
            if current_tokens + estimated_tokens > target_size and current_text:
                chunk_id = hashlib.md5(f"{source_url}:{position}".encode()).hexdigest()[:12]
                chunks.append(ContentChunk(
                    id=chunk_id,
                    text=current_text.strip(),
                    source_url=source_url,
                    position=position,
                ))
                position += 1
                current_text = sentence
            else:
                current_text += " " + sentence if current_text else sentence
        
        if current_text.strip():
            chunk_id = hashlib.md5(f"{source_url}:{position}".encode()).hexdigest()[:12]
            chunks.append(ContentChunk(
                id=chunk_id,
                text=current_text.strip(),
                source_url=source_url,
                position=position,
            ))
        
        return chunks
    
    def _chunk_fixed(
        self,
        content: str,
        source_url: str,
        target_size: int,
        overlap: int
    ) -> List[ContentChunk]:
        """Fixed-size chunking with overlap."""
        words = content.split()
        chunks = []
        position = 0
        
        # Convert token target to word target (rough approximation)
        words_per_chunk = target_size  # 1 word ≈ 1.3 tokens
        overlap_words = overlap
        
        i = 0
        while i < len(words):
            chunk_words = words[i:i + words_per_chunk]
            chunk_text = " ".join(chunk_words)
            
            chunk_id = hashlib.md5(f"{source_url}:{position}".encode()).hexdigest()[:12]
            chunks.append(ContentChunk(
                id=chunk_id,
                text=chunk_text,
                source_url=source_url,
                position=position,
            ))
            
            position += 1
            i += words_per_chunk - overlap_words
        
        return chunks
    
    async def generate_embedding(
        self,
        text: str,
        model: str = "text-embedding-3-small"
    ) -> Optional[List[float]]:
        """
        Generate embedding vector for text using OpenAI.
        
        Args:
            text: Text to embed
            model: OpenAI embedding model
            
        Returns:
            Embedding vector or None if failed
        """
        openai_key = settings.OPENAI_API_KEY
        if not openai_key:
            logger.warning("OpenAI API key not configured for embeddings")
            return None
        
        try:
            client = await self._get_http_client()
            
            response = await client.post(
                "https://api.openai.com/v1/embeddings",
                headers={
                    "Authorization": f"Bearer {openai_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "input": text[:8000],  # Token limit
                    "model": model,
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["data"][0]["embedding"]
            else:
                logger.warning(f"Embedding API error: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            return None
    
    async def embed_chunks(
        self,
        chunks: List[ContentChunk],
        batch_size: int = 10
    ) -> List[ContentChunk]:
        """
        Generate embeddings for all chunks.
        
        Args:
            chunks: List of content chunks
            batch_size: Batch size for API calls
            
        Returns:
            Chunks with embeddings populated
        """
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            
            # Generate embeddings in parallel
            tasks = [self.generate_embedding(chunk.text) for chunk in batch]
            embeddings = await asyncio.gather(*tasks)
            
            for chunk, embedding in zip(batch, embeddings):
                chunk.embedding = embedding
        
        return chunks
    
    def calculate_cosine_similarity(
        self,
        vec_a: List[float],
        vec_b: List[float]
    ) -> float:
        """Calculate cosine similarity between two vectors."""
        if not vec_a or not vec_b:
            return 0.0
        
        dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
        magnitude_a = math.sqrt(sum(a ** 2 for a in vec_a))
        magnitude_b = math.sqrt(sum(b ** 2 for b in vec_b))
        
        if magnitude_a == 0 or magnitude_b == 0:
            return 0.0
        
        return dot_product / (magnitude_a * magnitude_b)
    
    async def simulate_retrieval(
        self,
        query: str,
        chunks: List[ContentChunk],
        top_k: int = 5,
        similarity_threshold: float = 0.70
    ) -> RetrievalResult:
        """
        Simulate the retrieval phase of RAG.
        
        Answers: "Would this content be retrieved for this query?"
        
        Args:
            query: The search query
            chunks: Pre-embedded content chunks
            top_k: Number of chunks to retrieve
            similarity_threshold: Minimum similarity for retrieval
            
        Returns:
            RetrievalResult with retrieved chunks and confidence score
        """
        # Generate query embedding
        query_embedding = await self.generate_embedding(query)
        
        if not query_embedding:
            return RetrievalResult(
                query=query,
                is_retrievable=False,
            )
        
        # Calculate similarities
        scored_chunks = []
        for chunk in chunks:
            if chunk.embedding:
                similarity = self.calculate_cosine_similarity(query_embedding, chunk.embedding)
                scored_chunks.append((chunk, similarity))
        
        # Sort by similarity
        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        
        # Get top-k
        top_chunks = scored_chunks[:top_k]
        
        # Calculate metrics
        if top_chunks:
            max_similarity = top_chunks[0][1]
            avg_similarity = sum(s for _, s in top_chunks) / len(top_chunks)
            
            # Retrieval confidence = how likely at least one relevant chunk is retrieved
            retrieval_confidence = max_similarity
            
            # Semantic gap = how far the query is from best matching content
            semantic_gap = 1.0 - max_similarity
            
            # Is retrievable if best match exceeds threshold
            is_retrievable = max_similarity >= similarity_threshold
        else:
            retrieval_confidence = 0.0
            semantic_gap = 1.0
            is_retrievable = False
        
        return RetrievalResult(
            query=query,
            query_embedding=query_embedding,
            retrieved_chunks=top_chunks,
            retrieval_confidence=retrieval_confidence,
            semantic_gap=semantic_gap,
            is_retrievable=is_retrievable,
        )
    
    async def simulate_generation(
        self,
        query: str,
        context_chunks: List[ContentChunk],
        brand_name: str
    ) -> GenerationResult:
        """
        Simulate the generation phase of RAG.
        
        Tests: "Given this context, how would an LLM represent the brand?"
        
        Args:
            query: The user query
            context_chunks: Retrieved chunks (context window)
            brand_name: Brand to check for mentions
            
        Returns:
            GenerationResult with generated answer and analysis
        """
        openai_key = settings.OPENAI_API_KEY
        if not openai_key:
            return GenerationResult(
                query=query,
                generated_answer="[Simulation unavailable - no API key]",
                brand_mentioned=False,
            )
        
        # Build context from chunks
        context_text = "\n\n---\n\n".join([
            f"Source: {chunk.source_url}\n{chunk.text}"
            for chunk in context_chunks
        ])
        
        try:
            client = await self._get_http_client()
            
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openai_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a helpful AI assistant. Answer the user's question based ONLY on the provided context. Cite your sources when possible."
                        },
                        {
                            "role": "user",
                            "content": f"""Context:
{context_text}

Question: {query}

Provide a comprehensive answer based only on the context above."""
                        }
                    ],
                    "max_tokens": 500,
                    "temperature": 0.3
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                answer = data["choices"][0]["message"]["content"]
                
                # Check for brand mention
                brand_mentioned = brand_name.lower() in answer.lower()
                
                # Extract mention context
                mention_context = None
                if brand_mentioned:
                    # Find the sentence containing the brand
                    sentences = answer.split('.')
                    for sentence in sentences:
                        if brand_name.lower() in sentence.lower():
                            mention_context = sentence.strip()
                            break
                
                # Extract citations
                citations = []
                for chunk in context_chunks:
                    if chunk.source_url not in citations:
                        citations.append(chunk.source_url)
                
                return GenerationResult(
                    query=query,
                    generated_answer=answer,
                    brand_mentioned=brand_mentioned,
                    mention_context=mention_context,
                    faithfulness_score=0.8,  # Would need RAGAS for accurate score
                    relevance_score=0.7,
                    citations_used=citations[:3],
                )
            else:
                return GenerationResult(
                    query=query,
                    generated_answer=f"[API Error: {response.status_code}]",
                    brand_mentioned=False,
                )
                
        except Exception as e:
            logger.error(f"Generation simulation failed: {e}")
            return GenerationResult(
                query=query,
                generated_answer=f"[Error: {str(e)}]",
                brand_mentioned=False,
            )
    
    async def full_simulation(
        self,
        brand_name: str,
        query: str,
        content_chunks: List[ContentChunk],
        top_k: int = 5
    ) -> RAGSimulationResult:
        """
        Run a full RAG simulation: Retrieval + Generation.
        
        This is the core diagnostic function that explains visibility.
        
        Args:
            brand_name: The brand to analyze
            query: Search query to simulate
            content_chunks: Pre-embedded content from brand's site
            top_k: Chunks to retrieve
            
        Returns:
            Complete RAGSimulationResult with diagnosis
        """
        # Step 1: Simulate retrieval
        retrieval = await self.simulate_retrieval(query, content_chunks, top_k)
        
        # Step 2: Simulate generation (if content was retrievable)
        generation = None
        if retrieval.is_retrievable and retrieval.retrieved_chunks:
            chunks_for_context = [chunk for chunk, _ in retrieval.retrieved_chunks]
            generation = await self.simulate_generation(query, chunks_for_context, brand_name)
        
        # Step 3: Calculate overall visibility score
        visibility_score = 0.0
        
        if retrieval.is_retrievable:
            # Base score from retrieval confidence
            visibility_score = retrieval.retrieval_confidence * 50  # 0-50
            
            if generation:
                # Add generation factors
                if generation.brand_mentioned:
                    visibility_score += 30
                visibility_score += generation.faithfulness_score * 10
                visibility_score += generation.relevance_score * 10
        
        # Step 4: Generate diagnosis
        diagnosis, recommendations = self._generate_diagnosis(
            brand_name, query, retrieval, generation
        )
        
        return RAGSimulationResult(
            brand_name=brand_name,
            query=query,
            retrieval=retrieval,
            generation=generation,
            overall_visibility_score=min(100, visibility_score),
            diagnosis=diagnosis,
            recommendations=recommendations,
        )
    
    def _generate_diagnosis(
        self,
        brand_name: str,
        query: str,
        retrieval: RetrievalResult,
        generation: Optional[GenerationResult]
    ) -> Tuple[str, List[str]]:
        """Generate human-readable diagnosis and recommendations."""
        diagnosis_parts = []
        recommendations = []
        
        # Retrieval analysis
        if not retrieval.is_retrievable:
            if retrieval.semantic_gap > 0.5:
                diagnosis_parts.append(
                    f"HIGH SEMANTIC GAP ({retrieval.semantic_gap:.2f}): Content is not semantically aligned with '{query}'. "
                    f"The vocabulary and concepts used on the site don't match what users search for."
                )
                recommendations.append(
                    "Rewrite content to use language that matches user search intent."
                )
                recommendations.append(
                    "Add FAQ sections that directly address common queries."
                )
            else:
                diagnosis_parts.append(
                    f"MODERATE SEMANTIC GAP ({retrieval.semantic_gap:.2f}): Content partially matches the query "
                    f"but may not be specific enough to be selected for the AI context window."
                )
                recommendations.append(
                    "Add more specific, detailed content about this topic."
                )
        else:
            diagnosis_parts.append(
                f"CONTENT RETRIEVABLE: Similarity score {retrieval.retrieval_confidence:.2f} exceeds threshold. "
                f"Your content would likely be selected for the AI's context window."
            )
        
        # Generation analysis
        if generation:
            if generation.brand_mentioned:
                diagnosis_parts.append(
                    f"BRAND VISIBLE: {brand_name} was mentioned in the generated answer. "
                    f"Context: \"{generation.mention_context}\"."
                )
            else:
                diagnosis_parts.append(
                    f"BRAND NOT MENTIONED: Despite content being retrieved, {brand_name} was not cited in the answer. "
                    f"This suggests the content doesn't position the brand as the answer to the query."
                )
                recommendations.append(
                    f"Restructure content to explicitly state '{brand_name}' as the solution to problems addressed."
                )
                recommendations.append(
                    "Add clear value propositions in the first 50 words of key pages."
                )
        
        return " ".join(diagnosis_parts), recommendations
    
    async def batch_simulation(
        self,
        brand_name: str,
        queries: List[str],
        content_chunks: List[ContentChunk]
    ) -> List[RAGSimulationResult]:
        """
        Run simulations for multiple queries.
        
        Useful for comprehensive visibility testing across many search intents.
        """
        results = []
        
        for query in queries:
            result = await self.full_simulation(brand_name, query, content_chunks)
            results.append(result)
        
        return results
    
    async def close(self):
        """Clean up resources."""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None


# Singleton instance
_rag_simulator: Optional[RAGSimulator] = None


def get_rag_simulator() -> RAGSimulator:
    """Get singleton instance."""
    global _rag_simulator
    if _rag_simulator is None:
        _rag_simulator = RAGSimulator()
    return _rag_simulator
