import asyncio
import sys
import os
import json
from pprint import pprint

# Add the current directory to sys.path to allow imports from app
sys.path.append(os.getcwd())

from app.services.analysis.page_analyzer import PageAnalyzer
from app.services.analysis.technical_aeo_service import TechnicalAEOService
from app.services.analysis.llm_seo_analyzer import LLMSEOAnalyzer

async def verify_pipeline(url: str):
    print(f"🚀 Starting Verification for URL: {url}")
    print("=" * 60)

    # 1. Page Analysis (SEO + Content)
    print("\n[1/4] Running Page Analysis (SEO & Content)...")
    page_analyzer = PageAnalyzer()
    try:
        page_result = await page_analyzer.analyze_page(
            url=url,
            analyze_headings=True,
            analyze_extra_tags=True,
            extract_links=True
        )
        
        if page_result.get("status") == "error":
            print(f"❌ Page Analysis Failed: {page_result.get('error')}")
        else:
            print("✅ Page Analysis Complete")
            print(f"   - Title: {page_result['metadata'].get('title')}")
            print(f"   - Word Count: {page_result['content_analysis'].get('word_count')}")
            print(f"   - Keywords Found: {len(page_result.get('keywords', {}))}")
            print(f"   - H1 Tags: {len(page_result['headings'].get('h1', []))}")
            print(f"   - SEO Warnings: {len(page_result.get('seo_warnings', []))}")
            for w in page_result.get('seo_warnings', [])[:3]:
                print(f"     ⚠️ {w}")
            
            # AEO Signals from Page Analysis
            aeo = page_result.get('aeo_signals', {})
            print(f"   - AEO Signals (Content):")
            print(f"     - FAQ Structure: {aeo.get('has_faq_structure')}")
            print(f"     - How-To Structure: {aeo.get('has_how_to_structure')}")
            print(f"     - Conversational Readiness: {aeo.get('conversational_readiness_score')}/100")

    except Exception as e:
        print(f"❌ Page Analysis Exception: {e}")
    finally:
        await page_analyzer.close()

    # 2. Technical AEO Audit
    print("\n[2/4] Running Technical AEO Audit...")
    aeo_service = TechnicalAEOService()
    try:
        domain = url.split('//')[-1].split('/')[0]
        aeo_result = await aeo_service.audit_domain(domain)
        
        print("✅ Technical AEO Audit Complete")
        print(f"   - AEO Readiness Score: {aeo_result.get('aeo_readiness_score')}/100")
        
        crawlers = aeo_result['ai_crawler_permissions'].get('crawlers', {})
        blocked = [k for k, v in crawlers.items() if v == 'disallowed']
        print(f"   - Blocked AI Crawlers: {len(blocked)} ({', '.join(blocked) if blocked else 'None'})")
        
        schemas = aeo_result['structured_data']
        print(f"   - Structured Data: {schemas.get('total_schemas')} schemas found")
        print(f"     - FAQ: {schemas.get('has_faq')}")
        print(f"     - Article: {schemas.get('has_article')}")

    except Exception as e:
        print(f"❌ Technical AEO Exception: {e}")
    finally:
        await aeo_service.close()

    # 3. LLM Analysis (Mock or Real based on env)
    print("\n[3/4] Running LLM Analysis (Simulation)...")
    # We will simulate the input data structure that the LLM service expects
    if 'page_result' in locals() and page_result.get("status") == "success":
        llm_analyzer = LLMSEOAnalyzer()
        
        # Prepare a summary payload similar to what the API does
        summary_payload = {
            "metadata": page_result.get("metadata"),
            "content_summary": page_result.get("content_analysis"),
            "aeo_signals": page_result.get("aeo_signals"),
            "technical_score": aeo_result.get("aeo_readiness_score") if 'aeo_result' in locals() else 0
        }
        
        print("   (Skipping actual LLM call to save tokens/time, but verifying initialization)")
        print(f"   - LLM Provider: {llm_analyzer.provider}")
        print(f"   - Model: {llm_analyzer._get_model_name()}")
        print("   ✅ LLM Service Initialized")

    # 4. Overall Assessment
    print("\n[4/4] Pipeline Assessment")
    print("=" * 60)
    if 'page_result' in locals() and page_result.get("status") == "success" and 'aeo_result' in locals():
        print("✅ Pipeline appears functional.")
        print("ℹ️  Note: Results are currently NOT persisted to database (In-Memory Cache detected in code).")
    else:
        print("⚠️  Pipeline verification incomplete due to errors.")

if __name__ == "__main__":
    # Use a real, accessible URL for testing
    TEST_URL = "https://example.com" 
    if len(sys.argv) > 1:
        TEST_URL = sys.argv[1]
    
    asyncio.run(verify_pipeline(TEST_URL))
