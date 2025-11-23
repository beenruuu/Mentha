from fastapi import APIRouter, HTTPException, Query
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

router = APIRouter()

@router.get("/metadata")
async def get_url_metadata(url: str = Query(..., description="The URL to fetch metadata from")):
    """
    Fetch metadata (title, description, favicon, og:image) from a given URL.
    """
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"
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
                # Fallback to default favicon.ico
                parsed_url = urlparse(url)
                favicon = f"{parsed_url.scheme}://{parsed_url.netloc}/favicon.ico"

            # OG Image (Logo candidate)
            image = ""
            og_image = soup.find("meta", property="og:image")
            if og_image:
                image = urljoin(url, og_image.get("content", ""))

            return {
                "url": url,
                "domain": urlparse(url).netloc,
                "title": title.strip(),
                "description": description.strip(),
                "favicon": favicon,
                "image": image
            }

    except httpx.RequestError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing metadata: {str(e)}")
