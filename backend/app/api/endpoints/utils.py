from fastapi import APIRouter, HTTPException, Query
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

router = APIRouter()


async def fetch_page_content(url: str) -> dict:
    """
    Fetch page HTML and extract metadata and main content.
    Returns dict with title, description, favicon, image, and main text content.
    """
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5,es;q=0.3"
    }
    
    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0, headers=headers, verify=False) as client:
        response = await client.get(url)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Title
        title = soup.title.string if soup.title else ""
        if not title:
            og_title = soup.find("meta", property="og:title")
            title = og_title["content"] if og_title else ""

        # Description
        description = ""
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc:
            description = meta_desc.get("content", "")
        if not description:
            og_desc = soup.find("meta", property="og:description")
            description = og_desc["content"] if og_desc else ""

        # Favicon
        favicon = ""
        icon_link = soup.find("link", rel=lambda x: x and 'icon' in x.lower())
        if icon_link:
            favicon = urljoin(url, icon_link.get("href", ""))
        else:
            parsed_url = urlparse(url)
            favicon = f"{parsed_url.scheme}://{parsed_url.netloc}/favicon.ico"

        # OG Image
        image = ""
        og_image = soup.find("meta", property="og:image")
        if og_image:
            image = urljoin(url, og_image.get("content", ""))
        
        # Extract main text content for AI analysis
        # Remove script, style, nav, footer elements
        for element in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'noscript']):
            element.decompose()
        
        # Get main content
        main_content = soup.find('main') or soup.find('article') or soup.find('body')
        text_content = ""
        if main_content:
            text_content = ' '.join(main_content.get_text(separator=' ', strip=True).split())[:2500]
        
        # Extract keywords meta tag
        keywords = ""
        meta_keywords = soup.find("meta", attrs={"name": "keywords"})
        if meta_keywords:
            keywords = meta_keywords.get("content", "")
        
        return {
            "url": url,
            "domain": urlparse(url).netloc,
            "title": title.strip() if title else "",
            "description": description.strip() if description else "",
            "favicon": favicon,
            "image": image,
            "text_content": text_content,
            "keywords": keywords
        }


@router.get("/metadata")
async def get_url_metadata(url: str = Query(..., description="The URL to fetch metadata from")):
    """
    Fetch metadata (title, description, favicon, og:image) from a given URL.
    """
    try:
        data = await fetch_page_content(url)
        # Return basic metadata (backwards compatible)
        return {
            "url": data["url"],
            "domain": data["domain"],
            "title": data["title"],
            "description": data["description"],
            "favicon": data["favicon"],
            "image": data["image"]
        }
    except httpx.RequestError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing metadata: {str(e)}")


@router.get("/brand-info")
async def get_brand_info(url: str = Query(..., description="The URL to analyze")):
    """
    Fetch metadata AND infer business information using AI.
    Returns: url, domain, title, description, favicon, image, industry, location, company_type, services
    """
    try:
        # Fetch page content
        page_data = await fetch_page_content(url)
        
        # Use AI to infer business info
        from app.services.web_search_service import WebSearchService
        web_service = WebSearchService()
        
        business_info = await web_service.infer_business_info_from_page(
            url=page_data["url"],
            page_title=page_data["title"],
            page_description=page_data["description"],
            page_content=page_data["text_content"]
        )
        
        # Infer location from various sources
        location = business_info.get("target_market", "")
        # Try to extract country from domain TLD
        domain = page_data["domain"]
        tld_countries = {
            ".es": "Spain", ".mx": "Mexico", ".ar": "Argentina", ".co": "Colombia",
            ".de": "Germany", ".fr": "France", ".it": "Italy", ".uk": "United Kingdom",
            ".us": "United States", ".br": "Brazil", ".pt": "Portugal"
        }
        for tld, country in tld_countries.items():
            if domain.endswith(tld):
                location = country
                break
        
        # Determine business model from company_type
        company_type = business_info.get("company_type", "").upper()
        business_model = "B2B" if company_type == "B2B" else "B2C" if company_type == "B2C" else company_type
        
        return {
            "url": page_data["url"],
            "domain": page_data["domain"],
            "title": page_data["title"],
            "description": page_data["description"],
            "favicon": page_data["favicon"],
            "image": page_data["image"],
            # AI-inferred fields
            "industry": business_info.get("industry", ""),
            "location": location,
            "services": business_info.get("services", []),
            "businessModel": business_model,
            "companyType": business_info.get("company_type", "")
        }
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error analyzing brand: {str(e)}")
