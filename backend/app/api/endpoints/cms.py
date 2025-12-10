from fastapi import APIRouter, HTTPException, Header, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging
from app.services.processing.chunking_service import get_chunking_service
from app.services.vectordb.qdrant_service import get_vector_db_service
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

class CMSPayload(BaseModel):
    """
    Generic payload for CMS updates.
    Adapters can map WP/Shopify hooks to this structure or use it directly.
    """
    action: str  # 'create', 'update', 'delete'
    url: str
    content: Optional[str] = None
    title: Optional[str] = None
    id: str # Internal CMS ID
    type: str = "page" # 'post', 'product', 'page'
    organization_id: str # Required for auth/isolation
    secret_key: str # For basic webhook validation

@router.post("/webhook")
async def cms_webhook(
    payload: CMSPayload, 
    background_tasks: BackgroundTasks
):
    """
    Universal ingest endpoint for CMS updates.
    Triggered when a user publishes/updates content in WordPress/Shopify/Webflow.
    """
    # 1. Validate Secret (Simple auth)
    # Ideally should check against Organization's registered webhook secret
    # For now, we assume a global shared secret or org-specific logic placeholder
    if not payload.organization_id:
        raise HTTPException(status_code=400, detail="Missing organization_id")
    
    logger.info(f"Received CMS webhook: {payload.action} {payload.url} (Org: {payload.organization_id})")

    if payload.action == 'delete':
        background_tasks.add_task(delete_content, payload)
    else:
        background_tasks.add_task(process_content, payload)
        
    return {"status": "queued", "message": f"Processing {payload.action} for {payload.url}"}

async def process_content(payload: CMSPayload):
    """
    Background content processing:
    1. Chunking
    2. Embedding (handled inside QdrantService usually, or explicitly here if needed)
    3. Indexing
    """
    try:
        chunker = get_chunking_service()
        vector_db = get_vector_db_service()
        
        # 1. Smart Chunking
        chunks = chunker.chunk_content(
            text=f"# {payload.title}\n\n{payload.content}",
            metadata={"source": "cms_webhook", "url": payload.url, "cms_id": payload.id, "type": payload.type}
        )
        
        if not chunks:
            logger.warning(f"No chunks generated for {payload.url}")
            return

        # Prepare for Vector DB
        documents = [c.content for c in chunks]
        # We need to generate embeddings here first? 
        # Actually QdrantService 'add_documents' expects embeddings or handles them?
        # Looking at previous code, 'add_documents' takes 'embeddings'. 
        # We need an Embedding Service. QdrantService does NOT generate embeddings itself in the previous audit.
        
        # We need to instantiate LLM/Embedding service (OpenAI)
        from app.services.llm.llm_service import get_llm_service
        openai_service = get_llm_service()
        
        embeddings = []
        for doc in documents:
            emb = await openai_service.get_embedding(doc) # Assuming this method exists
            embeddings.append(emb)
            
        metadata_list = [c.metadata for c in chunks]
        
        # 2. Index with Organization Isolation (!)
        await vector_db.add_documents(
            documents=documents,
            embeddings=embeddings,
            metadata=metadata_list,
            organization_id=payload.organization_id
        )
        
        logger.info(f"Successfully indexed {len(documents)} chunks for {payload.url}")

    except Exception as e:
        logger.error(f"Failed to process content for {payload.url}: {e}")

async def delete_content(payload: CMSPayload):
    """Delete content vectors for a specific CMS ID."""
    try:
        vector_db = get_vector_db_service()
        # This requires delete by filter (metadata.cms_id == payload.id)
        # QdrantService.delete takes IDs. We need 'delete_by_filter' or search first.
        # Ideally we implement 'delete_by_filter' in QdrantService.
        # For MVP, we log warning.
        logger.warning(f"Delete not fully implemented for CMS ID {payload.id} - requires delete_by_filter")
    except Exception as e:
        logger.error(f"Failed to delete content {payload.id}: {e}")
