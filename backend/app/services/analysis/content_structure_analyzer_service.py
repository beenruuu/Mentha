"""
Content Structure Analyzer Service - Deep analysis of content structure for AEO/GEO optimization.

This service analyzes how content is structured for AI extractability, including:
- FAQ detection and quality assessment
- How-To content structure
- Definition and entity clarity
- Information hierarchy
- Snippet optimization
- Table and list structure quality
"""

import re
import logging
from typing import Dict, Any, List, Optional, Tuple
from bs4 import BeautifulSoup, NavigableString
import httpx

logger = logging.getLogger(__name__)


class ContentStructureAnalyzerService:
    """
    Deep content structure analysis for AEO optimization.
    
    Analyzes content to determine how well it's structured for
    AI extraction and citation.
    """
    
    # Question patterns for FAQ detection
    QUESTION_PATTERNS = [
        r'^what\s+(?:is|are|was|were|do|does|did|can|could|would|should)',
        r'^how\s+(?:to|do|does|can|could|would|should|much|many|long|often)',
        r'^why\s+(?:is|are|do|does|did|should|would|can)',
        r'^when\s+(?:is|are|do|does|did|should|would|can)',
        r'^where\s+(?:is|are|do|does|did|can|could)',
        r'^who\s+(?:is|are|was|were|can|could|should)',
        r'^which\s+(?:is|are|one|ones)',
        r'^can\s+(?:i|you|we|they)',
        r'^is\s+(?:it|this|that|there)',
        r'^does\s+',
        r'^do\s+(?:i|you|we|they)',
        r'.+\?$',
    ]
    
    # How-to step patterns
    STEP_PATTERNS = [
        r'^step\s*\d+',
        r'^\d+\.\s+',
        r'^first,?\s+',
        r'^next,?\s+',
        r'^then,?\s+',
        r'^finally,?\s+',
        r'^after\s+(?:that|this)',
    ]
    
    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={'User-Agent': 'Mentha-Content-Analyzer/1.0'}
        )
    
    async def analyze_content_structure(
        self,
        url: str = None,
        html_content: str = None
    ) -> Dict[str, Any]:
        """
        Perform comprehensive content structure analysis.
        
        Args:
            url: URL to analyze (fetches content)
            html_content: Raw HTML to analyze (alternative to URL)
            
        Returns:
            Detailed structure analysis results
        """
        if url and not html_content:
            try:
                # Try Firecrawl first for better content extraction
                from app.core.config import settings
                if settings.FIRECRAWL_API_KEY:
                    try:
                        from app.services.firecrawl_service import FirecrawlService
                        firecrawl = FirecrawlService()
                        logger.info(f"[CONTENT] Using Firecrawl to fetch {url}")
                        # Use both markdown and html formats
                        data = await firecrawl.scrape_url(url, formats=["markdown", "html"])
                        await firecrawl.close()
                        
                        if data.get('success'):
                            # Prefer HTML for BeautifulSoup analysis
                            raw_data = data.get('data', {})
                            if 'html' in raw_data:
                                html_content = raw_data['html']
                                logger.info("[CONTENT] Successfully fetched HTML via Firecrawl")
                            elif 'markdown' in raw_data:
                                # Convert markdown to HTML for analysis (basic)
                                logger.info("[CONTENT] Got markdown from Firecrawl, will use HTTP fallback for HTML")
                    except Exception as fc_error:
                        logger.warning(f"[CONTENT] Firecrawl fetch failed: {fc_error}")

                # Fallback to standard HTTP fetch if no content yet
                if not html_content:
                    response = await self.client.get(url)
                    html_content = response.text
            except Exception as e:
                return {"error": f"Failed to fetch URL: {e}"}
        
        if not html_content:
            return {"error": "No content provided"}
        
        logger.info(f"[CONTENT] Starting content structure analysis for: {url or 'provided HTML'}")
        
        soup = BeautifulSoup(html_content, 'lxml')
        
        # Remove script and style elements
        for element in soup(['script', 'style', 'nav', 'footer', 'header']):
            element.decompose()
        
        results = {
            "url": url,
            "faq_analysis": self._analyze_faq_structure(soup),
            "howto_analysis": self._analyze_howto_structure(soup),
            "definition_analysis": self._analyze_definitions(soup),
            "hierarchy_analysis": self._analyze_hierarchy(soup),
            "snippet_optimization": self._analyze_snippet_potential(soup),
            "list_table_analysis": self._analyze_lists_tables(soup),
            "list_table_analysis": self._analyze_lists_tables(soup),
            "entity_clarity": self._analyze_entity_clarity(soup),
            "speakability_analysis": self._analyze_speakability(soup),
            "aeo_signals": await self._analyze_aeo_signals(url, soup),
            "overall_structure_score": 0,
            "recommendations": []
        }
        
        # Calculate overall score
        results["overall_structure_score"] = self._calculate_structure_score(results)
        
        # Generate recommendations
        results["recommendations"] = self._generate_structure_recommendations(results)
        
        logger.info(f"[CONTENT] Analysis complete. Structure score: {results['overall_structure_score']}")
        logger.info(f"[CONTENT] FAQ pairs: {results['faq_analysis'].get('qa_pairs_found', 0)}, How-To steps: {results['howto_analysis'].get('total_howtos', 0)}")
        
        return results
    
    def _analyze_faq_structure(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Analyze FAQ content structure."""
        analysis = {
            "has_faq_section": False,
            "qa_pairs_found": 0,
            "faq_schema_present": False,
            "questions": [],
            "quality_score": 0,
            "issues": []
        }
        
        # Check for FAQ schema
        jsonld_scripts = soup.find_all('script', type='application/ld+json')
        for script in jsonld_scripts:
            try:
                import json
                data = json.loads(script.string)
                if isinstance(data, dict):
                    if data.get('@type') == 'FAQPage':
                        analysis["faq_schema_present"] = True
                        analysis["has_faq_section"] = True
                elif isinstance(data, list):
                    for item in data:
                        if item.get('@type') == 'FAQPage':
                            analysis["faq_schema_present"] = True
                            analysis["has_faq_section"] = True
            except:
                continue
        
        # Look for FAQ sections by common patterns
        faq_indicators = ['faq', 'frequently-asked', 'questions', 'q&a', 'q-and-a']
        
        for indicator in faq_indicators:
            faq_section = soup.find(id=re.compile(indicator, re.I)) or \
                         soup.find(class_=re.compile(indicator, re.I))
            if faq_section:
                analysis["has_faq_section"] = True
                break
        
        # Find question-like headings and content
        questions = []
        
        # Check headings
        for heading in soup.find_all(['h2', 'h3', 'h4']):
            text = heading.get_text(strip=True).lower()
            for pattern in self.QUESTION_PATTERNS:
                if re.match(pattern, text, re.I):
                    # Find answer (next sibling paragraph or div)
                    answer = ""
                    next_elem = heading.find_next_sibling()
                    if next_elem and next_elem.name in ['p', 'div']:
                        answer = next_elem.get_text(strip=True)
                    
                    questions.append({
                        "question": heading.get_text(strip=True),
                        "has_answer": bool(answer),
                        "answer_length": len(answer)
                    })
                    break
        
        # Check details/summary elements (accordion-style FAQs)
        for details in soup.find_all('details'):
            summary = details.find('summary')
            if summary:
                content = details.get_text(strip=True).replace(summary.get_text(), '')
                questions.append({
                    "question": summary.get_text(strip=True),
                    "has_answer": bool(content),
                    "answer_length": len(content)
                })
        
        analysis["qa_pairs_found"] = len(questions)
        analysis["questions"] = questions[:10]  # Limit to 10
        
        # Quality assessment
        if analysis["qa_pairs_found"] > 0:
            avg_answer_length = sum(q["answer_length"] for q in questions if q["has_answer"]) / len(questions)
            
            quality = 0
            if analysis["faq_schema_present"]:
                quality += 30
            if analysis["qa_pairs_found"] >= 5:
                quality += 20
            elif analysis["qa_pairs_found"] >= 3:
                quality += 10
            if avg_answer_length > 100:
                quality += 25
            elif avg_answer_length > 50:
                quality += 15
            if all(q["has_answer"] for q in questions):
                quality += 25
            
            analysis["quality_score"] = quality
        
        # Issues
        if not analysis["faq_schema_present"] and analysis["qa_pairs_found"] > 0:
            analysis["issues"].append("FAQ content found but missing FAQ schema markup")
        if analysis["qa_pairs_found"] > 0:
            orphan_questions = sum(1 for q in questions if not q["has_answer"])
            if orphan_questions > 0:
                analysis["issues"].append(f"{orphan_questions} questions without clear answers")
        
        return analysis
    
    def _analyze_howto_structure(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Analyze How-To content structure."""
        analysis = {
            "has_howto_content": False,
            "howto_schema_present": False,
            "steps_found": 0,
            "steps": [],
            "has_numbered_steps": False,
            "quality_score": 0,
            "issues": []
        }
        
        # Check for HowTo schema
        jsonld_scripts = soup.find_all('script', type='application/ld+json')
        for script in jsonld_scripts:
            try:
                import json
                data = json.loads(script.string)
                if isinstance(data, dict) and data.get('@type') == 'HowTo':
                    analysis["howto_schema_present"] = True
                    analysis["has_howto_content"] = True
            except:
                continue
        
        # Look for how-to patterns in headings
        howto_patterns = ['how to', 'how-to', 'guide', 'tutorial', 'steps to', 'instructions']
        
        for heading in soup.find_all(['h1', 'h2']):
            text = heading.get_text(strip=True).lower()
            if any(p in text for p in howto_patterns):
                analysis["has_howto_content"] = True
                break
        
        # Find numbered/ordered lists
        ordered_lists = soup.find_all('ol')
        for ol in ordered_lists:
            items = ol.find_all('li')
            if len(items) >= 3:  # Likely a steps list
                analysis["has_numbered_steps"] = True
                for i, item in enumerate(items[:10], 1):
                    analysis["steps"].append({
                        "step_number": i,
                        "text": item.get_text(strip=True)[:200],
                        "has_details": len(item.get_text(strip=True)) > 50
                    })
        
        # Look for step-pattern headings
        step_headings = []
        for heading in soup.find_all(['h2', 'h3', 'h4']):
            text = heading.get_text(strip=True).lower()
            for pattern in self.STEP_PATTERNS:
                if re.match(pattern, text, re.I):
                    step_headings.append(heading.get_text(strip=True))
                    break
        
        if step_headings and not analysis["steps"]:
            for i, step in enumerate(step_headings[:10], 1):
                analysis["steps"].append({
                    "step_number": i,
                    "text": step,
                    "has_details": True
                })
        
        analysis["steps_found"] = len(analysis["steps"])
        
        # Quality assessment
        if analysis["has_howto_content"]:
            quality = 0
            if analysis["howto_schema_present"]:
                quality += 35
            if analysis["has_numbered_steps"]:
                quality += 25
            if analysis["steps_found"] >= 5:
                quality += 20
            elif analysis["steps_found"] >= 3:
                quality += 10
            if all(s.get("has_details") for s in analysis["steps"]):
                quality += 20
            
            analysis["quality_score"] = quality
        
        # Issues
        if analysis["has_howto_content"] and not analysis["howto_schema_present"]:
            analysis["issues"].append("How-to content found but missing HowTo schema markup")
        if analysis["has_howto_content"] and not analysis["has_numbered_steps"]:
            analysis["issues"].append("How-to content should use numbered/ordered steps")
        
        return analysis
    
    def _analyze_definitions(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Analyze definition-style content for entity clarity."""
        analysis = {
            "definitions_found": 0,
            "definition_patterns": [],
            "uses_definition_lists": False,
            "clear_topic_introduction": False,
            "quality_score": 0
        }
        
        # Check for definition lists (dl/dt/dd)
        def_lists = soup.find_all('dl')
        if def_lists:
            analysis["uses_definition_lists"] = True
            for dl in def_lists:
                terms = dl.find_all('dt')
                analysis["definitions_found"] += len(terms)
        
        # Look for definition patterns in text
        definition_patterns = [
            r'(.+?)\s+is\s+(?:a|an|the)\s+(.+?)(?:\.|,)',
            r'(.+?)\s+refers?\s+to\s+(.+?)(?:\.|,)',
            r'(.+?)\s+(?:means|defined as)\s+(.+?)(?:\.|,)',
            r'(.+?):\s+(.+?)(?:\.|,)',
        ]
        
        text_content = soup.get_text(separator=' ')
        
        for pattern in definition_patterns:
            matches = re.findall(pattern, text_content, re.I)
            analysis["definitions_found"] += len(matches)
            for match in matches[:5]:
                analysis["definition_patterns"].append({
                    "term": match[0][:50],
                    "definition": match[1][:100]
                })
        
        # Check for clear topic introduction (first paragraph defines main topic)
        first_para = soup.find('p')
        if first_para:
            first_text = first_para.get_text(strip=True).lower()
            if any(phrase in first_text for phrase in ['is a', 'is an', 'refers to', 'are']):
                analysis["clear_topic_introduction"] = True
        
        # Quality score
        quality = 0
        if analysis["uses_definition_lists"]:
            quality += 30
        if analysis["clear_topic_introduction"]:
            quality += 30
        if analysis["definitions_found"] >= 3:
            quality += 25
        elif analysis["definitions_found"] >= 1:
            quality += 15
        if len(analysis["definition_patterns"]) >= 2:
            quality += 15
        
        analysis["quality_score"] = quality
        
        return analysis
    
    def _analyze_hierarchy(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Analyze content hierarchy and structure."""
        analysis = {
            "heading_structure": [],
            "has_h1": False,
            "heading_count": 0,
            "hierarchy_valid": True,
            "max_depth": 0,
            "issues": [],
            "quality_score": 0
        }
        
        headings = []
        last_level = 0
        
        for heading in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
            level = int(heading.name[1])
            text = heading.get_text(strip=True)
            
            headings.append({
                "level": level,
                "text": text[:100],
                "tag": heading.name
            })
            
            if level == 1:
                analysis["has_h1"] = True
            
            # Check for skipped levels
            if last_level > 0 and level > last_level + 1:
                analysis["hierarchy_valid"] = False
                analysis["issues"].append(f"Skipped heading level: {heading.name} after h{last_level}")
            
            last_level = level
            analysis["max_depth"] = max(analysis["max_depth"], level)
        
        analysis["heading_structure"] = headings[:20]
        analysis["heading_count"] = len(headings)
        
        # Quality score
        quality = 0
        if analysis["has_h1"]:
            quality += 25
        if analysis["hierarchy_valid"]:
            quality += 30
        if analysis["heading_count"] >= 5:
            quality += 20
        elif analysis["heading_count"] >= 3:
            quality += 10
        if analysis["max_depth"] >= 3:
            quality += 15
        if 1 <= analysis["heading_count"] <= 15:  # Not too many
            quality += 10
        
        analysis["quality_score"] = quality
        
        # Issues
        if not analysis["has_h1"]:
            analysis["issues"].append("Missing H1 heading")
        if analysis["heading_count"] == 0:
            analysis["issues"].append("No headings found - content lacks structure")
        
        return analysis
    
    def _analyze_snippet_potential(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Analyze potential for featured snippets and AI extraction."""
        analysis = {
            "paragraph_snippet_ready": False,
            "list_snippet_ready": False,
            "table_snippet_ready": False,
            "definition_snippet_ready": False,
            "optimal_answer_length": False,
            "quality_score": 0,
            "snippet_candidates": []
        }
        
        # Find short, informative paragraphs (ideal: 40-60 words)
        for p in soup.find_all('p'):
            text = p.get_text(strip=True)
            word_count = len(text.split())
            
            if 40 <= word_count <= 80:
                # Check if it's informative (not just intro text)
                if any(phrase in text.lower() for phrase in ['is', 'are', 'means', 'include', 'consist']):
                    analysis["paragraph_snippet_ready"] = True
                    analysis["optimal_answer_length"] = True
                    analysis["snippet_candidates"].append({
                        "type": "paragraph",
                        "text": text[:200],
                        "word_count": word_count
                    })
                    if len(analysis["snippet_candidates"]) >= 3:
                        break
        
        # Check for well-formatted lists
        for ul in soup.find_all(['ul', 'ol']):
            items = ul.find_all('li')
            if 3 <= len(items) <= 8:
                # Check if items are substantial
                avg_length = sum(len(li.get_text(strip=True)) for li in items) / len(items)
                if avg_length > 20:
                    analysis["list_snippet_ready"] = True
                    analysis["snippet_candidates"].append({
                        "type": "list",
                        "items": [li.get_text(strip=True)[:100] for li in items],
                        "item_count": len(items)
                    })
                    break
        
        # Check for tables
        for table in soup.find_all('table'):
            rows = table.find_all('tr')
            if 2 <= len(rows) <= 10:
                headers = table.find_all('th')
                if headers:
                    analysis["table_snippet_ready"] = True
                    analysis["snippet_candidates"].append({
                        "type": "table",
                        "headers": [th.get_text(strip=True) for th in headers],
                        "row_count": len(rows)
                    })
                    break
        
        # Check for definition-style content
        first_para = soup.find('p')
        if first_para:
            text = first_para.get_text(strip=True)
            if re.match(r'.+\s+(is|are|refers to)\s+', text, re.I):
                analysis["definition_snippet_ready"] = True
        
        # Quality score
        quality = 0
        if analysis["paragraph_snippet_ready"]:
            quality += 30
        if analysis["list_snippet_ready"]:
            quality += 25
        if analysis["table_snippet_ready"]:
            quality += 20
        if analysis["definition_snippet_ready"]:
            quality += 15
        if analysis["optimal_answer_length"]:
            quality += 10
        
        analysis["quality_score"] = quality
        
        return analysis
    
    def _analyze_lists_tables(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Analyze list and table structure quality."""
        analysis = {
            "unordered_lists": 0,
            "ordered_lists": 0,
            "tables": 0,
            "tables_with_headers": 0,
            "nested_lists": 0,
            "list_quality": "none",
            "table_quality": "none",
            "quality_score": 0
        }
        
        # Count lists
        analysis["unordered_lists"] = len(soup.find_all('ul'))
        analysis["ordered_lists"] = len(soup.find_all('ol'))
        
        # Check for nested lists
        for ul in soup.find_all('ul'):
            if ul.find('ul') or ul.find('ol'):
                analysis["nested_lists"] += 1
        
        # Analyze tables
        tables = soup.find_all('table')
        analysis["tables"] = len(tables)
        
        for table in tables:
            if table.find('th'):
                analysis["tables_with_headers"] += 1
        
        # Quality assessment
        total_lists = analysis["unordered_lists"] + analysis["ordered_lists"]
        if total_lists >= 3:
            analysis["list_quality"] = "good"
        elif total_lists >= 1:
            analysis["list_quality"] = "basic"
        
        if analysis["tables_with_headers"] >= 1:
            analysis["table_quality"] = "good"
        elif analysis["tables"] >= 1:
            analysis["table_quality"] = "basic"
        
        # Quality score
        quality = 0
        if total_lists >= 3:
            quality += 35
        elif total_lists >= 1:
            quality += 20
        
        if analysis["tables_with_headers"] >= 1:
            quality += 35
        elif analysis["tables"] >= 1:
            quality += 20
        
        if analysis["nested_lists"] >= 1:
            quality += 15
        
        if analysis["ordered_lists"] >= 1:
            quality += 15
        
        analysis["quality_score"] = quality
        
        return analysis
    
    def _analyze_entity_clarity(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Analyze entity/topic clarity for AI understanding."""
        analysis = {
            "has_clear_subject": False,
            "entity_mentions": 0,
            "topic_consistency": 0,
            "uses_proper_nouns": False,
            "has_contextual_info": False,
            "quality_score": 0
        }
        
        # Get page title
        title = soup.find('title')
        title_text = title.get_text(strip=True) if title else ""
        
        h1 = soup.find('h1')
        h1_text = h1.get_text(strip=True) if h1 else ""
        
        # Check title/h1 alignment
        if title_text and h1_text:
            # Simple overlap check
            title_words = set(title_text.lower().split())
            h1_words = set(h1_text.lower().split())
            overlap = len(title_words & h1_words)
            if overlap >= 2:
                analysis["has_clear_subject"] = True
        
        # Look for proper nouns (capitalized words in content)
        text = soup.get_text()
        proper_nouns = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
        if len(proper_nouns) >= 3:
            analysis["uses_proper_nouns"] = True
        
        # Check for contextual information (meta description, intro paragraph)
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            analysis["has_contextual_info"] = True
        
        # Topic consistency (main keyword appears multiple times)
        if h1_text:
            main_words = [w for w in h1_text.lower().split() if len(w) > 4]
            if main_words:
                text_lower = text.lower()
                mentions = sum(text_lower.count(w) for w in main_words[:3])
                analysis["entity_mentions"] = mentions
                if mentions >= 5:
                    analysis["topic_consistency"] = 100
                elif mentions >= 3:
                    analysis["topic_consistency"] = 70
                elif mentions >= 1:
                    analysis["topic_consistency"] = 40
        
        # Quality score
        quality = 0
        if analysis["has_clear_subject"]:
            quality += 30
        if analysis["uses_proper_nouns"]:
            quality += 20
        if analysis["has_contextual_info"]:
            quality += 20
        if analysis["topic_consistency"] >= 70:
            quality += 30
        elif analysis["topic_consistency"] >= 40:
            quality += 15
        
        analysis["quality_score"] = quality
        
        return analysis
    
    def _analyze_speakability(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Analyze content speakability (readability for voice)."""
        analysis = {
            "avg_sentence_length": 0,
            "avg_syllables_per_word": 0,
            "flesch_reading_ease": 0,
            "conversational_score": 0,
            "quality_score": 0
        }
        
        text = soup.get_text(separator=' ', strip=True)
        if not text:
            return analysis
            
        # Basic tokenization
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
        words = [w.lower() for w in re.findall(r'\b[a-z]+\b', text.lower())]
        
        if not sentences or not words:
            return analysis
            
        total_sentences = len(sentences)
        total_words = len(words)
        
        # Syllable counting (heuristic)
        def count_syllables(word):
            word = word.lower()
            count = 0
            vowels = "aeiouy"
            if word[0] in vowels:
                count += 1
            for i in range(1, len(word)):
                if word[i] in vowels and word[i-1] not in vowels:
                    count += 1
            if word.endswith("e"):
                count -= 1
            if count == 0:
                count += 1
            return count
            
        total_syllables = sum(count_syllables(w) for w in words)
        
        # Metrics
        analysis["avg_sentence_length"] = total_words / total_sentences
        analysis["avg_syllables_per_word"] = total_syllables / total_words
        
        # Flesch Reading Ease
        # 206.835 - 1.015(total words / total sentences) - 84.6(total syllables / total words)
        flesch = 206.835 - (1.015 * analysis["avg_sentence_length"]) - (84.6 * analysis["avg_syllables_per_word"])
        analysis["flesch_reading_ease"] = max(0, min(100, flesch))
        
        # Conversational Score (Pronouns)
        pronouns = {'i', 'you', 'we', 'us', 'our', 'my', 'your'}
        pronoun_count = sum(1 for w in words if w in pronouns)
        pronoun_density = (pronoun_count / total_words) * 100
        
        # Score calculation
        quality = 0
        
        # Readability (60-70 is standard, >80 is easy/conversational)
        if analysis["flesch_reading_ease"] >= 80:
            quality += 40
        elif analysis["flesch_reading_ease"] >= 60:
            quality += 30
        elif analysis["flesch_reading_ease"] >= 50:
            quality += 15
            
        # Sentence length (shorter is better for voice)
        if analysis["avg_sentence_length"] <= 15:
            quality += 30
        elif analysis["avg_sentence_length"] <= 20:
            quality += 20
        elif analysis["avg_sentence_length"] <= 25:
            quality += 10
            
        # Conversational tone
        if pronoun_density >= 3: # >3% pronouns is good
            quality += 30
        elif pronoun_density >= 1:
            quality += 15
            
        analysis["conversational_score"] = min(100, pronoun_density * 20) # Normalize roughly
        analysis["quality_score"] = min(100, quality)
        
        return analysis

    def _calculate_structure_score(self, results: Dict[str, Any]) -> float:
        """Calculate overall content structure score."""
        weights = {
            "faq_analysis": 0.20,
            "howto_analysis": 0.15,
            "definition_analysis": 0.10,
            "hierarchy_analysis": 0.20,
            "snippet_optimization": 0.15,
            "list_table_analysis": 0.10,
            "entity_clarity": 0.05,
            "speakability_analysis": 0.10,
            "aeo_signals": 0.15
        }
        
        total_score = 0
        for key, weight in weights.items():
            if key in results and "quality_score" in results[key]:
                total_score += results[key]["quality_score"] * weight
        
        return round(total_score, 1)
    
    async def _analyze_aeo_signals(self, url: str, soup: BeautifulSoup) -> Dict[str, Any]:
        """Analyze specialized AEO signals: llms.txt, Direct Answers, Info Density."""
        analysis = {
            "llms_txt_present": False,
            "llms_full_txt_present": False,
            "direct_answer_score": 0,
            "information_density_score": 0,
            "quality_score": 0,
            "issues": []
        }
        
        # 1. Check llms.txt (if url provided)
        if url:
            try:
                base_url = "/".join(url.split("/")[:3]) # http://domain.com
                
                async with httpx.AsyncClient(timeout=5.0) as client:
                    # Check both files in parallel
                    r1_task = client.head(f"{base_url}/llms.txt", follow_redirects=True)
                    r2_task = client.head(f"{base_url}/llms-full.txt", follow_redirects=True)
                    
                    r1, r2 = await asyncio.gather(r1_task, r2_task, return_exceptions=True)
                    
                    if not isinstance(r1, Exception) and r1.status_code == 200:
                        analysis["llms_txt_present"] = True
                    if not isinstance(r2, Exception) and r2.status_code == 200:
                        analysis["llms_full_txt_present"] = True
            except Exception as e:
                logger.warning(f"llms.txt check failed: {e}")
        
        # 2. Direct Answer Analysis
        # Best practice: H1 followed immediately by a concise definition (< 60 words)
        h1 = soup.find('h1')
        if h1:
            next_elem = h1.find_next_sibling(['p', 'div'])
            if next_elem:
                text = next_elem.get_text(strip=True)
                words = text.split()
                
                if 20 <= len(words) <= 70: # Sweet spot for snippets
                    # Check for definition patterns
                    if re.match(r'^(.+?)\s+(is|are|refers to|consists of|means)\s+', text, re.I):
                        analysis["direct_answer_score"] = 100
                    else:
                        analysis["direct_answer_score"] = 70 # Good length, maybe lacks structure
                elif len(words) < 20:
                    analysis["direct_answer_score"] = 40 # Too short
                else:
                    analysis["direct_answer_score"] = 30 # Too long/fluffy
        
        # 3. Information Density (Entities / Total Words)
        text = soup.get_text(" ", strip=True)
        words = text.split()
        if words:
            # Simple heuristic: capitalized words (not at start of sentence) + numbers
            # This is a proxy for Named Entities and Facts
            entities_facts = 0
            for i, w in enumerate(words):
                if w[0].isupper() and i > 0 and words[i-1][-1] not in '.!?':
                    entities_facts += 1
                elif w[0].isdigit():
                    entities_facts += 1
            
            density = (entities_facts / len(words)) * 100
            
            # Normalize: > 15% is excellent, < 5% is fluff
            if density > 15:
                analysis["information_density_score"] = 100
            elif density > 10:
                analysis["information_density_score"] = 80
            elif density > 5:
                analysis["information_density_score"] = 50
            else:
                analysis["information_density_score"] = 20
        
        # Calculate Sub-score
        quality = 0
        if analysis["llms_txt_present"]: quality += 30
        if analysis["llms_full_txt_present"]: quality += 10
        quality += (analysis["direct_answer_score"] * 0.3)
        quality += (analysis["information_density_score"] * 0.3)
        
        analysis["quality_score"] = min(100, round(quality, 1))
        
        # Issues
        if url and not analysis["llms_txt_present"]:
            analysis["issues"].append("Missing llms.txt file for AI crawlers")
        if analysis["direct_answer_score"] < 50:
            analysis["issues"].append("Intro content is not structured as a Direct Answer (H1 + concise definition)")
            
        return analysis

    def _generate_structure_recommendations(self, results: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate content structure recommendations."""
        recommendations = []
        
        # FAQ recommendations
        faq = results.get("faq_analysis", {})
        if faq.get("qa_pairs_found", 0) > 0 and not faq.get("faq_schema_present"):
            recommendations.append({
                "priority": "high",
                "category": "structured_data",
                "title": "Add FAQ Schema",
                "description": "You have FAQ content but no FAQPage schema. Adding schema markup will help AI engines recognize and cite your Q&A content."
            })
        elif faq.get("qa_pairs_found", 0) == 0:
            recommendations.append({
                "priority": "medium",
                "category": "content",
                "title": "Add FAQ Section",
                "description": "Consider adding a FAQ section with common questions about your topic. This increases chances of AI citation."
            })
        
        # How-to recommendations
        howto = results.get("howto_analysis", {})
        if howto.get("has_howto_content") and not howto.get("howto_schema_present"):
            recommendations.append({
                "priority": "high",
                "category": "structured_data",
                "title": "Add HowTo Schema",
                "description": "Your how-to content needs HowTo schema markup to be properly understood by AI engines."
            })
        if howto.get("has_howto_content") and not howto.get("has_numbered_steps"):
            recommendations.append({
                "priority": "medium",
                "category": "content",
                "title": "Use Numbered Steps",
                "description": "Convert your instructions to a numbered list for better AI extraction and readability."
            })
        
        # Hierarchy recommendations
        hierarchy = results.get("hierarchy_analysis", {})
        if not hierarchy.get("has_h1"):
            recommendations.append({
                "priority": "critical",
                "category": "structure",
                "title": "Add H1 Heading",
                "description": "Your page is missing an H1 heading. This is essential for topic clarity and SEO."
            })
        if not hierarchy.get("hierarchy_valid"):
            recommendations.append({
                "priority": "medium",
                "category": "structure",
                "title": "Fix Heading Hierarchy",
                "description": "Your heading levels skip (e.g., H2 to H4). Maintain proper hierarchy for better AI understanding."
            })
        
        # Snippet recommendations
        snippet = results.get("snippet_optimization", {})
        if not snippet.get("paragraph_snippet_ready"):
            recommendations.append({
                "priority": "medium",
                "category": "content",
                "title": "Optimize for Featured Snippets",
                "description": "Add concise, informative paragraphs (40-60 words) that directly answer questions."
            })
        if not snippet.get("definition_snippet_ready"):
            recommendations.append({
                "priority": "low",
                "category": "content",
                "title": "Add Clear Definitions",
                "description": "Start with a clear definition of your main topic using 'X is...' format."
            })
        
        # Lists/Tables recommendations
        lists_tables = results.get("list_table_analysis", {})
        if lists_tables.get("list_quality") == "none":
            recommendations.append({
                "priority": "medium",
                "category": "content",
                "title": "Add Lists",
                "description": "Use bulleted or numbered lists to structure information. AI engines prefer well-formatted lists."
            })
        if lists_tables.get("tables") > 0 and lists_tables.get("tables_with_headers") == 0:
            recommendations.append({
                "priority": "medium",
                "category": "structure",
                "title": "Add Table Headers",
                "description": "Your tables need header rows (<th>) for proper data structure recognition."
            })
            
        # Speakability recommendations
        speakability = results.get("speakability_analysis", {})
        if speakability.get("flesch_reading_ease", 100) < 60:
            recommendations.append({
                "priority": "high",
                "category": "voice",
                "title": "Simplify Content",
                "description": "Your content is too complex for voice search. Use shorter words and simpler sentences."
            })
        if speakability.get("avg_sentence_length", 0) > 20:
            recommendations.append({
                "priority": "medium",
                "category": "voice",
                "title": "Shorten Sentences",
                "description": "Long sentences are hard to follow in voice search. Aim for 15-20 words per sentence."
            })
        if speakability.get("conversational_score", 0) < 20:
            recommendations.append({
                "priority": "low",
                "category": "voice",
                "title": "Use Conversational Tone",
                "description": "Use more pronouns (I, You, We) to make content sound natural for voice assistants."
            })
        
        return recommendations
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Singleton instance
_content_analyzer: Optional[ContentStructureAnalyzerService] = None

def get_content_structure_analyzer() -> ContentStructureAnalyzerService:
    """Get singleton instance of ContentStructureAnalyzerService."""
    global _content_analyzer
    if _content_analyzer is None:
        _content_analyzer = ContentStructureAnalyzerService()
    return _content_analyzer
