"""
E-E-A-T Signal Analyzer Service - Analyze Experience, Expertise, Authoritativeness, Trust signals.

Google's E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) guidelines
are increasingly important for AI visibility. This service analyzes and scores E-E-A-T signals.

Key Features:
- Experience signals (first-hand, demonstrated expertise)
- Expertise signals (credentials, depth of knowledge)
- Authoritativeness signals (recognition, citations, backlinks)
- Trust signals (transparency, reviews, security)
"""

import re
import logging
from typing import Dict, Any, List, Optional
from bs4 import BeautifulSoup
import httpx
from urllib.parse import urlparse

from app.core.config import settings

logger = logging.getLogger(__name__)


class EEATSignalAnalyzerService:
    """
    Service to analyze E-E-A-T signals for AEO/GEO optimization.
    
    E-E-A-T is critical for AI engines to determine content quality
    and whether to cite/recommend a source.
    """
    
    # Author credential patterns
    CREDENTIAL_PATTERNS = [
        r'\b(PhD|Ph\.D\.|Dr\.|MD|M\.D\.|MBA|JD|CPA|CFA|PMP|PE|Esq\.)\b',
        r'\b(certified|licensed|registered|accredited)\b',
        r'\b(expert|specialist|consultant|advisor|professional)\b',
        r'\b(\d+\+?\s*years?\s*(of\s*)?experience)\b',
        r'\b(author|writer|editor|contributor)\s+at\b',
        r'\b(founder|ceo|cto|coo|director|manager)\b',
    ]
    
    # Trust signals
    TRUST_INDICATORS = {
        'security': ['https', 'ssl', 'secure', 'encrypted'],
        'transparency': ['about', 'contact', 'team', 'who we are'],
        'policies': ['privacy', 'terms', 'cookie', 'disclaimer'],
        'social_proof': ['testimonial', 'review', 'rating', 'customer'],
        'credentials': ['certified', 'accredited', 'verified', 'approved'],
    }
    
    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={'User-Agent': 'Mentha-EEAT-Analyzer/1.0'}
        )
    
    async def analyze_eeat_signals(
        self,
        url: str = None,
        html_content: str = None,
        brand_name: str = "",
        domain: str = ""
    ) -> Dict[str, Any]:
        """
        Perform comprehensive E-E-A-T signal analysis.
        
        Args:
            url: URL to analyze
            html_content: Raw HTML content
            brand_name: Brand name for context
            domain: Domain for additional checks
            
        Returns:
            E-E-A-T analysis results with scores and recommendations
        """
        if url and not html_content:
            try:
                response = await self.client.get(url)
                html_content = response.text
                if not domain:
                    domain = urlparse(url).netloc
            except Exception as e:
                return {"error": f"Failed to fetch URL: {e}"}
        
        if not html_content:
            return {"error": "No content provided"}
        
        logger.info(f"[EEAT] Starting E-E-A-T analysis for: {url or domain}")
        logger.info(f"[EEAT] Brand: {brand_name}")
        
        soup = BeautifulSoup(html_content, 'lxml')
        
        results = {
            "url": url,
            "domain": domain,
            "brand_name": brand_name,
            "experience": await self._analyze_experience(soup, domain),
            "expertise": self._analyze_expertise(soup),
            "authoritativeness": await self._analyze_authoritativeness(soup, domain, brand_name),
            "trustworthiness": self._analyze_trustworthiness(soup, url or domain),
            "overall_score": 0,
            "grade": "F",
            "recommendations": []
        }
        
        # Calculate overall score
        results["overall_score"] = self._calculate_overall_score(results)
        results["grade"] = self._score_to_grade(results["overall_score"])
        
        # Generate recommendations
        results["recommendations"] = self._generate_eeat_recommendations(results)
        
        logger.info(f"[EEAT] Analysis complete. Score: {results['overall_score']}, Grade: {results['grade']}")
        logger.info(f"[EEAT] Experience: {results['experience']['score']}, Expertise: {results['expertise']['score']}, Auth: {results['authoritativeness']['score']}, Trust: {results['trustworthiness']['score']}")
        
        return results
    
    async def _analyze_experience(
        self,
        soup: BeautifulSoup,
        domain: str
    ) -> Dict[str, Any]:
        """Analyze Experience signals (first-hand, demonstrated expertise)."""
        analysis = {
            "score": 0,
            "signals_found": [],
            "issues": [],
            "first_person_narratives": False,
            "case_studies": False,
            "original_research": False,
            "practical_examples": False,
            "user_generated_content": False
        }
        
        text_content = soup.get_text(separator=' ').lower()
        
        # Check for first-person experience indicators
        first_person_patterns = [
            r'\b(i have|i\'ve|we have|we\'ve)\s+(used|tested|tried|experienced|worked)',
            r'\b(in my experience|from my experience|based on my experience)',
            r'\b(i recommend|we recommend|i suggest|we suggest)',
            r'\b(i found|we found|i discovered|we discovered)',
            r'\b(after (using|testing|trying))',
        ]
        
        for pattern in first_person_patterns:
            if re.search(pattern, text_content):
                analysis["first_person_narratives"] = True
                analysis["signals_found"].append("First-person experience narratives")
                break
        
        # Check for case studies
        case_study_indicators = ['case study', 'case studies', 'success story', 'client story', 'customer story']
        if any(indicator in text_content for indicator in case_study_indicators):
            analysis["case_studies"] = True
            analysis["signals_found"].append("Case studies present")
        
        # Check for original research/data
        research_indicators = ['our research', 'our study', 'we surveyed', 'we analyzed', 'our data shows', 'original research']
        if any(indicator in text_content for indicator in research_indicators):
            analysis["original_research"] = True
            analysis["signals_found"].append("Original research/data")
        
        # Check for practical examples
        example_patterns = [
            r'\b(for example|here\'s an example|example:|as an example)',
            r'\b(step by step|how to|tutorial)',
            r'\b(practical|hands-on|real-world)',
        ]
        for pattern in example_patterns:
            if re.search(pattern, text_content):
                analysis["practical_examples"] = True
                analysis["signals_found"].append("Practical examples")
                break
        
        # Check for reviews/testimonials (UGC)
        ugc_sections = soup.find_all(class_=re.compile(r'review|testimonial|feedback|comment', re.I))
        if ugc_sections:
            analysis["user_generated_content"] = True
            analysis["signals_found"].append("User-generated content/reviews")
        
        # Calculate score
        score = 0
        if analysis["first_person_narratives"]:
            score += 25
        if analysis["case_studies"]:
            score += 25
        if analysis["original_research"]:
            score += 20
        if analysis["practical_examples"]:
            score += 15
        if analysis["user_generated_content"]:
            score += 15
        
        analysis["score"] = score
        
        # Issues
        if not analysis["first_person_narratives"]:
            analysis["issues"].append("No first-person experience narratives found")
        if not analysis["case_studies"] and not analysis["practical_examples"]:
            analysis["issues"].append("No case studies or practical examples")
        
        return analysis
    
    def _analyze_expertise(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Analyze Expertise signals (credentials, knowledge depth)."""
        analysis = {
            "score": 0,
            "signals_found": [],
            "issues": [],
            "author_info_present": False,
            "credentials_found": [],
            "author_bio": False,
            "expert_content_indicators": False,
            "citations_references": False,
            "date_information": False
        }
        
        text_content = soup.get_text(separator=' ')
        
        # Check for author information
        author_elements = soup.find_all(class_=re.compile(r'author|byline|writer|contributor', re.I))
        author_elements += soup.find_all(rel='author')
        author_elements += soup.find_all(itemprop='author')
        
        if author_elements:
            analysis["author_info_present"] = True
            analysis["signals_found"].append("Author information present")
            
            # Check for author bio
            bio_elements = soup.find_all(class_=re.compile(r'author-bio|about-author|author-description', re.I))
            if bio_elements:
                analysis["author_bio"] = True
                analysis["signals_found"].append("Author bio present")
        
        # Check for credentials
        for pattern in self.CREDENTIAL_PATTERNS:
            matches = re.findall(pattern, text_content, re.I)
            if matches:
                analysis["credentials_found"].extend(matches[:5])
        
        if analysis["credentials_found"]:
            analysis["signals_found"].append(f"Credentials found: {', '.join(set(analysis['credentials_found'][:3]))}")
        
        # Check for expert content indicators
        expert_indicators = [
            r'\b(research shows|studies indicate|according to|data suggests)',
            r'\b(methodology|analysis|framework|model)',
            r'\b(comprehensive|in-depth|detailed|thorough)',
            r'\b(expert|specialist|professional)\s+\w+',
        ]
        
        for pattern in expert_indicators:
            if re.search(pattern, text_content, re.I):
                analysis["expert_content_indicators"] = True
                analysis["signals_found"].append("Expert content language")
                break
        
        # Check for citations/references
        citations_indicators = soup.find_all('cite') or soup.find_all(class_=re.compile(r'citation|reference|source', re.I))
        footnotes = soup.find_all(class_=re.compile(r'footnote|endnote', re.I))
        external_links = [a for a in soup.find_all('a', href=True) if 'http' in a.get('href', '')]
        
        if citations_indicators or footnotes or len(external_links) >= 3:
            analysis["citations_references"] = True
            analysis["signals_found"].append("Citations/references present")
        
        # Check for date/freshness
        date_elements = soup.find_all(class_=re.compile(r'date|publish|updated|modified', re.I))
        time_elements = soup.find_all('time')
        
        if date_elements or time_elements:
            analysis["date_information"] = True
            analysis["signals_found"].append("Publication date present")
        
        # Calculate score
        score = 0
        if analysis["author_info_present"]:
            score += 20
        if analysis["author_bio"]:
            score += 15
        if analysis["credentials_found"]:
            score += 20
        if analysis["expert_content_indicators"]:
            score += 15
        if analysis["citations_references"]:
            score += 15
        if analysis["date_information"]:
            score += 15
        
        analysis["score"] = score
        
        # Issues
        if not analysis["author_info_present"]:
            analysis["issues"].append("No author information found")
        if not analysis["date_information"]:
            analysis["issues"].append("No publication/update date found")
        
        return analysis
    
    async def _analyze_authoritativeness(
        self,
        soup: BeautifulSoup,
        domain: str,
        brand_name: str
    ) -> Dict[str, Any]:
        """Analyze Authoritativeness signals (recognition, citations)."""
        analysis = {
            "score": 0,
            "signals_found": [],
            "issues": [],
            "brand_mentions": False,
            "industry_recognition": False,
            "media_coverage": False,
            "backlink_indicators": False,
            "social_proof": False,
            "awards_certifications": False
        }
        
        text_content = soup.get_text(separator=' ').lower()
        
        # Check for brand consistency
        if brand_name and brand_name.lower() in text_content:
            analysis["brand_mentions"] = True
            analysis["signals_found"].append("Brand mentioned consistently")
        
        # Check for industry recognition
        recognition_patterns = [
            r'\b(award|awarded|recognized|featured in|as seen in|mentioned in)',
            r'\b(industry leader|market leader|leading provider)',
            r'\b(trusted by|used by|chosen by)\s+\d+',
            r'\b(partner|partnership|collaboration)\s+with',
        ]
        
        for pattern in recognition_patterns:
            if re.search(pattern, text_content):
                analysis["industry_recognition"] = True
                analysis["signals_found"].append("Industry recognition signals")
                break
        
        # Check for media coverage indicators
        media_indicators = ['press', 'news', 'media', 'coverage', 'featured', 'interviewed']
        press_sections = soup.find_all(class_=re.compile(r'press|media|news|featured', re.I))
        
        if any(indicator in text_content for indicator in media_indicators) or press_sections:
            analysis["media_coverage"] = True
            analysis["signals_found"].append("Media coverage indicators")
        
        # Check for social proof
        social_proof_elements = soup.find_all(class_=re.compile(r'social-proof|logo-bar|client|partner|customer', re.I))
        testimonials = soup.find_all(class_=re.compile(r'testimonial|review|quote', re.I))
        
        if social_proof_elements or testimonials:
            analysis["social_proof"] = True
            analysis["signals_found"].append("Social proof elements")
        
        # Check for awards/certifications
        awards_patterns = [
            r'\b(award|certification|certified|accredited|badge)',
            r'\b(iso|soc|hipaa|gdpr|pci)',
            r'\b(best|top|leading)\s+\d{4}',
        ]
        
        awards_sections = soup.find_all(class_=re.compile(r'award|certification|badge|trust', re.I))
        
        if awards_sections or any(re.search(p, text_content) for p in awards_patterns):
            analysis["awards_certifications"] = True
            analysis["signals_found"].append("Awards/certifications displayed")
        
        # Check backlink indicators (external sites linking to this)
        try:
            from ddgs import DDGS
            
            with DDGS() as ddgs:
                query = f'link:{domain}' if domain else f'"{brand_name}" site'
                results = list(ddgs.text(query, max_results=5))
                if len(results) >= 2:
                    analysis["backlink_indicators"] = True
                    analysis["signals_found"].append("External backlinks detected")
        except:
            pass
        
        # Calculate score
        score = 0
        if analysis["brand_mentions"]:
            score += 10
        if analysis["industry_recognition"]:
            score += 20
        if analysis["media_coverage"]:
            score += 20
        if analysis["social_proof"]:
            score += 20
        if analysis["awards_certifications"]:
            score += 15
        if analysis["backlink_indicators"]:
            score += 15
        
        analysis["score"] = score
        
        # Issues
        if not analysis["social_proof"]:
            analysis["issues"].append("No social proof elements (testimonials, client logos)")
        if not analysis["industry_recognition"]:
            analysis["issues"].append("No industry recognition signals")
        
        return analysis
    
    def _analyze_trustworthiness(
        self,
        soup: BeautifulSoup,
        url_or_domain: str
    ) -> Dict[str, Any]:
        """Analyze Trustworthiness signals (transparency, security)."""
        analysis = {
            "score": 0,
            "signals_found": [],
            "issues": [],
            "https_enabled": False,
            "privacy_policy": False,
            "terms_of_service": False,
            "contact_info": False,
            "about_page": False,
            "physical_address": False,
            "clear_attribution": False,
            "no_deceptive_elements": True
        }
        
        text_content = soup.get_text(separator=' ').lower()
        
        # Check HTTPS
        if url_or_domain and url_or_domain.startswith('https'):
            analysis["https_enabled"] = True
            analysis["signals_found"].append("HTTPS enabled")
        
        # Check for essential trust pages (via links)
        all_links = soup.find_all('a', href=True)
        link_texts = [a.get_text(strip=True).lower() for a in all_links]
        link_hrefs = [a.get('href', '').lower() for a in all_links]
        
        # Privacy policy
        if any('privacy' in l for l in link_texts + link_hrefs):
            analysis["privacy_policy"] = True
            analysis["signals_found"].append("Privacy policy linked")
        
        # Terms of service
        if any(t in ' '.join(link_texts + link_hrefs) for t in ['terms', 'tos', 'conditions']):
            analysis["terms_of_service"] = True
            analysis["signals_found"].append("Terms of service linked")
        
        # Contact information
        contact_patterns = [
            r'\b(contact|email|phone|call us|reach us)',
            r'\b[\w.+-]+@[\w-]+\.[\w.-]+\b',  # Email pattern
            r'\b\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b',  # Phone pattern
        ]
        
        if any('contact' in l for l in link_texts + link_hrefs) or \
           any(re.search(p, text_content) for p in contact_patterns):
            analysis["contact_info"] = True
            analysis["signals_found"].append("Contact information available")
        
        # About page
        if any('about' in l for l in link_texts + link_hrefs):
            analysis["about_page"] = True
            analysis["signals_found"].append("About page linked")
        
        # Physical address
        address_pattern = r'\b\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|court|ct)[\s,]+[\w\s]+,?\s*[a-z]{2}\s*\d{5}\b'
        if re.search(address_pattern, text_content, re.I):
            analysis["physical_address"] = True
            analysis["signals_found"].append("Physical address provided")
        
        # Clear attribution (schema.org Organization)
        jsonld_scripts = soup.find_all('script', type='application/ld+json')
        for script in jsonld_scripts:
            try:
                import json
                data = json.loads(script.string)
                if isinstance(data, dict) and data.get('@type') in ['Organization', 'LocalBusiness', 'Corporation']:
                    analysis["clear_attribution"] = True
                    analysis["signals_found"].append("Organization schema present")
                    break
            except:
                continue
        
        # Check for deceptive elements
        deceptive_patterns = [
            r'\b(limited time|act now|buy now|only \d+ left)',
            r'\b(guaranteed|100% free|no risk)',
            r'\b(secret|hidden|exclusive offer)',
        ]
        
        deceptive_count = sum(1 for p in deceptive_patterns if re.search(p, text_content, re.I))
        if deceptive_count >= 3:
            analysis["no_deceptive_elements"] = False
            analysis["issues"].append("Multiple potentially deceptive elements detected")
        
        # Calculate score
        score = 0
        if analysis["https_enabled"]:
            score += 15
        if analysis["privacy_policy"]:
            score += 15
        if analysis["terms_of_service"]:
            score += 10
        if analysis["contact_info"]:
            score += 15
        if analysis["about_page"]:
            score += 10
        if analysis["physical_address"]:
            score += 15
        if analysis["clear_attribution"]:
            score += 10
        if analysis["no_deceptive_elements"]:
            score += 10
        
        analysis["score"] = score
        
        # Issues
        if not analysis["https_enabled"]:
            analysis["issues"].append("HTTPS not enabled")
        if not analysis["privacy_policy"]:
            analysis["issues"].append("No privacy policy found")
        if not analysis["contact_info"]:
            analysis["issues"].append("No clear contact information")
        
        return analysis
    
    def _calculate_overall_score(self, results: Dict[str, Any]) -> float:
        """Calculate overall E-E-A-T score."""
        weights = {
            "experience": 0.25,
            "expertise": 0.25,
            "authoritativeness": 0.25,
            "trustworthiness": 0.25
        }
        
        total_score = 0
        for category, weight in weights.items():
            category_data = results.get(category, {})
            score = category_data.get("score", 0)
            total_score += score * weight
        
        return round(total_score, 1)
    
    def _score_to_grade(self, score: float) -> str:
        """Convert numeric score to letter grade."""
        if score >= 90:
            return "A+"
        elif score >= 85:
            return "A"
        elif score >= 80:
            return "A-"
        elif score >= 75:
            return "B+"
        elif score >= 70:
            return "B"
        elif score >= 65:
            return "B-"
        elif score >= 60:
            return "C+"
        elif score >= 55:
            return "C"
        elif score >= 50:
            return "C-"
        elif score >= 45:
            return "D+"
        elif score >= 40:
            return "D"
        else:
            return "F"
    
    def _generate_eeat_recommendations(self, results: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate E-E-A-T improvement recommendations."""
        recommendations = []
        
        # Experience recommendations
        experience = results.get("experience", {})
        if experience.get("score", 0) < 50:
            if not experience.get("first_person_narratives"):
                recommendations.append({
                    "priority": "high",
                    "category": "experience",
                    "title": "Add First-Hand Experience",
                    "description": "Include personal experiences, case studies, or real-world examples. Use phrases like 'In my experience...' or 'When we tested...' to demonstrate hands-on knowledge."
                })
            if not experience.get("case_studies"):
                recommendations.append({
                    "priority": "medium",
                    "category": "experience",
                    "title": "Add Case Studies",
                    "description": "Create case studies or success stories that demonstrate practical experience with your subject matter."
                })
        
        # Expertise recommendations
        expertise = results.get("expertise", {})
        if expertise.get("score", 0) < 50:
            if not expertise.get("author_info_present"):
                recommendations.append({
                    "priority": "critical",
                    "category": "expertise",
                    "title": "Add Author Information",
                    "description": "Add clear author bylines with credentials. AI engines value content from identifiable experts."
                })
            if not expertise.get("author_bio"):
                recommendations.append({
                    "priority": "high",
                    "category": "expertise",
                    "title": "Add Author Bios",
                    "description": "Include detailed author bios highlighting qualifications, experience, and expertise in the topic."
                })
            if not expertise.get("citations_references"):
                recommendations.append({
                    "priority": "medium",
                    "category": "expertise",
                    "title": "Add Citations and References",
                    "description": "Include citations to authoritative sources. Link to research, studies, or expert opinions to support your content."
                })
        
        # Authoritativeness recommendations
        authority = results.get("authoritativeness", {})
        if authority.get("score", 0) < 50:
            if not authority.get("social_proof"):
                recommendations.append({
                    "priority": "high",
                    "category": "authoritativeness",
                    "title": "Add Social Proof",
                    "description": "Display client testimonials, customer logos, review ratings, or case studies to demonstrate authority."
                })
            if not authority.get("media_coverage"):
                recommendations.append({
                    "priority": "medium",
                    "category": "authoritativeness",
                    "title": "Highlight Media Coverage",
                    "description": "If you have press coverage, create a 'Press' or 'As seen in' section. Seek opportunities for media mentions."
                })
        
        # Trustworthiness recommendations
        trust = results.get("trustworthiness", {})
        if trust.get("score", 0) < 50:
            if not trust.get("https_enabled"):
                recommendations.append({
                    "priority": "critical",
                    "category": "trust",
                    "title": "Enable HTTPS",
                    "description": "Secure your site with HTTPS. This is essential for trust and required by modern browsers."
                })
            if not trust.get("privacy_policy"):
                recommendations.append({
                    "priority": "high",
                    "category": "trust",
                    "title": "Add Privacy Policy",
                    "description": "Add a comprehensive privacy policy. This is legally required in many jurisdictions and builds trust."
                })
            if not trust.get("contact_info"):
                recommendations.append({
                    "priority": "high",
                    "category": "trust",
                    "title": "Improve Contact Information",
                    "description": "Make contact information easily accessible. Include email, phone, and physical address if applicable."
                })
            if not trust.get("clear_attribution"):
                recommendations.append({
                    "priority": "medium",
                    "category": "trust",
                    "title": "Add Organization Schema",
                    "description": "Add Organization schema markup to clearly identify your business entity to search engines and AI."
                })
        
        # Sort by priority
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        recommendations.sort(key=lambda x: priority_order.get(x.get("priority", "low"), 4))
        
        return recommendations
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Singleton instance
_eeat_analyzer: Optional[EEATSignalAnalyzerService] = None

def get_eeat_analyzer() -> EEATSignalAnalyzerService:
    """Get singleton instance of EEATSignalAnalyzerService."""
    global _eeat_analyzer
    if _eeat_analyzer is None:
        _eeat_analyzer = EEATSignalAnalyzerService()
    return _eeat_analyzer
