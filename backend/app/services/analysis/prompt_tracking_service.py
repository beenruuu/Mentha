"""
Prompt Tracking Service - Monitor specific prompts for brand visibility.

This service allows users to track custom prompts and monitor
how their brand appears in AI responses for those specific queries.
"""

import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
from uuid import UUID

import httpx

from app.core.config import settings


class PromptTrackingService:
    """
    Service to track user-defined prompts across AI models.
    
    Allows users to:
    1. Define specific prompts to monitor
    2. Check brand visibility for each prompt
    3. Track competitor mentions
    4. Historical tracking of results
    """
    
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.anthropic_key = settings.ANTHROPIC_API_KEY
        self.perplexity_key = getattr(settings, 'PERPLEXITY_API_KEY', '')
        
    async def create_tracked_prompt(
        self,
        brand_id: str,
        prompt_text: str,
        category: Optional[str] = None,
        check_frequency: str = "daily"
    ) -> Dict[str, Any]:
        """Create a new tracked prompt for a brand."""
        try:
            from supabase import create_client
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            data = {
                "brand_id": brand_id,
                "prompt_text": prompt_text,
                "category": category,
                "check_frequency": check_frequency,
                "is_active": True
            }
            
            result = supabase.table("tracked_prompts").insert(data).execute()
            
            if result.data:
                return {"success": True, "prompt": result.data[0]}
            return {"success": False, "error": "Failed to create prompt"}
            
        except Exception as e:
            print(f"Failed to create tracked prompt: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_tracked_prompts(
        self,
        brand_id: str,
        active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """Get all tracked prompts for a brand."""
        try:
            from supabase import create_client
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            query = supabase.table("tracked_prompts").select("*").eq("brand_id", brand_id)
            
            if active_only:
                query = query.eq("is_active", True)
            
            result = query.order("created_at", desc=True).execute()
            
            return result.data or []
            
        except Exception as e:
            print(f"Failed to get tracked prompts: {e}")
            return []
    
    async def delete_tracked_prompt(self, prompt_id: str) -> bool:
        """Delete a tracked prompt."""
        try:
            from supabase import create_client
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            result = supabase.table("tracked_prompts").delete().eq("id", prompt_id).execute()
            return bool(result.data)
            
        except Exception as e:
            print(f"Failed to delete tracked prompt: {e}")
            return False
    
    async def update_tracked_prompt(
        self,
        prompt_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update a tracked prompt."""
        try:
            from supabase import create_client
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            # Only allow certain fields to be updated
            allowed_fields = {"prompt_text", "category", "is_active", "check_frequency"}
            filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
            
            result = supabase.table("tracked_prompts").update(
                filtered_updates
            ).eq("id", prompt_id).execute()
            
            if result.data:
                return {"success": True, "prompt": result.data[0]}
            return {"success": False, "error": "Prompt not found"}
            
        except Exception as e:
            print(f"Failed to update tracked prompt: {e}")
            return {"success": False, "error": str(e)}
    
    async def check_prompt(
        self,
        prompt_id: str,
        brand_name: str,
        competitors: List[str] = None,
        models: List[str] = None
    ) -> Dict[str, Any]:
        """
        Check a single prompt across AI models.
        
        Args:
            prompt_id: ID of the tracked prompt
            brand_name: Brand name to look for
            competitors: List of competitor names
            models: List of models to check (default: all available)
            
        Returns:
            Dict with results per model
        """
        try:
            from supabase import create_client
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            # Get the prompt
            prompt_result = supabase.table("tracked_prompts").select("*").eq("id", prompt_id).single().execute()
            
            if not prompt_result.data:
                return {"success": False, "error": "Prompt not found"}
            
            prompt = prompt_result.data
            prompt_text = prompt["prompt_text"]
            
            # Determine which models to check
            if models is None:
                models = []
                if self.openai_key:
                    models.append("openai")
                if self.anthropic_key:
                    models.append("anthropic")
                if self.perplexity_key:
                    models.append("perplexity")
            
            # Run checks in parallel
            tasks = []
            for model in models:
                if model == "openai" and self.openai_key:
                    tasks.append(self._check_openai(prompt_text, brand_name, competitors))
                elif model == "anthropic" and self.anthropic_key:
                    tasks.append(self._check_anthropic(prompt_text, brand_name, competitors))
                elif model == "perplexity" and self.perplexity_key:
                    tasks.append(self._check_perplexity(prompt_text, brand_name, competitors))
            
            if not tasks:
                return {"success": False, "error": "No AI models available"}
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process and store results
            check_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    print(f"Model check failed: {result}")
                    continue
                
                model = models[i]
                result["model"] = model
                check_results.append(result)
                
                # Store result in database
                await self._store_check_result(prompt_id, model, result)
            
            # Update last_checked_at
            supabase.table("tracked_prompts").update({
                "last_checked_at": datetime.utcnow().isoformat()
            }).eq("id", prompt_id).execute()
            
            # Calculate aggregate visibility
            total_mentioned = sum(1 for r in check_results if r.get("brand_mentioned"))
            visibility_rate = (total_mentioned / len(check_results) * 100) if check_results else 0
            
            return {
                "success": True,
                "prompt_id": prompt_id,
                "prompt_text": prompt_text,
                "visibility_rate": round(visibility_rate, 1),
                "models_checked": len(check_results),
                "brand_mentioned_count": total_mentioned,
                "results": check_results,
                "checked_at": datetime.utcnow().isoformat() + "Z"
            }
            
        except Exception as e:
            print(f"Prompt check failed: {e}")
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}
    
    async def _check_openai(
        self,
        prompt_text: str,
        brand_name: str,
        competitors: List[str] = None
    ) -> Dict[str, Any]:
        """Check prompt with OpenAI."""
        result = {
            "brand_mentioned": False,
            "position": None,
            "sentiment": "neutral",
            "sentiment_score": 50,
            "response_snippet": "",
            "competitor_mentions": {}
        }
        
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
                        "messages": [{"role": "user", "content": prompt_text}],
                        "max_tokens": 1000,
                        "temperature": 0.7
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    
                    result["full_response"] = content
                    result["response_snippet"] = content[:300] + "..." if len(content) > 300 else content
                    
                    # Check for brand mention
                    content_lower = content.lower()
                    brand_lower = brand_name.lower()
                    
                    if brand_lower in content_lower:
                        result["brand_mentioned"] = True
                        # Calculate position (1 = first third, 2 = middle, 3 = last third)
                        position = content_lower.find(brand_lower)
                        total_len = len(content)
                        if position < total_len / 3:
                            result["position"] = 1
                        elif position < 2 * total_len / 3:
                            result["position"] = 2
                        else:
                            result["position"] = 3
                        
                        # Quick sentiment check
                        result["sentiment"], result["sentiment_score"] = self._quick_sentiment(content, brand_name)
                    
                    # Check competitor mentions
                    if competitors:
                        for comp in competitors:
                            if comp.lower() in content_lower:
                                result["competitor_mentions"][comp] = content_lower.count(comp.lower())
                                
        except Exception as e:
            print(f"OpenAI check failed: {e}")
            result["error"] = str(e)
        
        return result
    
    async def _check_anthropic(
        self,
        prompt_text: str,
        brand_name: str,
        competitors: List[str] = None
    ) -> Dict[str, Any]:
        """Check prompt with Anthropic."""
        result = {
            "brand_mentioned": False,
            "position": None,
            "sentiment": "neutral",
            "sentiment_score": 50,
            "response_snippet": "",
            "competitor_mentions": {}
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": self.anthropic_key,
                        "Content-Type": "application/json",
                        "anthropic-version": "2023-06-01"
                    },
                    json={
                        "model": "claude-3-haiku-20240307",
                        "max_tokens": 1000,
                        "messages": [{"role": "user", "content": prompt_text}]
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = ""
                    for block in data.get("content", []):
                        if block.get("type") == "text":
                            content += block.get("text", "")
                    
                    result["full_response"] = content
                    result["response_snippet"] = content[:300] + "..." if len(content) > 300 else content
                    
                    content_lower = content.lower()
                    brand_lower = brand_name.lower()
                    
                    if brand_lower in content_lower:
                        result["brand_mentioned"] = True
                        position = content_lower.find(brand_lower)
                        total_len = len(content)
                        if position < total_len / 3:
                            result["position"] = 1
                        elif position < 2 * total_len / 3:
                            result["position"] = 2
                        else:
                            result["position"] = 3
                        
                        result["sentiment"], result["sentiment_score"] = self._quick_sentiment(content, brand_name)
                    
                    if competitors:
                        for comp in competitors:
                            if comp.lower() in content_lower:
                                result["competitor_mentions"][comp] = content_lower.count(comp.lower())
                                
        except Exception as e:
            print(f"Anthropic check failed: {e}")
            result["error"] = str(e)
        
        return result
    
    async def _check_perplexity(
        self,
        prompt_text: str,
        brand_name: str,
        competitors: List[str] = None
    ) -> Dict[str, Any]:
        """Check prompt with Perplexity."""
        result = {
            "brand_mentioned": False,
            "position": None,
            "sentiment": "neutral",
            "sentiment_score": 50,
            "response_snippet": "",
            "competitor_mentions": {},
            "sources": []
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.perplexity.ai/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.perplexity_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama-3.1-sonar-small-128k-online",
                        "messages": [{"role": "user", "content": prompt_text}],
                        "max_tokens": 1000
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    
                    result["full_response"] = content
                    result["response_snippet"] = content[:300] + "..." if len(content) > 300 else content
                    result["sources"] = data.get("citations", [])[:5]
                    
                    content_lower = content.lower()
                    brand_lower = brand_name.lower()
                    
                    if brand_lower in content_lower:
                        result["brand_mentioned"] = True
                        position = content_lower.find(brand_lower)
                        total_len = len(content)
                        if position < total_len / 3:
                            result["position"] = 1
                        elif position < 2 * total_len / 3:
                            result["position"] = 2
                        else:
                            result["position"] = 3
                        
                        result["sentiment"], result["sentiment_score"] = self._quick_sentiment(content, brand_name)
                    
                    if competitors:
                        for comp in competitors:
                            if comp.lower() in content_lower:
                                result["competitor_mentions"][comp] = content_lower.count(comp.lower())
                                
        except Exception as e:
            print(f"Perplexity check failed: {e}")
            result["error"] = str(e)
        
        return result
    
    def _quick_sentiment(self, text: str, brand_name: str) -> tuple:
        """Quick sentiment analysis around brand mention."""
        text_lower = text.lower()
        brand_lower = brand_name.lower()
        
        # Find brand mention and extract context
        idx = text_lower.find(brand_lower)
        if idx == -1:
            return "neutral", 50
        
        start = max(0, idx - 100)
        end = min(len(text), idx + len(brand_name) + 100)
        context = text_lower[start:end]
        
        positive_words = ["best", "great", "excellent", "top", "recommended", "leading", "innovative", "trusted", "reliable"]
        negative_words = ["worst", "bad", "avoid", "poor", "issues", "problems", "unreliable", "slow"]
        
        positive_count = sum(1 for word in positive_words if word in context)
        negative_count = sum(1 for word in negative_words if word in context)
        
        total = positive_count + negative_count
        if total == 0:
            return "neutral", 50
        
        score = int((positive_count / total) * 100)
        
        if score >= 70:
            return "positive", score
        elif score <= 30:
            return "negative", score
        return "neutral", score
    
    async def _store_check_result(
        self,
        prompt_id: str,
        model: str,
        result: Dict[str, Any]
    ) -> bool:
        """Store check result in database."""
        try:
            from supabase import create_client
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            data = {
                "prompt_id": prompt_id,
                "ai_model": model,
                "brand_mentioned": result.get("brand_mentioned", False),
                "position": result.get("position"),
                "sentiment": result.get("sentiment", "neutral"),
                "sentiment_score": result.get("sentiment_score", 50),
                "response_snippet": result.get("response_snippet", ""),
                "full_response": result.get("full_response", ""),
                "competitor_mentions": result.get("competitor_mentions", {}),
                "metadata": {
                    "sources": result.get("sources", [])
                }
            }
            
            supabase.table("prompt_check_results").insert(data).execute()
            return True
            
        except Exception as e:
            print(f"Failed to store check result: {e}")
            return False
    
    async def get_prompt_history(
        self,
        prompt_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get historical check results for a prompt."""
        try:
            from supabase import create_client
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            result = supabase.table("prompt_check_results").select("*").eq(
                "prompt_id", prompt_id
            ).order("checked_at", desc=True).limit(limit).execute()
            
            return result.data or []
            
        except Exception as e:
            print(f"Failed to get prompt history: {e}")
            return []
    
    async def check_all_active_prompts(
        self,
        brand_id: str,
        brand_name: str,
        competitors: List[str] = None
    ) -> Dict[str, Any]:
        """Check all active prompts for a brand."""
        prompts = await self.get_tracked_prompts(brand_id, active_only=True)
        
        results = []
        for prompt in prompts:
            result = await self.check_prompt(
                prompt["id"],
                brand_name,
                competitors
            )
            results.append(result)
        
        # Calculate aggregate stats
        total_prompts = len(results)
        successful = [r for r in results if r.get("success")]
        total_visibility = sum(r.get("visibility_rate", 0) for r in successful)
        avg_visibility = total_visibility / len(successful) if successful else 0
        
        return {
            "total_prompts": total_prompts,
            "checked": len(successful),
            "average_visibility": round(avg_visibility, 1),
            "results": results,
            "checked_at": datetime.utcnow().isoformat() + "Z"
        }


# Singleton instance
_prompt_tracking_service: Optional[PromptTrackingService] = None

def get_prompt_tracking_service() -> PromptTrackingService:
    """Get singleton instance of PromptTrackingService."""
    global _prompt_tracking_service
    if _prompt_tracking_service is None:
        _prompt_tracking_service = PromptTrackingService()
    return _prompt_tracking_service
