import asyncio
import os
import sys
import json
from datetime import datetime
from uuid import uuid4

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from app.services.supabase.database import SupabaseDatabaseService
from app.models.analysis import Analysis, AnalysisType, AnalysisStatus, AIModel
from app.models.brand import Brand
# from app.models.keyword import Keyword
from app.models.competitor import Competitor

async def create_snapshot():
    print("📸 Creating Analysis Snapshot...")
    
    brand_db = SupabaseDatabaseService("brands", Brand)
    # keyword_db = SupabaseDatabaseService("keywords", Keyword)
    competitor_db = SupabaseDatabaseService("competitors", Competitor)
    analysis_db = SupabaseDatabaseService("aeo_analyses", Analysis)
    
    brands = await brand_db.list()
    
    for brand in brands:
        print(f"🏢 Processing Brand: {brand.name}")
        
        
        # Fetch Data
        # keywords = await keyword_db.list(filters={"brand_id": brand.id})
        keywords = []
        competitors = await competitor_db.list(filters={"brand_id": brand.id})
        
        # 1. Construct Keywords List for Results
        results_keywords = []
        total_kw_score = 0
        kw_count = 0
        
        for kw in keywords:
            score = kw.ai_visibility_score or 0
            if score > 0:
                total_kw_score += score
                kw_count += 1
                
            results_keywords.append({
                "keyword": kw.keyword,
                "search_volume": kw.search_volume or 0,
                "difficulty": kw.difficulty or 0,
                "ai_visibility_score": score,
                "ai_position": kw.ai_position or 0,
                "opportunity": "high" if (kw.search_volume or 0) > 1000 and score < 50 else "medium"
            })
            
        avg_kw_score = total_kw_score / kw_count if kw_count > 0 else 0
        
        # 2. Construct Competitors List for Results
        results_competitors = []
        for comp in competitors:
            results_competitors.append({
                "name": comp.name,
                "domain": comp.domain,
                "visibility_score": comp.visibility_score or 0,
                "insight": "Direct competitor identified via analysis."
            })
            
        # 3. Construct Models Breakdown
        # Aggregate from keywords
        models_agg = {
            "chatgpt": {"score_sum": 0, "count": 0},
            "claude": {"score_sum": 0, "count": 0},
            "perplexity": {"score_sum": 0, "count": 0},
            "gemini": {"score_sum": 0, "count": 0}
        }
        
        for kw in keywords:
            if kw.ai_models:
                for model_key, model_data in kw.ai_models.items():
                    # model_key might be 'openai', 'anthropic' etc. map to provider ids
                    provider_id = model_key
                    if model_key == 'openai': provider_id = 'chatgpt'
                    if model_key == 'anthropic': provider_id = 'claude'
                    
                    if provider_id in models_agg:
                        models_agg[provider_id]["score_sum"] += model_data.get("visibility_score", 0)
                        models_agg[provider_id]["count"] += 1
                        
        results_models = {}
        for pid, data in models_agg.items():
            avg = data["score_sum"] / data["count"] if data["count"] > 0 else 0
            results_models[pid] = {
                "visibility_score": avg,
                "mention_count": data["count"] # Rough proxy
            }
            
        # 4. Recommendations (Placeholder or derived)
        recommendations = [
            {
                "title": "Improve AI Visibility for Top Keywords",
                "description": "Your visibility is low for high volume keywords. Focus on entity optimization.",
                "priority": "high",
                "rationale": "Low visibility scores detected across major AI models."
            },
            {
                "title": "Monitor Competitor Strategies",
                "description": f"You have {len(competitors)} competitors tracked. Analyze their content structure.",
                "priority": "medium",
                "rationale": "Competitors are active in your niche."
            }
        ]
        
        # 5. Construct Final Results JSON
        results = {
            "score": avg_kw_score,
            "summary": "Snapshot analysis generated from current database state.",
            "keywords": results_keywords,
            "competitors": results_competitors,
            "models": results_models,
            "recommendations": recommendations,
            "visibility_findings": {
                "visibility_score": avg_kw_score,
                "keywords_tracked": len(keywords)
            }
        }
        
        # 6. Create Analysis Record
        analysis_data = {
            "brand_id": brand.id,
            "user_id": brand.user_id,
            "analysis_type": AnalysisType.domain,
            "input_data": {"snapshot": True, "generated_at": datetime.now().isoformat()},
            "status": AnalysisStatus.completed,
            "results": results,
            "score": avg_kw_score,
            "created_at": datetime.now().isoformat(),
            "completed_at": datetime.now().isoformat()
        }
        
        # We need to handle UUID serialization if passing to create directly?
        # SupabaseService.create usually expects a dict that matches the model dump
        # But here we are using the service which uses the Pydantic model to validate?
        # No, SupabaseService.create takes a dict.
        
        # Let's try to create it.
        try:
            # We need to convert UUIDs to strings for JSON serialization if Supabase client needs it
            # But SupabaseService might handle it.
            # However, `brand.id` is a UUID object.
            analysis_data["brand_id"] = str(brand.id)
            analysis_data["user_id"] = str(brand.user_id)
            
            new_analysis = await analysis_db.create(analysis_data)
            print(f"   ✅ Created Analysis Snapshot: {new_analysis.id} (Score: {avg_kw_score:.1f})")
        except Exception as e:
            print(f"   ❌ Failed to create snapshot: {e}")

if __name__ == "__main__":
    asyncio.run(create_snapshot())
