"""
End-to-End Test for Onboarding Flow

This script simulates the complete onboarding process:
1. Analyze the domain URL to extract business info
2. Create a user profile
3. Create a brand with initial analysis
4. Wait for analysis to complete
5. Verify results including competitors

Usage:
    python test_onboarding_flow.py [--cleanup] [--domain DOMAIN] [--skip-api]

Options:
    --cleanup   Delete created data after test
    --domain    Domain to test (default: grupodissan.com)
    --skip-api  Skip API tests and only test local services
"""

import asyncio
import argparse
import sys
from datetime import datetime
from uuid import uuid4
import httpx

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = f"test_{uuid4().hex[:8]}@test.com"
TEST_USER_PASSWORD = "TestPassword123!"


async def test_local_services(domain: str):
    """Test local services without API calls."""
    print("\n" + "="*60)
    print("🧪 LOCAL SERVICES TEST")
    print("="*60)
    print(f"📅 Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 Domain: {domain}")
    print("="*60)
    
    # Step 1: Page Analysis
    print("\n📄 Step 1: Analyzing page...")
    from app.services.page_analyzer import PageAnalyzer
    
    analyzer = PageAnalyzer()
    page_result = await analyzer.analyze_page(f"https://{domain}")
    await analyzer.close()
    
    metadata = page_result.get("metadata", {})
    print(f"   ✓ Title: {metadata.get('title', 'N/A')[:60]}...")
    print(f"   ✓ Description: {metadata.get('description', 'N/A')[:60]}...")
    
    # Step 2: Infer Business Info
    print("\n🤖 Step 2: Inferring business information with AI...")
    from app.services.web_search_service import WebSearchService
    
    service = WebSearchService()
    keywords = list(page_result.get("keywords", {}).keys())[:15]
    
    business_info = await service.infer_business_info_from_page(
        url=f"https://{domain}",
        page_title=metadata.get('title', ''),
        page_description=metadata.get('description', ''),
        page_content=" ".join(keywords)
    )
    
    print(f"   ✓ Industry: {business_info.get('industry', 'Unknown')}")
    print(f"   ✓ Services: {', '.join(business_info.get('services', [])[:3])}...")
    print(f"   ✓ Company Type: {business_info.get('company_type', 'Unknown')}")
    print(f"   ✓ Target Market: {business_info.get('target_market', 'Unknown')}")
    
    # Step 3: Find Competitors
    print("\n🏆 Step 3: Finding competitors...")
    
    competitors = await service.search_competitors(
        brand_name=metadata.get('title', '').split('-')[0].strip() or domain,
        industry=business_info.get('industry', 'Services'),
        domain=domain,
        description=metadata.get('description', ''),
        services=business_info.get('services', [])
    )
    
    print(f"   ✓ Found {len(competitors)} competitors:")
    for i, comp in enumerate(competitors[:5], 1):
        print(f"      {i}. {comp.get('name')} ({comp.get('domain')})")
    
    print("\n" + "="*60)
    print("✅ LOCAL SERVICES TEST PASSED!")
    print("="*60)
    
    return {
        "metadata": metadata,
        "business_info": business_info,
        "competitors": competitors
    }


class OnboardingTestRunner:
    def __init__(self, domain: str = "grupodissan.com", cleanup: bool = False):
        self.domain = domain
        self.cleanup = cleanup
        self.access_token = None
        self.user_id = None
        self.brand_id = None
        self.analysis_id = None
        
    async def run(self):
        """Run the complete onboarding test."""
        print("\n" + "="*60)
        print("🧪 ONBOARDING E2E TEST")
        print("="*60)
        print(f"📅 Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🌐 Domain: {self.domain}")
        print(f"📧 Test User: {TEST_USER_EMAIL}")
        print("="*60 + "\n")
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                # Step 1: Register user
                await self._step_register(client)
                
                # Step 2: Login
                await self._step_login(client)
                
                # Step 3: Update user profile (simulating onboarding step 1)
                await self._step_update_profile(client)
                
                # Step 4: Analyze domain (simulating URL input)
                await self._step_analyze_domain(client)
                
                # Step 5: Create brand with analysis
                await self._step_create_brand(client)
                
                # Step 6: Wait for analysis completion
                await self._step_wait_analysis(client)
                
                # Step 7: Verify results
                await self._step_verify_results(client)
                
                # Cleanup if requested
                if self.cleanup:
                    await self._cleanup(client)
                
                print("\n" + "="*60)
                print("✅ ALL TESTS PASSED!")
                print("="*60)
                
            except Exception as e:
                print(f"\n❌ TEST FAILED: {e}")
                import traceback
                traceback.print_exc()
                sys.exit(1)
    
    async def _step_register(self, client: httpx.AsyncClient):
        """Step 1: Register a new user."""
        print("\n📝 Step 1: Registering user...")
        
        response = await client.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
        )
        
        if response.status_code == 400 and "already registered" in response.text.lower():
            print("   ℹ️  User already exists, will login instead")
            return
        
        if response.status_code != 200:
            raise Exception(f"Registration failed: {response.status_code} - {response.text}")
        
        data = response.json()
        self.user_id = data.get("user", {}).get("id")
        print(f"   ✓ User registered: {self.user_id}")
    
    async def _step_login(self, client: httpx.AsyncClient):
        """Step 2: Login to get access token."""
        print("\n🔑 Step 2: Logging in...")
        
        response = await client.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"Login failed: {response.status_code} - {response.text}")
        
        data = response.json()
        self.access_token = data.get("access_token")
        self.user_id = data.get("user", {}).get("id")
        print(f"   ✓ Logged in successfully")
    
    async def _step_update_profile(self, client: httpx.AsyncClient):
        """Step 3: Update user profile (like onboarding step 1)."""
        print("\n👤 Step 3: Updating user profile...")
        
        response = await client.put(
            f"{BASE_URL}/auth/profile",
            headers={"Authorization": f"Bearer {self.access_token}"},
            json={
                "full_name": "Test User",
                "company_name": "Grupo Dissan",
                "job_title": "Marketing Manager",
                "country": "ES",
                "preferred_language": "es"
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"Profile update failed: {response.status_code} - {response.text}")
        
        print(f"   ✓ Profile updated with Spanish language preference")
    
    async def _step_analyze_domain(self, client: httpx.AsyncClient):
        """Step 4: Analyze the domain URL."""
        print(f"\n🔍 Step 4: Analyzing domain {self.domain}...")
        
        response = await client.post(
            f"{BASE_URL}/page-analysis/analyze",
            headers={"Authorization": f"Bearer {self.access_token}"},
            json={
                "url": f"https://{self.domain}",
                "analyze_headings": True,
                "extract_links": True
            }
        )
        
        if response.status_code != 200:
            print(f"   ⚠️  Page analysis failed (non-critical): {response.status_code}")
            return
        
        data = response.json()
        metadata = data.get("metadata", {})
        print(f"   ✓ Page analyzed")
        print(f"     - Title: {metadata.get('title', 'N/A')[:50]}...")
        print(f"     - Description: {metadata.get('description', 'N/A')[:50]}...")
    
    async def _step_create_brand(self, client: httpx.AsyncClient):
        """Step 5: Create brand with initial analysis."""
        print("\n🏢 Step 5: Creating brand...")
        
        response = await client.post(
            f"{BASE_URL}/brands/",
            headers={"Authorization": f"Bearer {self.access_token}"},
            json={
                "domain": self.domain,
                "name": "Grupo Dissan",
                "industry": "Facility Management",
                "description": "Empresa de facility management y mantenimiento integral de instalaciones en España"
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"Brand creation failed: {response.status_code} - {response.text}")
        
        data = response.json()
        self.brand_id = data.get("id")
        print(f"   ✓ Brand created: {self.brand_id}")
    
    async def _step_wait_analysis(self, client: httpx.AsyncClient):
        """Step 6: Wait for analysis to complete."""
        print("\n⏳ Step 6: Waiting for analysis to complete...")
        
        max_wait = 180  # 3 minutes
        start_time = datetime.now()
        poll_interval = 3
        
        while True:
            elapsed = (datetime.now() - start_time).seconds
            
            if elapsed > max_wait:
                raise Exception("Analysis timed out after 3 minutes")
            
            response = await client.get(
                f"{BASE_URL}/analysis/?brand_id={self.brand_id}",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            if response.status_code != 200:
                print(f"   ⚠️  Could not fetch analyses: {response.status_code}")
                await asyncio.sleep(poll_interval)
                continue
            
            analyses = response.json()
            
            if not analyses:
                print(f"   ... Waiting for analysis to start ({elapsed}s)")
                await asyncio.sleep(poll_interval)
                continue
            
            # Check latest analysis status
            latest = analyses[0]
            self.analysis_id = latest.get("id")
            status = latest.get("status")
            
            if status == "completed":
                print(f"   ✓ Analysis completed in {elapsed}s")
                break
            elif status == "failed":
                raise Exception(f"Analysis failed: {latest.get('error', 'Unknown error')}")
            else:
                print(f"   ... Status: {status} ({elapsed}s)")
                await asyncio.sleep(poll_interval)
    
    async def _step_verify_results(self, client: httpx.AsyncClient):
        """Step 7: Verify the analysis results."""
        print("\n✅ Step 7: Verifying results...")
        
        # Get analysis details
        response = await client.get(
            f"{BASE_URL}/analysis/{self.analysis_id}",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        
        if response.status_code != 200:
            raise Exception(f"Could not fetch analysis: {response.status_code}")
        
        analysis = response.json()
        results = analysis.get("results", {})
        
        # Check key fields
        print("\n   📊 Analysis Results:")
        print(f"   - Status: {analysis.get('status')}")
        print(f"   - AI Model: {analysis.get('ai_model')}")
        
        # Check summary
        summary = results.get("summary", "")
        if summary:
            print(f"   - Summary: {summary[:100]}...")
        
        # Check score
        score = results.get("score")
        if score:
            print(f"   - Score: {score}/100")
        
        # Check competitors
        competitors = results.get("competitors", [])
        print(f"\n   🏆 Competitors Found: {len(competitors)}")
        for comp in competitors[:5]:
            name = comp.get("name", "Unknown")
            domain = comp.get("domain", "N/A")
            print(f"      - {name} ({domain})")
        
        # Check recommendations
        recommendations = results.get("recommendations", [])
        print(f"\n   💡 Recommendations: {len(recommendations)}")
        for i, rec in enumerate(recommendations[:3], 1):
            if isinstance(rec, dict):
                print(f"      {i}. {rec.get('title', rec.get('text', 'N/A'))[:60]}...")
            else:
                print(f"      {i}. {str(rec)[:60]}...")
        
        # Check language (should be Spanish)
        input_data = analysis.get("input_data", {})
        lang = input_data.get("preferred_language", "unknown")
        print(f"\n   🌐 Language: {lang}")
        
        # Verify Spanish content if language is 'es'
        if lang == "es" and summary:
            spanish_indicators = ["el", "la", "de", "en", "que", "para", "es", "una", "los"]
            has_spanish = any(f" {ind} " in summary.lower() for ind in spanish_indicators)
            if has_spanish:
                print("   ✓ Content appears to be in Spanish")
            else:
                print("   ⚠️  Content may not be in Spanish")
    
    async def _cleanup(self, client: httpx.AsyncClient):
        """Clean up test data."""
        print("\n🧹 Cleaning up test data...")
        
        if self.brand_id:
            response = await client.delete(
                f"{BASE_URL}/brands/{self.brand_id}",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            if response.status_code == 200:
                print(f"   ✓ Deleted brand: {self.brand_id}")
            else:
                print(f"   ⚠️  Could not delete brand: {response.status_code}")


async def main():
    parser = argparse.ArgumentParser(description="Onboarding E2E Test")
    parser.add_argument("--cleanup", action="store_true", help="Delete test data after running")
    parser.add_argument("--domain", default="grupodissan.com", help="Domain to test")
    parser.add_argument("--skip-api", action="store_true", help="Skip API tests, only test local services")
    args = parser.parse_args()
    
    if args.skip_api:
        # Only test local services (page analysis, AI inference, competitor search)
        await test_local_services(args.domain)
    else:
        # Full API test
        runner = OnboardingTestRunner(domain=args.domain, cleanup=args.cleanup)
        await runner.run()


if __name__ == "__main__":
    asyncio.run(main())
