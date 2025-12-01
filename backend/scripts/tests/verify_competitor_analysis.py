import asyncio
import sys
import os
import json
from pprint import pprint

# Add the current directory to sys.path to allow imports from app
sys.path.append(os.getcwd())

from app.services.analysis.competitor_analyzer import CompetitorAnalyzerService

async def verify_competitor_analysis(brand_url: str, competitor_url: str):
    print(f"🚀 Starting Competitor Analysis Verification")
    print(f"   Brand: {brand_url}")
    print(f"   Competitor: {competitor_url}")
    print("=" * 60)

    analyzer = CompetitorAnalyzerService()
    try:
        results = await analyzer.analyze_competitor(brand_url, competitor_url)
        
        print("\n✅ Analysis Complete")
        print(f"   - Visibility Score: {results.get('visibility_score')}/100")
        
        print("\n📊 Content Comparison:")
        content = results.get('content_comparison', {})
        print(f"   - Brand Words: {content.get('brand_word_count')}")
        print(f"   - Competitor Words: {content.get('competitor_word_count')}")
        print(f"   - Difference: {content.get('word_count_diff')}")
        
        print("\n🔍 Keyword Gaps (Top 3):")
        gaps = results.get('keyword_gaps', [])
        for gap in gaps[:3]:
            print(f"   - {gap['keyword']} (Freq: {gap['competitor_frequency']})")
            
        print("\n🛠️ Technical Comparison:")
        tech = results.get('technical_comparison', {})
        print(f"   - Brand Score: {tech.get('brand_score')}")
        print(f"   - Competitor Score: {tech.get('competitor_score')}")
        
        print("\n💪 Strengths identified:")
        for s in results.get('strengths', []):
            print(f"   - {s}")
            
        print("\n⚠️ Weaknesses identified:")
        for w in results.get('weaknesses', []):
            print(f"   - {w}")

    except Exception as e:
        print(f"❌ Analysis Exception: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await analyzer.close()

if __name__ == "__main__":
    # Use real URLs for testing
    BRAND = "https://mentha.ai"
    COMPETITOR = "https://www.jasper.ai"
    
    if len(sys.argv) > 2:
        BRAND = sys.argv[1]
        COMPETITOR = sys.argv[2]
    
    asyncio.run(verify_competitor_analysis(BRAND, COMPETITOR))
