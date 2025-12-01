import asyncio
import sys
import os

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.analysis.web_search_service import WebSearchService

async def test_discovery():
    service = WebSearchService()
    
    print("\n--- Test 1: Spanish Brand (ES) ---")
    results_es = await service.search_competitors(
        brand_name="Iberia",
        industry="Aerolíneas",
        domain="iberia.com",
        country="ES",
        language="es"
    )
    print(f"Found {len(results_es)} competitors for Iberia:")
    for c in results_es:
        print(f"- {c['name']} ({c['domain']})")

    print("\n--- Test 2: US Brand (US) ---")
    results_us = await service.search_competitors(
        brand_name="Delta Airlines",
        industry="Airlines",
        domain="delta.com",
        country="US",
        language="en"
    )
    print(f"Found {len(results_us)} competitors for Delta:")
    for c in results_us:
        print(f"- {c['name']} ({c['domain']})")

if __name__ == "__main__":
    asyncio.run(test_discovery())
