import asyncio
import sys
import os

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.analysis.technical_aeo_service import TechnicalAEOService

async def test_voice_readiness():
    service = TechnicalAEOService()
    
    # Test with a known domain
    domain = "example.com" 
    print(f"\n--- Testing Voice Readiness for {domain} ---")
    
    try:
        result = await service.audit_domain(domain)
        
        print(f"AEO Score: {result['aeo_readiness_score']}")
        print(f"Voice Readiness Score: {result.get('voice_readiness_score', 'N/A')}")
        
        print("\nVoice-related Recommendations:")
        for rec in result['recommendations']:
            if rec['category'] == 'voice_search':
                print(f"- {rec['title']}: {rec['description']}")
                
        print("\nSchema Details:")
        aeo_schemas = result['structured_data'].get('aeo_schemas', {})
        if aeo_schemas:
            print(f"Has Speakable: {aeo_schemas.get('Speakable', {}).get('present', False)}")
            print(f"Has LocalBusiness: {aeo_schemas.get('LocalBusiness', {}).get('present', False)}")
        else:
            print("No AEO schemas found (or error occurred)")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await service.close()

if __name__ == "__main__":
    asyncio.run(test_voice_readiness())
