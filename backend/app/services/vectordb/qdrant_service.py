from typing import List, Dict, Any, Optional, Union
import uuid
from functools import lru_cache

from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams

from app.core.config import settings


class QdrantService:
    """Service for interacting with Qdrant vector database."""

    def __init__(self, url: str = settings.QDRANT_URL, api_key: str = settings.QDRANT_API_KEY, collection_name: str = settings.QDRANT_COLLECTION_NAME):
        """
        Initialize the Qdrant service.

        Args:
            url: URL of the Qdrant server
            api_key: API key for Qdrant
            collection_name: Name of the collection to use
        """
        if not url:
            # Use local in-memory Qdrant instance if no URL provided
            self.client = QdrantClient(":memory:")
        else:
            self.client = QdrantClient(url=url, api_key=api_key)

        self.collection_name = collection_name

    def ensure_collection_exists(self, vector_size: int = 1536):
        """
        Ensure that the collection exists, creating it if necessary.

        Args:
            vector_size: Size of the embedding vectors
        """
        collections = self.client.get_collections().collections
        collection_names = [collection.name for collection in collections]

        if self.collection_name not in collection_names:
            self.client.create_collection(collection_name=self.collection_name, vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE))

    async def add_documents(self, documents: List[Dict[str, Any]], embeddings: List[List[float]], metadata: Optional[List[Dict[str, Any]]] = None) -> List[str]:
        """
        Add documents and their embeddings to the vector database.

        Args:
            documents: List of documents (can be any dictionary with text field)
            embeddings: List of embedding vectors
            metadata: Optional metadata for each document

        Returns:
            List of generated IDs for the documents
        """
        if len(documents) != len(embeddings):
            raise ValueError("Number of documents and embeddings must match")

        if metadata is None:
            metadata = [{} for _ in documents]

        ids = [str(uuid.uuid4()) for _ in documents]

        # Ensure collection exists
        self.ensure_collection_exists(len(embeddings[0]))

        # Add points to collection
        points = [models.PointStruct(id=ids[i], vector=embeddings[i], payload={"document": documents[i], **metadata[i]}) for i in range(len(documents))]

        self.client.upsert(collection_name=self.collection_name, points=points)

        return ids

    async def search(self, query_embedding: List[float], limit: int = 10, filter_params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Search for documents similar to the query embedding.

        Args:
            query_embedding: Embedding vector of the query
            limit: Maximum number of results to return
            filter_params: Optional filter parameters

        Returns:
            List of matching documents with scores
        """
        # Ensure collection exists
        self.ensure_collection_exists(len(query_embedding))

        # Create filter if provided
        filter_condition = None
        if filter_params:
            filter_condition = models.Filter(
                must=[models.FieldCondition(key=key, match=models.MatchValue(value=value)) for key, value in filter_params.items()]
            )

        # Perform search
        search_result = self.client.search(collection_name=self.collection_name, query_vector=query_embedding, limit=limit, query_filter=filter_condition)

        # Format results
        results = []
        for scored_point in search_result:
            payload = scored_point.payload
            document = payload.pop("document") if "document" in payload else {}

            results.append({"id": scored_point.id, "score": scored_point.score, "document": document, "metadata": payload})

        return results

    async def delete(self, ids: Union[str, List[str]]) -> bool:
        """
        Delete documents from the vector database.

        Args:
            ids: ID or list of IDs to delete

        Returns:
            True if deletion was successful
        """
        if isinstance(ids, str):
            ids = [ids]

        try:
            self.client.delete(collection_name=self.collection_name, points_selector=models.PointIdsList(points=ids))
            return True
        except Exception:
            return False


@lru_cache()
def get_vector_db_service() -> QdrantService:
    """Dependency to get a Vector DB service."""
    return QdrantService()
