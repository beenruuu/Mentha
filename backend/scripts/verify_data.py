import asyncio
import os
import sys

# Add the current directory to sys.path (assuming running from backend dir)
sys.path.append(os.getcwd())

from app.services.supabase.database import SupabaseDatabaseService
from app.models.keyword import Keyword

async def verify_data():
    print("🔍 Verifying Keyword Data...")
    
    keyword_db = SupabaseDatabaseService("keywords", Keyword)
    
    # Check Keywords
    print("\n--- Keywords ---")
    keywords = await keyword_db.list()
    
    print(f"Total Keywords: {len(keywords)}")
    
    if keywords:
        print("First Keyword Details:")
        kw = keywords[0]
        print(f"  Keyword: {kw.keyword}")
        print(f"  AI Visibility Score: {kw.ai_visibility_score}")
        print(f"  AI Position: {kw.ai_position}")
        print(f"  AI Models: {kw.ai_models}")
        print(f"  Last Checked At: {kw.last_checked_at}")
        print(f"  Raw Dict: {kw.model_dump()}")

if __name__ == "__main__":
    asyncio.run(verify_data())
