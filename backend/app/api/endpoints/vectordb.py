from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List

from app.services.vectordb import QdrantService, get_vector_db_service
from app.services.llm.embedding_service import EmbeddingService, get_embedding_service
from app.services.supabase.auth import SupabaseAuthService, get_auth_service
from app.models.vectordb import DocumentInput, SearchQuery, SearchResult, DocumentUploadResponse, DeleteDocumentsRequest

router = APIRouter()
security = HTTPBearer()


@router.post("/documents", response_model=DocumentUploadResponse)
async def add_documents(
    request: DocumentInput,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: SupabaseAuthService = Depends(get_auth_service),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
    vector_db: QdrantService = Depends(get_vector_db_service),
):
    """Add documents to the vector database."""
    try:
        # Validate user authentication
        await auth_service.get_user(credentials.credentials)

        # Generate embeddings for each document
        all_embeddings = []
        for document in request.documents:
            embedding_response = await embedding_service.create_embedding(text=document.text, model=request.embedding_model)
            all_embeddings.append(embedding_response.embedding)

        # Prepare documents and metadata for storage
        docs = [{"text": doc.text, "title": doc.title} for doc in request.documents]
        metadata = [doc.metadata for doc in request.documents] if all(hasattr(doc, "metadata") for doc in request.documents) else None

        # Add documents to vector database
        doc_ids = await vector_db.add_documents(documents=docs, embeddings=all_embeddings, metadata=metadata)

        return DocumentUploadResponse(document_ids=doc_ids)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to add documents: {str(e)}")


@router.post("/search", response_model=List[SearchResult])
async def search_documents(
    query: SearchQuery,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: SupabaseAuthService = Depends(get_auth_service),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
    vector_db: QdrantService = Depends(get_vector_db_service),
):
    """Search for documents similar to the query."""
    try:
        # Validate user authentication
        await auth_service.get_user(credentials.credentials)

        # Generate embedding for the query
        embedding_response = await embedding_service.create_embedding(text=query.query_text, model=query.embedding_model)

        # Search vector database
        results = await vector_db.search(query_embedding=embedding_response.embedding, limit=query.limit, filter_params=query.filter_metadata)

        return results
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Search failed: {str(e)}")


@router.delete("/documents", status_code=status.HTTP_204_NO_CONTENT)
async def delete_documents(
    request: DeleteDocumentsRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: SupabaseAuthService = Depends(get_auth_service),
    vector_db: QdrantService = Depends(get_vector_db_service),
):
    """Delete documents from the vector database."""
    try:
        # Validate user authentication
        await auth_service.get_user(credentials.credentials)

        # Delete documents
        success = await vector_db.delete(request.document_ids)

        if not success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to delete one or more documents")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Document deletion failed: {str(e)}")
