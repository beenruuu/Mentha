import asyncio
import sys
import os
from uuid import UUID

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from app.services.analysis.ai_visibility_service import AIVisibilityService
from app.services.analysis.competitor_analyzer import CompetitorAnalyzerService
from app.services.supabase.database import SupabaseDatabaseService
from app.models.keyword import Keyword
from app.models.competitor import Competitor
from app.models.brand import Brand

async def force_analysis():
    print("🚀 Starting Force Analysis")
    print("=" * 60)
    
    # Initialize services
    visibility_service = AIVisibilityService()
    competitor_service = CompetitorAnalyzerService()
    keyword_db = SupabaseDatabaseService("keywords", Keyword)
    competitor_db = SupabaseDatabaseService("competitors", Competitor)
    brand_db = SupabaseDatabaseService("brands", Brand)
    
    # 1. Fetch Brand (assuming single user/brand for now or fetching all)
    brands = await brand_db.list()
    if not brands:
        print("❌ No brands found.")
        return

    for brand in brands:
        print(f"🏢 Processing Brand: {brand.name} ({brand.domain})")
        
        # 2. Process Keywords (AI Visibility)
        keywords = await keyword_db.list(filters={"brand_id": brand.id})
        print(f"   found {len(keywords)} keywords.")
        
        for kw in keywords:
            print(f"   🔍 Checking Visibility for: {kw.keyword}")
            try:
                # This measures visibility and updates the DB
                # measure_visibility expects 'keywords' as a list
                result = await visibility_service.measure_visibility(
                    brand_name=brand.name,
                    domain=brand.domain,
                    keywords=[kw.keyword] # Pass single keyword as list
                )
                
                # Update the keyword record with the result
                # The service might return a dict, we need to map it to DB columns
                update_data = {
                    "ai_position": result.get("estimated_position", 0),
                    "ai_visibility_score": result.get("overall_score", 0),
                    "ai_models": result.get("models", {}), # Changed from model_breakdown to models
                    "ai_improvement": result.get("recommendation", ""),
                    "last_checked_at": "now()"
                }
                await keyword_db.update(str(kw.id), update_data)
                print(f"      ✅ Updated: Score {result.get('overall_score')}")
            except Exception as e:
                print(f"      ❌ Failed: {e}")

        # 3. Process Competitors
        competitors = await competitor_db.list(filters={"brand_id": brand.id})
        print(f"   found {len(competitors)} competitors.")
        
        for comp in competitors:
            print(f"   ⚔️ Analyzing Competitor: {comp.name} ({comp.domain})")
            try:
                # Analyze competitor
                # analyze_competitor expects brand_url and competitor_url
                analysis_result = await competitor_service.analyze_competitor(
                    brand_url=brand.domain,
                    competitor_url=comp.domain
                )
                
                # Update competitor record
                update_data = {
                    "analysis_data": analysis_result, # analysis_result is a dict, not Pydantic model
                    "visibility_score": analysis_result.get("visibility_score", 0),
                    "last_analyzed_at": "now()"
                }
                await competitor_db.update(str(comp.id), update_data)
                print(f"      ✅ Updated: Visibility {analysis_result.get('visibility_score')}")
            except Exception as e:
                print(f"      ❌ Failed: {e}")

    print("=" * 60)
    print("✨ Force Analysis Complete.")

if __name__ == "__main__":
    asyncio.run(force_analysis())
