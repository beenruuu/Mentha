import asyncio
import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.analysis.content_structure_analyzer_service import ContentStructureAnalyzerService

async def test_speakability():
    service = ContentStructureAnalyzerService()
    
    url = "https://www.grupodissan.com/"
    print(f"\n--- Testing Speakability Analysis for {url} ---")
    
    try:
        result = await service.analyze_content_structure(url=url)
        
        if "error" in result:
            print(f"Error: {result['error']}")
            return

        speakability = result.get("speakability_analysis", {})
        print(f"\nSpeakability Score: {speakability.get('quality_score', 'N/A')}/100")
        print(f"Flesch Reading Ease: {speakability.get('flesch_reading_ease', 'N/A')}")
        print(f"Avg Sentence Length: {speakability.get('avg_sentence_length', 'N/A')}")
        print(f"Conversational Score: {speakability.get('conversational_score', 'N/A')}")
        
        print("\nVoice-related Recommendations:")
        for rec in result.get('recommendations', []):
            if rec.get('category') == 'voice':
                print(f"- {rec['title']}: {rec['description']}")
                
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await service.close()

if __name__ == "__main__":
    asyncio.run(test_speakability())
