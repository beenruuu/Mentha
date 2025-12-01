"""
Test script for Technical AEO Service
"""

import asyncio
from app.services.analysis.technical_aeo_service import TechnicalAEOService


async def test_technical_aeo():
    """Test the technical AEO service with real domains"""
    service = TechnicalAEOService()
    
    # Test domains
    test_domains = [
        'tesla.com',
        'apple.com',
        'techcrunch.com'
    ]
    
    print("=" * 70)
    print("TECHNICAL AEO AUDIT TEST")
    print("=" * 70)
    
    for domain in test_domains:
        print(f"\n{'=' * 70}")
        print(f"Auditing: {domain}")
        print(f"{'=' * 70}\n")
        
        try:
            result = await service.audit_domain(domain)
            
            # Display results
            print(f"🎯 AEO Readiness Score: {result['aeo_readiness_score']}/100\n")
            
            # Crawler permissions
            print("🤖 AI CRAWLER PERMISSIONS:")
            crawlers = result['ai_crawler_permissions'].get('crawlers', {})
            for bot, status in crawlers.items():
                emoji = "✅" if status in ('allowed', 'not_specified') else "❌"
                print(f"   {emoji} {bot}: {status}")
            
            # Structured data
            print(f"\n📊 STRUCTURED DATA:")
            schemas = result['structured_data']
            print(f"   Total schemas: {schemas.get('total_schemas', 0)}")
            print(f"   Has FAQ: {schemas.get('has_faq', False)}")
            print(f"   Has HowTo: {schemas.get('has_howto', False)}")
            print(f"   Has Article: {schemas.get('has_article', False)}")
            if schemas.get('schema_types'):
                print(f"   Schema types: {', '.join(schemas['schema_types'][:5])}")
            
            # Technical signals
            print(f"\n🔧 TECHNICAL SIGNALS:")
            tech = result['technical_signals']
            print(f"   HTTPS: {tech.get('https', False)}")
            print(f"   Mobile viewport: {tech.get('has_viewport', False)}")
            print(f"   RSS feed: {tech.get('has_rss_feed', False)}")
            print(f"   API available: {tech.get('potential_api', False)}")
            if 'response_time_ms' in tech:
                print(f"   Response time: {tech['response_time_ms']}ms")
            
            # Recommendations
            print(f"\n💡 RECOMMENDATIONS ({len(result['recommendations'])}):")
            for i, rec in enumerate(result['recommendations'][:3], 1):
                priority_emoji = {
                    'critical': '🔴',
                    'high': '🟠',
                    'medium': '🟡',
                    'low': '🟢'
                }.get(rec['priority'], '⚪')
                print(f"   {i}. {priority_emoji} [{rec['priority'].upper()}] {rec['title']}")
                print(f"      {rec['description']}")
            
        except Exception as e:
            print(f"❌ Error auditing {domain}: {e}")
    
    await service.close()
    print(f"\n{'=' * 70}")
    print("✅ Test completed!")
    print(f"{'=' * 70}\n")


if __name__ == "__main__":
    asyncio.run(test_technical_aeo())
