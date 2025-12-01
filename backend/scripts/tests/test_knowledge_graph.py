import asyncio
import sys
import os
from dotenv import load_dotenv

# Add backend directory to path
backend_dir = os.path.join(os.path.dirname(__file__), '..')
sys.path.append(backend_dir)

# Load .env
load_dotenv(os.path.join(backend_dir, '.env'))

from app.services.analysis.knowledge_graph_service import KnowledgeGraphMonitorService

async def main():
    service = KnowledgeGraphMonitorService()
    
    # Test with a known brand
    brand_name = "Mentha" # Or maybe a real big brand like "Iberia" to see results
    domain = "mentha.ai"
    
    print(f"--- Testing Knowledge Graph Monitor for {brand_name} ---")
    
    try:
        results = await service.monitor_knowledge_presence(
            brand_name=brand_name,
            domain=domain
        )
        
        print(f"\nCompleteness Score: {results['completeness_score']}")
        print(f"Presence Score: {results['presence_score']}")
        
        print("\nKnowledge Sources:")
        for source, data in results['knowledge_sources'].items():
            found = data.get('found', False)
            print(f"- {source}: {'FOUND' if found else 'NOT FOUND'}")
            if found:
                if source == 'wikidata':
                    print(f"  Entity ID: {data.get('entity_id')}")
                elif source == 'wikipedia':
                    print(f"  Page: {data.get('page_url')}")
                elif source == 'google_kg':
                    print(f"  Brand Recognition: {data.get('brand_recognition')}")
                elif source == 'llm_recognition':
                    print(f"  Confidence: {data.get('confidence')}")
                    print(f"  Type: {data.get('entity_type')}")

        print("\nRecommendations:")
        for rec in results['recommendations']:
            print(f"- [{rec['priority'].upper()}] {rec['title']}: {rec['description']}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await service.close()

if __name__ == "__main__":
    asyncio.run(main())
