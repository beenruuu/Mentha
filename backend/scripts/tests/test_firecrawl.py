import asyncio
import os
import sys
from dotenv import load_dotenv

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

# Load environment variables
load_dotenv(os.path.join(backend_dir, '.env'))

from app.services.firecrawl_service import FirecrawlService
from app.services.analysis.technical_aeo_service import TechnicalAEOService

async def test_firecrawl():
    print("Testing Firecrawl Service (API v1)...")
    print("=" * 50)
    
    # 1. Test direct service usage
    firecrawl = FirecrawlService()
    url = "https://www.grupodissan.com"
    
    print(f"\n1. Scraping {url}...")
    result = await firecrawl.scrape_url(url)
    if result.get('success'):
        print("✅ Scrape successful!")
        print(f"   Title: {result.get('metadata', {}).get('title', 'N/A')}")
        print(f"   Markdown length: {len(result.get('markdown', ''))}")
        print(f"   Description: {result.get('metadata', {}).get('description', 'N/A')[:100]}...")
    else:
        print(f"❌ Scrape failed: {result.get('error')}")
        
    print(f"\n2. Mapping {url}...")
    links = await firecrawl.map_site(url, limit=20)
    if links:
        print(f"✅ Map successful! Found {len(links)} links.")
        print("   First 5 links:")
        for link in links[:5]:
            print(f"   - {link}")
    else:
        print("❌ Map failed or returned no links.")
    
    print(f"\n3. Testing crawl job creation...")
    crawl_result = await firecrawl.crawl_site(url, limit=3)
    if crawl_result.get('success'):
        print(f"✅ Crawl job created!")
        print(f"   Job ID: {crawl_result.get('id')}")
        
        # Check status after a short wait
        await asyncio.sleep(2)
        status = await firecrawl.check_crawl_status(crawl_result['id'])
        print(f"   Status: {status.get('status')}")
        print(f"   Progress: {status.get('completed', 0)}/{status.get('total', 0)}")
    else:
        print(f"❌ Crawl failed: {crawl_result.get('error')}")
        
    await firecrawl.close()
    
    # 4. Test integration in TechnicalAEOService
    print(f"\n4. Testing TechnicalAEOService integration...")
    tech_service = TechnicalAEOService()
    pages = await tech_service.crawl_site(url, limit=5)
    print(f"   Discovered {len(pages)} pages via TechnicalAEOService:")
    for page in pages[:5]:
        print(f"   - {page}")
        
    await tech_service.close()
    
    print("\n" + "=" * 50)
    print("Tests completed!")

if __name__ == "__main__":
    asyncio.run(test_firecrawl())
