"""
Quick test to verify web search service is working correctly.
"""

import asyncio
from app.services.web_search_service import WebSearchService


async def test_web_search():
    """Test the web search service."""
    service = WebSearchService()
    
    print("=" * 60)
    print("Testing DuckDuckGo Web Search Service")
    print("=" * 60)
    
    if not service.enabled:
        print("❌ Web search is DISABLED")
        print("   Please install: pip install duckduckgo-search")
        return
    
    print("✅ Web search is ENABLED\n")
    
    # Test 1: Search for keywords
    print("-" * 60)
    print("Test 1: Keyword Search")
    print("-" * 60)
    results = await service.search_keywords(
        brand_name="Nike",
        industry="Sports Apparel",
        max_results=3
    )
    print(f"Found {len(results)} keyword results:")
    for i, result in enumerate(results[:2], 1):
        print(f"\n{i}. {result.get('title', 'No title')}")
        print(f"   {result.get('body', '')[:100]}...")
    
    # Test 2: Search for competitors
    print("\n" + "-" * 60)
    print("Test 2: Competitor Search")
    print("-" * 60)
    comp_results = await service.search_competitors(
        brand_name="Nike",
        industry="Sports Apparel",
        max_results=3
    )
    print(f"Found {len(comp_results)} competitors:")
    for i, comp in enumerate(comp_results, 1):
        print(f"\n{i}. {comp.get('name')} - {comp.get('domain')}")
    
    # Test 3: Get comprehensive search context
    print("\n" + "-" * 60)
    print("Test 3: Full Search Context (like in analysis)")
    print("-" * 60)
    context = await service.get_search_context(
        brand_name="Tesla",
        domain="tesla.com",
        industry="Electric Vehicles"
    )
    
    if context.get("enabled"):
        print(f"✅ Context gathered successfully!")
        print(f"   Total results: {context['total_results']}")
        print(f"   - Keyword results: {len(context['keyword_results'])}")
        print(f"   - Competitor results: {len(context['competitor_results'])}")
        print(f"   - Mention results: {len(context['mention_results'])}")
        print(f"   - Industry results: {len(context['industry_results'])}")
    else:
        print("❌ Context gathering failed")
    
    print("\n" + "=" * 60)
    print("✅ All tests completed!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_web_search())
