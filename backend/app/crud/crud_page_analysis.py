from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from supabase import Client
from app.core.config import settings
from app.models.page_analysis import PageAnalysisResponse, PageAnalysisStatus

class CRUDPageAnalysis:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
        self.table = "page_analysis"

    async def create(self, obj_in: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new page analysis record."""
        # Ensure dict format for JSONB columns
        data = obj_in.copy()
        
        # Remove None values to let DB defaults handle them
        data = {k: v for k, v in data.items() if v is not None}
        
        result = self.supabase.table(self.table).insert(data).execute()
        return result.data[0] if result.data else None

    async def get(self, id: UUID) -> Optional[Dict[str, Any]]:
        """Get a page analysis by ID."""
        result = self.supabase.table(self.table).select("*").eq("id", str(id)).execute()
        return result.data[0] if result.data else None

    async def get_by_url(self, url: str, user_id: UUID) -> Optional[Dict[str, Any]]:
        """Get the latest analysis for a URL and user."""
        result = self.supabase.table(self.table)\
            .select("*")\
            .eq("url", url)\
            .eq("user_id", str(user_id))\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
        return result.data[0] if result.data else None

    async def update(self, id: UUID, obj_in: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a page analysis record."""
        data = obj_in.copy()
        data["updated_at"] = datetime.utcnow().isoformat()
        
        result = self.supabase.table(self.table).update(data).eq("id", str(id)).execute()
        return result.data[0] if result.data else None

    async def delete(self, id: UUID) -> bool:
        """Delete a page analysis record."""
        result = self.supabase.table(self.table).delete().eq("id", str(id)).execute()
        return len(result.data) > 0

    async def get_multi_by_user(
        self, 
        user_id: UUID, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get multiple analyses for a user."""
        result = self.supabase.table(self.table)\
            .select("*")\
            .eq("user_id", str(user_id))\
            .order("created_at", desc=True)\
            .range(skip, skip + limit - 1)\
            .execute()
        return result.data
