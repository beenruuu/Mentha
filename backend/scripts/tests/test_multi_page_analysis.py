import asyncio
import os
import sys
from dotenv import load_dotenv

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

# Load environment variables
load_dotenv(os.path.join(backend_dir, '.env'))

from app.services.analysis.technical_aeo_service import TechnicalAEOService

async def test_crawl():
    service = TechnicalAEOService()
    domain = "https://www.grupodissan.com"
    
    print(f"Crawling {domain}...")
    pages = await service.crawl_site(domain, limit=5)
    
    print(f"Discovered {len(pages)} pages:")
    for page in pages:
        print(f"- {page}")
        
    await service.close()

if __name__ == "__main__":
    asyncio.run(test_crawl())
