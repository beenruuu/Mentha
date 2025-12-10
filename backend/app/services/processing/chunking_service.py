import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class TextChunk:
    content: str
    metadata: Dict[str, Any]
    token_count: int

class ChunkingService:
    """
    Smart Semantic Chunking Service.
    Splits content based on semantic boundaries (headings, paragraphs) rather than just character counts.
    Optimized for AEO to keep 'Question + Answer' pairs together.
    """

    def __init__(self, min_tokens: int = 50, max_tokens: int = 1000):
        self.min_tokens = min_tokens
        self.max_tokens = max_tokens

    def chunk_content(self, text: str, metadata: Dict[str, Any] = None) -> List[TextChunk]:
        """
        Intelligently chunk text by respecting Markdown structure.
        """
        if not text:
            return []
        
        metadata = metadata or {}
        chunks = []
        
        # 1. Split by Headers (H1, H2, H3) to keep sections together
        sections = re.split(r'(^#{1,3} .*$)', text, flags=re.MULTILINE)
        
        current_chunk_text = ""
        current_header = "General"
        
        for segment in sections:
            segment = segment.strip()
            if not segment:
                continue
                
            # If it's a header, update context but don't start chunk yet if previous is empty
            if re.match(r'^#{1,3} ', segment):
                # If we have accumulated text, save it before starting new section
                if current_chunk_text:
                    self._add_chunk(chunks, current_chunk_text, current_header, metadata)
                    current_chunk_text = ""
                current_header = segment.strip('#').strip()
                # Include header in the next chunk as context
                current_chunk_text = f"{segment}\n"
            else:
                # Append text to current section
                current_chunk_text += segment + "\n"
                
                # Check limits
                if self._estimate_tokens(current_chunk_text) >= self.max_tokens:
                    self._add_chunk(chunks, current_chunk_text, current_header, metadata)
                    current_chunk_text = "" # Start clean, maybe repeat header?
        
        # Add remaining
        if current_chunk_text:
            self._add_chunk(chunks, current_chunk_text, current_header, metadata)
            
        return chunks

    def _add_chunk(self, chunks: List[TextChunk], text: str, header: str, base_metadata: Dict[str, Any]):
        """Helper to finalize and add a chunk."""
        text = text.strip()
        if not text:
            return
            
        token_count = self._estimate_tokens(text)
        
        # Update metadata with local context
        chunk_metadata = base_metadata.copy()
        chunk_metadata.update({
            "section_header": header,
            "token_count": token_count,
            "chunk_type": "semantic_section"
        })
        
        chunks.append(TextChunk(
            content=text,
            metadata=chunk_metadata,
            token_count=token_count
        ))

    def _estimate_tokens(self, text: str) -> int:
        """Rough estimation (1 token ~= 4 chars). Faster than TikToken for this loop."""
        return len(text) // 4

# Singleton
_chunking_service = ChunkingService()

def get_chunking_service() -> ChunkingService:
    return _chunking_service
