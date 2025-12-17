"""
Entity Tracking Service - Track individual entities (products, services, people) in AI responses.

Goes beyond brand-level tracking to monitor specific:
- Products
- Services  
- People (CEO, founders)
- Features
"""

import asyncio
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
import httpx

from app.core.config import settings

import logging
logger = logging.getLogger(__name__)


class EntityTrackingService:
    """
    Track visibility of specific entities within a brand's ecosystem.
    
    Instead of just tracking "TechVerde" as a brand, track:
    - TechVerde Cloud Platform
    - TechVerde Analytics
    - CEO Juan García
    - etc.
    """
    
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.anthropic_key = settings.ANTHROPIC_API_KEY
        
    async def track_entities(
        self,
        brand_name: str,
        entities: List[Dict[str, str]],
        models: List[str] = None
    ) -> Dict[str, Any]:
        """
        Track visibility of specific entities in AI responses.
        
        Args:
            brand_name: Parent brand name
            entities: List of entities to track, each with:
                - name: Entity name
                - type: 'product', 'service', 'person', 'feature'
                - description: Optional description
            models: AI models to query (default: openai, anthropic)
            
        Returns:
            Entity tracking results with per-entity visibility
        """
        logger.info(f"[ENTITY] Tracking {len(entities)} entities for {brand_name}")
        
        models = models or ["openai", "anthropic"]
        
        results = {
            "brand_name": brand_name,
            "tracked_at": datetime.utcnow().isoformat() + "Z",
            "total_entities": len(entities),
            "entities": [],
            "summary": {
                "total_mentions": 0,
                "by_type": {},
                "by_model": {}
            }
        }
        
        # Generate queries that should elicit entity mentions
        for entity in entities:
            entity_result = await self._track_single_entity(
                brand_name, entity, models
            )
            results["entities"].append(entity_result)
            
            # Update summary
            results["summary"]["total_mentions"] += entity_result["mention_count"]
            
            etype = entity.get("type", "unknown")
            if etype not in results["summary"]["by_type"]:
                results["summary"]["by_type"][etype] = {"count": 0, "visibility": 0}
            results["summary"]["by_type"][etype]["count"] += entity_result["mention_count"]
        
        # Calculate visibility percentages
        for etype in results["summary"]["by_type"]:
            type_entities = [e for e in results["entities"] if e.get("type") == etype]
            if type_entities:
                avg_visibility = sum(e["visibility_rate"] for e in type_entities) / len(type_entities)
                results["summary"]["by_type"][etype]["visibility"] = round(avg_visibility, 1)
        
        return results
    
    async def _track_single_entity(
        self,
        brand_name: str,
        entity: Dict[str, str],
        models: List[str]
    ) -> Dict[str, Any]:
        """Track a single entity across AI models."""
        entity_name = entity.get("name", "")
        entity_type = entity.get("type", "unknown")
        
        result = {
            "name": entity_name,
            "type": entity_type,
            "mention_count": 0,
            "visibility_rate": 0.0,
            "by_model": {},
            "contexts": []
        }
        
        # Queries designed to elicit specific entity mentions
        queries = self._generate_entity_queries(brand_name, entity)
        total_queries = 0
        total_mentions = 0
        
        for model in models:
            model_result = {
                "queries": 0,
                "mentions": 0,
                "contexts": []
            }
            
            for query in queries[:3]:  # Limit queries
                response = await self._query_model(model, query)
                if response:
                    total_queries += 1
                    model_result["queries"] += 1
                    
                    # Check if entity is mentioned
                    if self._is_entity_mentioned(response, entity_name, brand_name):
                        total_mentions += 1
                        model_result["mentions"] += 1
                        
                        # Extract context
                        context = self._extract_entity_context(response, entity_name)
                        if context:
                            model_result["contexts"].append({
                                "query": query,
                                "context": context
                            })
            
            result["by_model"][model] = model_result
        
        result["mention_count"] = total_mentions
        if total_queries > 0:
            result["visibility_rate"] = round((total_mentions / total_queries) * 100, 1)
        
        return result
    
    def _generate_entity_queries(
        self,
        brand_name: str,
        entity: Dict[str, str]
    ) -> List[str]:
        """Generate queries to test entity visibility."""
        entity_name = entity.get("name", "")
        entity_type = entity.get("type", "unknown")
        
        base_queries = []
        
        if entity_type == "product":
            base_queries = [
                f"What products does {brand_name} offer?",
                f"Tell me about {entity_name}",
                f"What are the main features of {brand_name}'s products?",
                f"Compare {brand_name}'s product offerings",
            ]
        elif entity_type == "service":
            base_queries = [
                f"What services does {brand_name} provide?",
                f"Describe {brand_name}'s {entity_name} service",
                f"What consulting or services does {brand_name} offer?",
            ]
        elif entity_type == "person":
            base_queries = [
                f"Who leads {brand_name}?",
                f"Who is {entity_name}?",
                f"Tell me about the leadership at {brand_name}",
                f"Who founded {brand_name}?",
            ]
        elif entity_type == "feature":
            base_queries = [
                f"What features does {brand_name}'s product have?",
                f"What is {entity_name} in {brand_name}?",
                f"Key capabilities of {brand_name}",
            ]
        else:
            base_queries = [
                f"What do you know about {entity_name}?",
                f"Tell me about {brand_name} and {entity_name}",
            ]
        
        return base_queries
    
    async def _query_model(self, model: str, query: str) -> Optional[str]:
        """Query a specific AI model."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                if model == "openai" and self.openai_key:
                    response = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {self.openai_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "gpt-3.5-turbo",
                            "messages": [{"role": "user", "content": query}],
                            "max_tokens": 300
                        }
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        return data["choices"][0]["message"]["content"]
                        
                elif model == "anthropic" and self.anthropic_key:
                    response = await client.post(
                        "https://api.anthropic.com/v1/messages",
                        headers={
                            "x-api-key": self.anthropic_key,
                            "Content-Type": "application/json",
                            "anthropic-version": "2023-06-01"
                        },
                        json={
                            "model": "claude-3-haiku-20240307",
                            "max_tokens": 300,
                            "messages": [{"role": "user", "content": query}]
                        }
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        content = ""
                        for block in data.get("content", []):
                            if block.get("type") == "text":
                                content += block.get("text", "")
                        return content
                        
        except Exception as e:
            logger.warning(f"Query to {model} failed: {e}")
        
        return None
    
    def _is_entity_mentioned(
        self,
        text: str,
        entity_name: str,
        brand_name: str
    ) -> bool:
        """Check if entity is mentioned in context of the brand."""
        text_lower = text.lower()
        entity_lower = entity_name.lower()
        brand_lower = brand_name.lower()
        
        # Entity must be mentioned
        if entity_lower not in text_lower:
            return False
        
        # For products/services, should be near brand mention
        # For people, just the name is enough
        return True
    
    def _extract_entity_context(
        self,
        text: str,
        entity_name: str,
        context_length: int = 100
    ) -> Optional[str]:
        """Extract context around entity mention."""
        text_lower = text.lower()
        entity_lower = entity_name.lower()
        
        idx = text_lower.find(entity_lower)
        if idx == -1:
            return None
        
        start = max(0, idx - context_length)
        end = min(len(text), idx + len(entity_name) + context_length)
        
        snippet = text[start:end].strip()
        if start > 0:
            snippet = "..." + snippet
        if end < len(text):
            snippet = snippet + "..."
        
        return snippet
    
    async def discover_entities(
        self,
        brand_name: str,
        domain: str
    ) -> Dict[str, Any]:
        """
        Automatically discover entities by analyzing the brand's website.
        
        Returns detected products, services, and key people.
        """
        entities = {
            "products": [],
            "services": [],
            "people": [],
            "features": []
        }
        
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                url = f"https://{domain}" if not domain.startswith("http") else domain
                response = await client.get(url, follow_redirects=True)
                
                if response.status_code == 200:
                    # Use AI to extract entities
                    if self.openai_key:
                        entities = await self._extract_entities_with_ai(
                            brand_name, response.text[:8000]
                        )
        except Exception as e:
            logger.warning(f"Entity discovery failed: {e}")
        
        return entities
    
    async def _extract_entities_with_ai(
        self,
        brand_name: str,
        content: str
    ) -> Dict[str, List[str]]:
        """Use AI to extract entities from website content."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openai_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [{
                            "role": "user",
                            "content": f"""Analyze this website content for "{brand_name}" and extract:
1. Products (named products or tools)
2. Services (consulting, support, etc.)
3. People (CEO, founders, key team members)
4. Features (key capabilities)

Return ONLY valid JSON:
{{
    "products": ["Product 1", "Product 2"],
    "services": ["Service 1"],
    "people": ["John Doe - CEO"],
    "features": ["Feature 1"]
}}

Content:
{content[:5000]}"""
                        }],
                        "max_tokens": 500,
                        "temperature": 0
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    # Extract JSON
                    import json
                    json_match = re.search(r'\{[^{}]*\}', content, re.DOTALL)
                    if json_match:
                        return json.loads(json_match.group())
                        
        except Exception as e:
            logger.warning(f"AI entity extraction failed: {e}")
        
        return {"products": [], "services": [], "people": [], "features": []}


# Singleton
_entity_service: Optional[EntityTrackingService] = None

def get_entity_tracking_service() -> EntityTrackingService:
    """Get singleton instance."""
    global _entity_service
    if _entity_service is None:
        _entity_service = EntityTrackingService()
    return _entity_service
