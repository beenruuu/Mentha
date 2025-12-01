import asyncio
import sys
import os

# Add the current directory to sys.path to allow imports from app
sys.path.append(os.getcwd())

from app.services.analysis.keyword_metrics_service import KeywordMetricsService

async def verify_metrics():
    print(f"🚀 Starting Keyword Metrics Verification")
    print("=" * 60)

    service = KeywordMetricsService()
    
    test_keywords = [
        "SEO",
        "AI marketing tools",
        "best enterprise facility management software in spain",
        "maintenance",
        "facility management"
    ]
    
    print("\n📊 Testing Estimation Logic (No API calls):")
    for kw in test_keywords:
        # Simulate trend score 0 (no data)
        vol = service._estimate_volume_from_trends(0, kw)
        diff = service._estimate_difficulty(0, vol, kw)
        print(f"   - '{kw}': Volume={vol}, Difficulty={diff}")
        
    print("\n✅ Verification Complete")
    await service.close()

if __name__ == "__main__":
    asyncio.run(verify_metrics())
