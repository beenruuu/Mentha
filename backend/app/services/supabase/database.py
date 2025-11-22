from supabase import create_client, Client
from typing import Dict, List, Any, Optional, TypeVar, Generic, Type

from app.core.config import settings

T = TypeVar("T")


class SupabaseDatabaseService(Generic[T]):
    """Service for interacting with Supabase database."""

    def __init__(self, table_name: str, model_class: Type[T]):
        """
        Initialize the Supabase database service.

        Args:
            table_name: The name of the table in Supabase
            model_class: The Pydantic model class for data validation
        """
        self.supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        self.table_name = table_name
        self.model_class = model_class

    async def list(self, filters: Optional[Dict[str, Any]] = None) -> List[T]:
        """List records with optional filtering."""
        query = self.supabase.table(self.table_name).select("*")

        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)

        response = query.execute()

        return [self.model_class(**item) for item in response.data]

    async def get(self, id: str) -> Optional[T]:
        """Get a single record by ID."""
        response = self.supabase.table(self.table_name).select("*").eq("id", id).execute()

        if not response.data:
            return None

        return self.model_class(**response.data[0])

    async def create(self, data: Dict[str, Any]) -> T:
        """Create a new record."""
        response = self.supabase.table(self.table_name).insert(data).execute()

        if not response.data:
            raise ValueError("Failed to create record")

        return self.model_class(**response.data[0])

    async def update(self, id: str, data: Dict[str, Any]) -> T:
        """Update an existing record."""
        response = self.supabase.table(self.table_name).update(data).eq("id", id).execute()

        if not response.data:
            raise ValueError(f"Failed to update record with ID: {id}")

        return self.model_class(**response.data[0])

    async def delete(self, id: str) -> bool:
        """Delete a record by ID."""
        response = self.supabase.table(self.table_name).delete().eq("id", id).execute()

        if not response.data:
            return False

        return True
