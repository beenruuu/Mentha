import asyncio
import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from app.services.analysis.keyword_metrics_service import KeywordMetricsService
from app.services.supabase.database import SupabaseDatabaseService
# from app.models.keyword import Keyword

async def refresh_data():
    print("🚀 Starting Keyword Data Refresh")
    print("=" * 60)
    
    # Initialize services
    metrics_service = KeywordMetricsService()
    # db_service = SupabaseDatabaseService("keywords", Keyword)
    
    # Fetch all keywords
    print("📥 Fetching all keywords...")
    # keywords = await db_service.list()
    keywords = []
    print(f"found {len(keywords)} keywords.")
    
    updated_count = 0
    
    for kw in keywords:
        print(f"🔄 Processing: {kw.keyword}")
        
        # 1. Get new metrics (using the improved estimation logic)
        # We pass the keyword explicitly to get the smart estimation
        trend_score = kw.trend_score or 0
        
        # Re-calculate volume and difficulty using the new logic
        new_volume = metrics_service._estimate_volume_from_trends(trend_score, kw.keyword)
        new_difficulty = metrics_service._estimate_difficulty(trend_score, new_volume, kw.keyword)
        
        # 2. Update record
        update_data = {
            "search_volume": new_volume,
            "difficulty": new_difficulty,
            "updated_at": "now()"
        }
        
        await db_service.update(str(kw.id), update_data)
        print(f"   ✅ Updated: Vol {new_volume}, Diff {new_difficulty}")
        updated_count += 1
        
    print("=" * 60)
    print(f"✨ Refresh Complete. Updated {updated_count} keywords.")
    await metrics_service.close()

if __name__ == "__main__":
    asyncio.run(refresh_data())
