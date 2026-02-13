"""
Site Audit Endpoints - Deep website analysis using Firecrawl for AEO/GEO optimization.

This module provides endpoints for auditing a brand's website to generate
contextual optimization recommendations based on actual site content.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.auth import UserProfile
from app.api.deps import get_current_user
from app.services.supabase.auth import get_auth_service
from app.services.firecrawl_service import FirecrawlService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/site-audit", tags=["site-audit"])


# Request/Response Models
class SiteAuditRequest(BaseModel):
    """Request model for site audit."""
    brand_id: str = Field(..., description="Brand ID to audit")
    pages_limit: int = Field(default=5, ge=1, le=20, description="Number of pages to analyze")


class PageFinding(BaseModel):
    """Findings for a single page."""
    url: str
    title: Optional[str] = None
    has_schema_markup: bool = False
    schema_types: List[str] = []
    has_faq_content: bool = False
    heading_structure: Dict[str, int] = {}
    word_count: int = 0
    issues: List[str] = []


class SiteAuditResponse(BaseModel):
    """Response model for site audit."""
    audit_id: str
    brand_id: str
    status: str  # pending, processing, completed, failed
    created_at: str
    completed_at: Optional[str] = None
    domain: str
    pages_requested: int
    pages_analyzed: int = 0
    pages: List[PageFinding] = []
    findings: Dict[str, Any] = {}
    recommendations: List[Dict[str, str]] = []
    error: Optional[str] = None


# In-memory storage for audit results (in production, use database)
_audit_results: Dict[str, Dict[str, Any]] = {}


@router.post("/analyze", response_model=SiteAuditResponse)
async def run_site_audit(
    request: SiteAuditRequest,
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user)
) -> SiteAuditResponse:
    """
    Run a comprehensive site audit using Firecrawl.
    
    This endpoint:
    1. Maps the site to discover pages
    2. Scrapes key pages for content analysis
    3. Analyzes schema markup, content structure, FAQ presence
    4. Generates contextual AEO/GEO recommendations
    """
    auth_service = get_auth_service()
    supabase = auth_service.supabase
    
    # Verify brand exists and user owns it
    try:
        brand_result = supabase.table("brands")\
            .select("id, name, domain, user_id")\
            .eq("id", request.brand_id)\
            .single()\
            .execute()
        
        if not brand_result.data:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        brand = brand_result.data
        if brand["user_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to audit this brand")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching brand: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch brand")
    
    # Create audit record
    audit_id = str(uuid4())
    domain = brand["domain"]
    
    audit_data = {
        "audit_id": audit_id,
        "brand_id": request.brand_id,
        "domain": domain,
        "status": "processing",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "pages_requested": request.pages_limit,
        "pages_analyzed": 0,
        "pages": [],
        "findings": {},
        "recommendations": []
    }
    
    _audit_results[audit_id] = audit_data
    
    # Run audit in background
    background_tasks.add_task(
        _run_site_audit,
        audit_id=audit_id,
        domain=domain,
        brand_name=brand["name"],
        pages_limit=request.pages_limit
    )
    
    return SiteAuditResponse(**audit_data)


async def _run_site_audit(
    audit_id: str,
    domain: str,
    brand_name: str,
    pages_limit: int
):
    """Background task to run site audit."""
    logger.info(f"[SITE-AUDIT] Starting audit {audit_id} for {domain}")
    
    firecrawl = FirecrawlService()
    
    try:
        # 1. Map the site to discover pages
        logger.info(f"[SITE-AUDIT] Mapping site {domain}...")
        urls = await firecrawl.map_site(domain, limit=pages_limit * 2)
        
        if not urls:
            # Try with https prefix
            urls = await firecrawl.map_site(f"https://{domain}", limit=pages_limit * 2)
        
        if not urls:
            _audit_results[audit_id]["status"] = "failed"
            _audit_results[audit_id]["error"] = "Could not discover any pages on the site"
            return
        
        logger.info(f"[SITE-AUDIT] Found {len(urls)} URLs")
        
        # Prioritize key pages
        priority_patterns = ["/", "/about", "/services", "/products", "/contact", "/faq"]
        priority_urls = []
        other_urls = []
        
        for url in urls:
            path = url.replace(f"https://{domain}", "").replace(f"http://{domain}", "")
            if path in priority_patterns or path.rstrip("/") in priority_patterns:
                priority_urls.append(url)
            else:
                other_urls.append(url)
        
        urls_to_analyze = (priority_urls + other_urls)[:pages_limit]
        logger.info(f"[SITE-AUDIT] Analyzing {len(urls_to_analyze)} pages")
        
        # 2. Scrape and analyze each page
        pages_findings: List[Dict] = []
        all_issues: List[str] = []
        schema_summary = {"found": False, "types": set()}
        content_summary = {"total_words": 0, "faq_pages": 0}
        
        for url in urls_to_analyze:
            try:
                logger.info(f"[SITE-AUDIT] Scraping {url}")
                result = await firecrawl.scrape_url(url, formats=["markdown", "html"])
                
                if not result.get("success"):
                    continue
                
                markdown = result.get("markdown", "")
                metadata = result.get("metadata", {})
                html_data = result.get("data", {})
                
                # Analyze page
                page_finding = _analyze_page(url, markdown, metadata, html_data, brand_name)
                pages_findings.append(page_finding)
                
                # Aggregate findings
                if page_finding["has_schema_markup"]:
                    schema_summary["found"] = True
                    schema_summary["types"].update(page_finding["schema_types"])
                
                content_summary["total_words"] += page_finding["word_count"]
                if page_finding["has_faq_content"]:
                    content_summary["faq_pages"] += 1
                
                all_issues.extend(page_finding["issues"])
                
            except Exception as e:
                logger.error(f"[SITE-AUDIT] Error scraping {url}: {e}")
        
        # 3. Generate recommendations
        schema_summary["types"] = list(schema_summary["types"])
        recommendations = _generate_recommendations(
            pages_findings, schema_summary, content_summary, all_issues, brand_name
        )
        
        # Update audit results
        _audit_results[audit_id].update({
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat() + "Z",
            "pages_analyzed": len(pages_findings),
            "pages": pages_findings,
            "findings": {
                "schema_markup": schema_summary,
                "content": content_summary,
                "total_issues": len(all_issues)
            },
            "recommendations": recommendations
        })
        
        logger.info(f"[SITE-AUDIT] Completed audit {audit_id} with {len(recommendations)} recommendations")
        
    except Exception as e:
        logger.error(f"[SITE-AUDIT] Audit failed: {e}")
        _audit_results[audit_id]["status"] = "failed"
        _audit_results[audit_id]["error"] = str(e)
    finally:
        await firecrawl.close()


def _analyze_page(
    url: str,
    markdown: str,
    metadata: Dict,
    html_data: Dict,
    brand_name: str
) -> Dict[str, Any]:
    """Analyze a single page for AEO/GEO optimization."""
    issues = []
    
    # Count words
    word_count = len(markdown.split()) if markdown else 0
    
    # Check heading structure
    heading_structure = {"h1": 0, "h2": 0, "h3": 0}
    for line in markdown.split("\n"):
        if line.startswith("# "):
            heading_structure["h1"] += 1
        elif line.startswith("## "):
            heading_structure["h2"] += 1
        elif line.startswith("### "):
            heading_structure["h3"] += 1
    
    # Check for FAQ content
    faq_indicators = ["?", "faq", "preguntas frecuentes", "frequently asked", "q:", "a:"]
    has_faq = any(ind in markdown.lower() for ind in faq_indicators)
    
    # Check for schema markup (look for JSON-LD in metadata or html)
    schema_types = []
    has_schema = False
    raw_html = html_data.get("html", "") or html_data.get("rawHtml", "")
    
    if "application/ld+json" in raw_html.lower():
        has_schema = True
        # Try to extract schema types
        import re
        type_matches = re.findall(r'"@type"\s*:\s*"([^"]+)"', raw_html)
        schema_types = list(set(type_matches))
    
    # Generate issues
    if heading_structure["h1"] == 0:
        issues.append(f"No H1 heading found on {url}")
    elif heading_structure["h1"] > 1:
        issues.append(f"Multiple H1 headings on {url}")
    
    if not has_schema:
        issues.append(f"No schema markup (JSON-LD) found on {url}")
    
    if word_count < 300:
        issues.append(f"Thin content ({word_count} words) on {url}")
    
    if brand_name.lower() not in markdown.lower():
        issues.append(f"Brand name '{brand_name}' not mentioned on {url}")
    
    return {
        "url": url,
        "title": metadata.get("title", ""),
        "has_schema_markup": has_schema,
        "schema_types": schema_types,
        "has_faq_content": has_faq,
        "heading_structure": heading_structure,
        "word_count": word_count,
        "issues": issues
    }


def _generate_recommendations(
    pages: List[Dict],
    schema_summary: Dict,
    content_summary: Dict,
    issues: List[str],
    brand_name: str
) -> List[Dict[str, str]]:
    """Generate contextual AEO/GEO recommendations."""
    recommendations = []
    
    # Schema recommendations
    if not schema_summary["found"]:
        recommendations.append({
            "priority": "high",
            "category": "schema",
            "title": "Add Schema.org Markup",
            "description": "None of your pages have structured data markup. Add JSON-LD schema (Organization, WebSite, FAQPage) to help AI understand your content.",
            "action": "generate_schema"
        })
    else:
        desired_types = ["Organization", "WebSite", "FAQPage", "Article", "Product", "Service"]
        missing_types = [t for t in desired_types if t not in schema_summary["types"]]
        if missing_types:
            recommendations.append({
                "priority": "medium",
                "category": "schema",
                "title": f"Add Missing Schema Types",
                "description": f"Consider adding: {', '.join(missing_types[:3])}. These help AI understand your content structure.",
                "action": "generate_schema"
            })
    
    # FAQ recommendations
    if content_summary["faq_pages"] == 0:
        recommendations.append({
            "priority": "high",
            "category": "content",
            "title": "Create FAQ Content",
            "description": "No FAQ-style content detected. FAQs are highly extracted by AI models for direct answers. Add a dedicated FAQ page or section.",
            "action": "create_faq"
        })
    
    # llms.txt recommendation
    recommendations.append({
        "priority": "medium",
        "category": "llms",
        "title": "Create llms.txt File",
        "description": f"Add a llms.txt file to your root domain to provide clear instructions to AI crawlers about {brand_name}.",
        "action": "generate_llms_txt"
    })
    
    # Content issues
    thin_content_count = sum(1 for issue in issues if "Thin content" in issue)
    if thin_content_count > 0:
        recommendations.append({
            "priority": "medium",
            "category": "content",
            "title": "Expand Thin Content",
            "description": f"{thin_content_count} page(s) have less than 300 words. Expand content to provide comprehensive answers for AI extraction.",
            "action": "expand_content"
        })
    
    # Heading structure issues
    h1_issues = sum(1 for issue in issues if "H1" in issue)
    if h1_issues > 0:
        recommendations.append({
            "priority": "medium",
            "category": "structure",
            "title": "Fix Heading Structure",
            "description": f"{h1_issues} page(s) have H1 heading issues. Each page should have exactly one H1 that includes your main topic.",
            "action": "fix_headings"
        })
    
    # Brand mention issues
    brand_issues = sum(1 for issue in issues if "not mentioned" in issue)
    if brand_issues > 0:
        recommendations.append({
            "priority": "low", 
            "category": "branding",
            "title": "Increase Brand Visibility",
            "description": f"Your brand name isn't mentioned on {brand_issues} page(s). Include '{brand_name}' naturally in content for better AI association.",
            "action": "add_brand_mentions"
        })
    
    # Sort by priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(key=lambda x: priority_order.get(x["priority"], 3))
    
    return recommendations


@router.get("/{audit_id}", response_model=SiteAuditResponse)
async def get_audit_status(
    audit_id: str,
    current_user: UserProfile = Depends(get_current_user)
) -> SiteAuditResponse:
    """Get the status and results of a site audit."""
    if audit_id not in _audit_results:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    return SiteAuditResponse(**_audit_results[audit_id])


@router.get("/brand/{brand_id}/latest")
async def get_latest_audit(
    brand_id: str,
    current_user: UserProfile = Depends(get_current_user)
) -> Optional[SiteAuditResponse]:
    """Get the latest audit for a brand (regardless of status)."""
    # Find most recent audit for this brand
    brand_audits = [
        audit for audit in _audit_results.values()
        if audit["brand_id"] == brand_id
    ]
    
    if not brand_audits:
        return None
    
    # Sort by created_at descending
    brand_audits.sort(key=lambda x: x["created_at"], reverse=True)
    
    return SiteAuditResponse(**brand_audits[0])
