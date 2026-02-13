from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class SearchProvider(ABC):
    @abstractmethod
    async def search_competitors(self, brand_name: str, industry: str, location: Optional[str] = None) -> List[Dict[str, Any]]:
        """Finds potential competitors for a brand."""
        pass

    @abstractmethod
    async def crawl_url(self, url: str) -> Dict[str, Any]:
        """Extracts content and metadata from a specific URL."""
        pass
