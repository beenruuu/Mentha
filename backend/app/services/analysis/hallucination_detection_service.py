"""
Hallucination Detection Service - Detect inaccurate claims about brands in AI responses.

This service compares AI-generated claims against known facts to identify:
- Accurate claims (matches known facts)
- Hallucinations (contradicts known facts)  
- Unverified claims (cannot be confirmed)
"""

import asyncio
import json
import re
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from difflib import SequenceMatcher
import httpx

from app.core.config import settings

import logging
logger = logging.getLogger(__name__)


class HallucinationDetectionService:
    """
    Detect hallucinations (false claims) about brands in AI responses.
    
    Hallucination types:
    - Factual: Wrong dates, numbers, locations
    - Attribution: Attributing wrong products/services to brand
    - Fabrication: Completely made up information
    """
    
    # Claim extraction patterns
    CLAIM_PATTERNS = [
        r"(?:was |is |are |were |has been |have been )(?:founded|established|created|started|launched)(?: in| on)? (\d{4})",
        r"(?:founded|established|created)(?: in| on)? (\d{4})",
        r"(?:headquarters|based|located)(?: in| at)? ([A-Z][a-z]+(?: [A-Z][a-z]+)*)",
        r"(?:CEO|founder|founded by|led by|run by) (?:is |was )?([A-Z][a-z]+ [A-Z][a-z]+)",
        r"(?:has|have|with) (?:over |more than |approximately )?(\d+(?:,\d+)*(?:\+)?) (?:employees|workers|staff|team members)",
        r"(?:revenue|sales|worth|valued at) (?:of |is |was )?(?:\$|€|£)?(\d+(?:\.\d+)?)[ ]?(?:million|billion|M|B)",
        r"(?:acquired|bought|purchased)(?: by)? ([A-Z][a-z]+(?: [A-Z][a-z]+)*)",
        r"(?:offers|provides|specializes in|known for) ([^.]+)",
    ]
    
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.anthropic_key = settings.ANTHROPIC_API_KEY
        
    async def detect_hallucinations(
        self,
        brand_name: str,
        domain: str,
        known_facts: Dict[str, Any] = None,
        ai_responses: List[Dict[str, Any]] = None,
        industry: str = ""
    ) -> Dict[str, Any]:
        """
        Detect hallucinations in AI responses about a brand.
        
        Args:
            brand_name: Brand to check
            domain: Brand's domain
            known_facts: Dict of known facts about the brand
            ai_responses: List of AI responses to analyze (if not provided, will query)
            industry: Industry context
            
        Returns:
            Hallucination detection results
        """
        logger.info(f"[HALLUCINATION] Starting detection for {brand_name}")
        
        results = {
            "brand_name": brand_name,
            "analyzed_at": datetime.utcnow().isoformat() + "Z",
            "total_claims": 0,
            "accurate": 0,
            "hallucinations": 0,
            "unverified": 0,
            "accuracy_rate": 0.0,
            "hallucination_rate": 0.0,
            "claims": [],
            "summary": ""
        }
        
        # Get known facts if not provided
        if not known_facts:
            known_facts = await self._gather_known_facts(brand_name, domain, industry)
        
        # Get AI responses if not provided
        if not ai_responses:
            ai_responses = await self._query_ais_about_brand(brand_name, industry)
        
        # Extract and verify claims from each response
        all_claims = []
        for response in ai_responses:
            model = response.get("model", "unknown")
            content = response.get("content", "")
            
            claims = await self._extract_claims(content, brand_name)
            
            for claim in claims:
                verification = self._verify_claim(claim, known_facts, brand_name)
                claim_result = {
                    "claim_text": claim["text"],
                    "claim_type": claim["type"],
                    "model": model,
                    "status": verification["status"],
                    "confidence": verification["confidence"],
                    "fact": verification.get("matching_fact"),
                    "explanation": verification.get("explanation", "")
                }
                all_claims.append(claim_result)
        
        # Aggregate results
        results["claims"] = all_claims
        results["total_claims"] = len(all_claims)
        
        for claim in all_claims:
            if claim["status"] == "accurate":
                results["accurate"] += 1
            elif claim["status"] == "hallucination":
                results["hallucinations"] += 1
            else:
                results["unverified"] += 1
        
        if results["total_claims"] > 0:
            results["accuracy_rate"] = round(
                (results["accurate"] / results["total_claims"]) * 100, 1
            )
            results["hallucination_rate"] = round(
                (results["hallucinations"] / results["total_claims"]) * 100, 1
            )
        
        # Generate summary
        results["summary"] = self._generate_summary(results)
        
        logger.info(f"[HALLUCINATION] Detected {results['hallucinations']} hallucinations in {results['total_claims']} claims")
        
        return results
    
    async def _gather_known_facts(
        self,
        brand_name: str,
        domain: str,
        industry: str
    ) -> Dict[str, Any]:
        """
        Gather known facts about a brand from reliable sources.
        """
        facts = {
            "brand_name": brand_name,
            "domain": domain,
            "industry": industry,
            "founding_year": None,
            "headquarters": None,
            "ceo": None,
            "employees": None,
            "products": [],
            "services": [],
            "description": None,
            "source": "scraped"
        }
        
        # Try to scrape the website for facts
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                # Get homepage
                url = f"https://{domain}" if not domain.startswith("http") else domain
                response = await client.get(url, follow_redirects=True)
                
                if response.status_code == 200:
                    html = response.text.lower()
                    
                    # Extract founding year
                    year_patterns = [
                        r"founded in (\d{4})",
                        r"established (\d{4})",
                        r"since (\d{4})",
                        r"©\s*(\d{4})"
                    ]
                    for pattern in year_patterns:
                        match = re.search(pattern, html)
                        if match:
                            year = int(match.group(1))
                            if 1900 < year <= datetime.now().year:
                                facts["founding_year"] = year
                                break
                    
                    # Try about page
                    try:
                        about_response = await client.get(f"{url}/about", follow_redirects=True)
                        if about_response.status_code == 200:
                            about_text = about_response.text[:5000]
                            facts["about_page_content"] = about_text
                    except:
                        pass
                        
        except Exception as e:
            logger.warning(f"Could not scrape facts for {domain}: {e}")
        
        # Use AI to extract structured facts if we have API keys
        if self.openai_key and facts.get("about_page_content"):
            extracted = await self._extract_facts_with_ai(
                brand_name, 
                facts.get("about_page_content", "")
            )
            facts.update(extracted)
        
        return facts
    
    async def _extract_facts_with_ai(
        self,
        brand_name: str,
        content: str
    ) -> Dict[str, Any]:
        """Use AI to extract structured facts from content."""
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
                            "content": f"""Extract factual information about "{brand_name}" from this text.
Return ONLY a JSON object with these fields (use null for unknown):
{{
    "founding_year": <number or null>,
    "headquarters": "<city, country or null>",
    "ceo": "<name or null>",
    "employees": <number or null>,
    "products": ["list of products"],
    "services": ["list of services"],
    "description": "<brief description>"
}}

Text: {content[:3000]}"""
                        }],
                        "max_tokens": 500,
                        "temperature": 0
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    # Extract JSON from response
                    json_match = re.search(r'\{[^{}]*\}', content, re.DOTALL)
                    if json_match:
                        return json.loads(json_match.group())
                        
        except Exception as e:
            logger.warning(f"AI fact extraction failed: {e}")
        
        return {}
    
    async def _query_ais_about_brand(
        self,
        brand_name: str,
        industry: str
    ) -> List[Dict[str, Any]]:
        """Query multiple AI models about the brand."""
        responses = []
        
        queries = [
            f"What is {brand_name}? Tell me about the company.",
            f"When was {brand_name} founded and who is the CEO?",
            f"What products or services does {brand_name} offer?",
        ]
        
        # Query OpenAI
        if self.openai_key:
            for query in queries[:2]:
                try:
                    async with httpx.AsyncClient(timeout=30.0) as client:
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
                            content = data["choices"][0]["message"]["content"]
                            responses.append({
                                "model": "openai",
                                "query": query,
                                "content": content
                            })
                except Exception as e:
                    logger.warning(f"OpenAI query failed: {e}")
        
        # Query Anthropic
        if self.anthropic_key:
            for query in queries[:2]:
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
                            
                            responses.append({
                                "model": "anthropic",
                                "query": query,
                                "content": content
                            })
                except Exception as e:
                    logger.warning(f"Anthropic query failed: {e}")
        
        return responses
    
    async def _extract_claims(
        self,
        text: str,
        brand_name: str
    ) -> List[Dict[str, Any]]:
        """Extract verifiable claims from text."""
        claims = []
        text_lower = text.lower()
        brand_lower = brand_name.lower()
        
        # Only extract claims about our brand
        if brand_lower not in text_lower:
            return []
        
        # Extract with patterns
        claim_types = {
            "founding": [
                r"(?:was |is |were |been )?(?:founded|established|created|started)(?: in| on)? (\d{4})",
            ],
            "location": [
                r"(?:headquartered|based|located)(?: in| at)? ([A-Z][a-z]+(?:,? [A-Z][a-z]+)*)",
            ],
            "leadership": [
                r"(?:CEO|chief executive|founder|founded by)(?: is| was)? ([A-Z][a-z]+ [A-Z][a-z]+)",
            ],
            "employees": [
                r"(?:has|have|with) (?:over |more than |approximately )?(\d+(?:,\d+)*) (?:employees|staff|workers)",
            ],
            "revenue": [
                r"(?:revenue|valued|worth) (?:of |at |is )?(?:\$|€)(\d+(?:\.\d+)?)[ ]?(?:million|billion|M|B)",
            ],
            "products": [
                r"(?:offers|provides|sells|known for) ([^.]+)",
            ]
        }
        
        for claim_type, patterns in claim_types.items():
            for pattern in patterns:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    # Get context around the match
                    start = max(0, match.start() - 50)
                    end = min(len(text), match.end() + 50)
                    context = text[start:end]
                    
                    # Only include if brand is mentioned nearby
                    if brand_lower in context.lower():
                        claims.append({
                            "text": match.group(0).strip(),
                            "type": claim_type,
                            "value": match.group(1) if match.groups() else None,
                            "context": context
                        })
        
        return claims
    
    def _verify_claim(
        self,
        claim: Dict[str, Any],
        known_facts: Dict[str, Any],
        brand_name: str
    ) -> Dict[str, Any]:
        """Verify a claim against known facts."""
        claim_type = claim.get("type", "")
        claim_value = claim.get("value", "")
        
        result = {
            "status": "unverified",
            "confidence": 0.5,
            "matching_fact": None,
            "explanation": "Could not verify - no matching fact found"
        }
        
        if not claim_value:
            return result
        
        # Check founding year
        if claim_type == "founding" and known_facts.get("founding_year"):
            try:
                claimed_year = int(claim_value)
                actual_year = known_facts["founding_year"]
                
                if claimed_year == actual_year:
                    result = {
                        "status": "accurate",
                        "confidence": 0.95,
                        "matching_fact": f"Founded in {actual_year}",
                        "explanation": "Matches known founding year"
                    }
                else:
                    result = {
                        "status": "hallucination",
                        "confidence": 0.9,
                        "matching_fact": f"Actually founded in {actual_year}",
                        "explanation": f"Claims {claimed_year}, but actual year is {actual_year}"
                    }
            except ValueError:
                pass
        
        # Check location
        elif claim_type == "location" and known_facts.get("headquarters"):
            claimed_loc = claim_value.lower().strip()
            actual_loc = known_facts["headquarters"].lower().strip()
            
            similarity = SequenceMatcher(None, claimed_loc, actual_loc).ratio()
            
            if similarity > 0.8 or claimed_loc in actual_loc or actual_loc in claimed_loc:
                result = {
                    "status": "accurate",
                    "confidence": similarity,
                    "matching_fact": known_facts["headquarters"],
                    "explanation": "Matches known headquarters location"
                }
            else:
                result = {
                    "status": "hallucination",
                    "confidence": 0.7,
                    "matching_fact": known_facts["headquarters"],
                    "explanation": f"Claims '{claim_value}', but headquarters is '{known_facts['headquarters']}'"
                }
        
        # Check CEO
        elif claim_type == "leadership" and known_facts.get("ceo"):
            claimed_ceo = claim_value.lower().strip()
            actual_ceo = known_facts["ceo"].lower().strip()
            
            similarity = SequenceMatcher(None, claimed_ceo, actual_ceo).ratio()
            
            if similarity > 0.7:
                result = {
                    "status": "accurate",
                    "confidence": similarity,
                    "matching_fact": known_facts["ceo"],
                    "explanation": "Matches known CEO"
                }
            else:
                result = {
                    "status": "hallucination",
                    "confidence": 0.7,
                    "matching_fact": known_facts["ceo"],
                    "explanation": f"Claims CEO is '{claim_value}', but actual CEO is '{known_facts['ceo']}'"
                }
        
        # Check products/services
        elif claim_type == "products" and (known_facts.get("products") or known_facts.get("services")):
            known_offerings = known_facts.get("products", []) + known_facts.get("services", [])
            claimed = claim_value.lower()
            
            # Check if any known product/service is mentioned
            found_match = False
            for offering in known_offerings:
                if offering.lower() in claimed or claimed in offering.lower():
                    found_match = True
                    result = {
                        "status": "accurate",
                        "confidence": 0.8,
                        "matching_fact": offering,
                        "explanation": f"Mentions known offering: {offering}"
                    }
                    break
            
            if not found_match:
                # Could be true but we don't have it in our facts
                result["explanation"] = "Product/service not in our knowledge base - may be accurate"
        
        return result
    
    def _generate_summary(self, results: Dict[str, Any]) -> str:
        """Generate a human-readable summary."""
        total = results["total_claims"]
        accurate = results["accurate"]
        hallucinations = results["hallucinations"]
        
        if total == 0:
            return "No verifiable claims found in AI responses."
        
        if hallucinations == 0:
            return f"✅ All {total} claims verified as accurate. AI models have correct information about this brand."
        
        if results["hallucination_rate"] > 30:
            return f"⚠️ High hallucination rate ({results['hallucination_rate']}%). {hallucinations} of {total} claims are incorrect. Consider updating brand information sources."
        
        return f"Found {hallucinations} potential hallucinations out of {total} claims ({results['hallucination_rate']}% hallucination rate)."


# Singleton
_hallucination_service: Optional[HallucinationDetectionService] = None

def get_hallucination_detection_service() -> HallucinationDetectionService:
    """Get singleton instance."""
    global _hallucination_service
    if _hallucination_service is None:
        _hallucination_service = HallucinationDetectionService()
    return _hallucination_service
