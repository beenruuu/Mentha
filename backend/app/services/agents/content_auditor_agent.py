"""
Content Auditor Agent - LangGraph-based Content Review Workflow for GEO/AEO.

This agent implements an agentic workflow that audits content before publication
to ensure it's optimized for AI visibility and answer engine inclusion.

Workflow Nodes:
1. Critic: Evaluates content against GEO criteria
2. Suggestion Generator: Creates actionable improvement suggestions
3. Human-in-the-Loop: Pauses for human review (optional)
4. Approval: Final approval step

GEO Evaluation Criteria:
- Entity Density: Sufficient verifiable facts and named entities
- Response Structure: Primary intent answered in first 50 tokens
- Authority Signals: Citations to trusted external sources
- Schema.org Readiness: Content suitable for structured data
- FAQ Potential: Identifiable Q&A pairs
- Speakable Content: Voice-assistant optimized sections

Architecture:
- LangGraph StateGraph for workflow orchestration
- LLM-as-a-Critic pattern for evaluation
- Async interface for FastAPI integration
- Celery task integration for background processing
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Literal, TypedDict, Annotated
import json

logger = logging.getLogger(__name__)

# Check for LangGraph availability
try:
    from langgraph.graph import StateGraph, END
    from langgraph.graph.message import add_messages
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    StateGraph = None
    END = None
    add_messages = None
    logger.warning("LangGraph not installed. Content Auditor Agent disabled.")

try:
    from langchain_openai import ChatOpenAI
    from langchain_anthropic import ChatAnthropic
    from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    ChatOpenAI = None
    ChatAnthropic = None
    logger.warning("LangChain not installed. Content Auditor Agent disabled.")


class AuditStatus(str, Enum):
    """Status of a content audit."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    NEEDS_REVISION = "needs_revision"
    APPROVED = "approved"
    REJECTED = "rejected"
    HUMAN_REVIEW = "human_review"


class SuggestionPriority(str, Enum):
    """Priority level for suggestions."""
    CRITICAL = "critical"  # Must fix before publish
    HIGH = "high"          # Strongly recommended
    MEDIUM = "medium"      # Nice to have
    LOW = "low"            # Minor improvement


@dataclass
class AuditSuggestion:
    """A single improvement suggestion from the auditor."""
    category: str  # entity_density, structure, authority, schema, faq, speakable
    title: str
    description: str
    priority: SuggestionPriority
    section: Optional[str] = None  # Which section of content
    example: Optional[str] = None  # Example of the fix
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "category": self.category,
            "title": self.title,
            "description": self.description,
            "priority": self.priority.value,
            "section": self.section,
            "example": self.example
        }


@dataclass
class AuditResult:
    """Complete result of a content audit."""
    content_id: str
    status: AuditStatus
    overall_score: float  # 0-100
    scores: Dict[str, float]  # Per-category scores
    suggestions: List[AuditSuggestion]
    summary: str
    audited_at: datetime = field(default_factory=datetime.utcnow)
    model_used: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "content_id": self.content_id,
            "status": self.status.value,
            "overall_score": self.overall_score,
            "scores": self.scores,
            "suggestions": [s.to_dict() for s in self.suggestions],
            "summary": self.summary,
            "audited_at": self.audited_at.isoformat(),
            "model_used": self.model_used
        }
    
    @property
    def needs_revision(self) -> bool:
        """Check if content needs revision."""
        return (
            self.overall_score < 60 or
            any(s.priority == SuggestionPriority.CRITICAL for s in self.suggestions)
        )


class ContentAuditState(TypedDict):
    """State for the content audit workflow."""
    # Input
    content_id: str
    content_title: str
    content_body: str
    content_url: Optional[str]
    brand_name: str
    
    # Processing
    messages: Annotated[List[Any], add_messages] if LANGGRAPH_AVAILABLE else List[Any]
    
    # Evaluation results
    entity_score: float
    structure_score: float
    authority_score: float
    schema_score: float
    faq_score: float
    speakable_score: float
    
    # Output
    suggestions: List[Dict[str, Any]]
    summary: str
    status: str
    overall_score: float
    
    # Control
    iteration: int
    max_iterations: int
    require_human_review: bool


# Critic system prompt
CRITIC_SYSTEM_PROMPT = """You are an expert GEO (Generative Engine Optimization) content auditor.
Your job is to evaluate content for AI visibility and answer engine inclusion.

Evaluate the content against these criteria (score 0-100 each):

1. ENTITY DENSITY (entity_score):
   - Are there sufficient named entities (organizations, people, products, places)?
   - Are facts verifiable and specific (dates, numbers, proper nouns)?
   - Score high if: Contains 5+ unique entities, specific data points
   - Score low if: Vague language, no concrete facts

2. RESPONSE STRUCTURE (structure_score):
   - Does the content answer the primary user intent in the first 50 tokens?
   - Is there a clear, concise answer before elaboration?
   - Score high if: Direct answer upfront, clear structure
   - Score low if: Buries the answer, too much preamble

3. AUTHORITY SIGNALS (authority_score):
   - Are there citations to external authoritative sources?
   - Is the author's expertise established?
   - Score high if: Multiple citations, expert author
   - Score low if: No sources, anonymous

4. SCHEMA.ORG READINESS (schema_score):
   - Can this content be marked up with structured data?
   - Are there clear entities for JSON-LD?
   - Score high if: Clear FAQ, HowTo, or Article structure
   - Score low if: Unstructured prose

5. FAQ POTENTIAL (faq_score):
   - Are there implicit or explicit Q&A pairs?
   - Could sections be reformatted as FAQs?
   - Score high if: Clear questions answered
   - Score low if: No question patterns

6. SPEAKABLE CONTENT (speakable_score):
   - Are there sections suitable for voice assistants?
   - Is the language natural for TTS?
   - Score high if: Short, declarative sentences, summaries
   - Score low if: Complex sentences, technical jargon

Respond in JSON format:
{
    "entity_score": 0-100,
    "structure_score": 0-100,
    "authority_score": 0-100,
    "schema_score": 0-100,
    "faq_score": 0-100,
    "speakable_score": 0-100,
    "overall_assessment": "Brief summary of strengths and weaknesses",
    "critical_issues": ["List of must-fix issues"],
    "suggestions": [
        {
            "category": "entity_density|structure|authority|schema|faq|speakable",
            "title": "Short title",
            "description": "What to improve",
            "priority": "critical|high|medium|low",
            "section": "Which section (optional)",
            "example": "Example of the fix (optional)"
        }
    ]
}
"""


class ContentAuditorAgent:
    """
    LangGraph-based Content Auditor Agent.
    
    Implements an agentic workflow for content review:
    1. Critic evaluates content
    2. Suggestions are generated
    3. Human review (optional)
    4. Approval or rejection
    
    Usage:
        agent = get_content_auditor_agent()
        result = await agent.audit_content(
            content_id="article-123",
            content_title="How to Optimize for AI",
            content_body="...",
            brand_name="MyBrand"
        )
    """
    
    _instance: Optional["ContentAuditorAgent"] = None
    
    def __new__(cls):
        """Singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize the agent."""
        if hasattr(self, "_initialized") and self._initialized:
            return
        
        self._llm = None
        self._graph = None
        self._initialized = True
    
    def _get_llm(self, provider: str = "openai"):
        """Get or create LLM instance."""
        if self._llm is not None:
            return self._llm
        
        if not LANGCHAIN_AVAILABLE:
            logger.error("LangChain not available")
            return None
        
        try:
            from app.core.config import settings
            
            if provider == "anthropic" and hasattr(settings, "ANTHROPIC_API_KEY"):
                self._llm = ChatAnthropic(
                    model="claude-3-5-sonnet-20241022",
                    api_key=settings.ANTHROPIC_API_KEY,
                    temperature=0.1
                )
            else:
                self._llm = ChatOpenAI(
                    model="gpt-4o",
                    api_key=settings.OPENAI_API_KEY,
                    temperature=0.1
                )
            
            return self._llm
            
        except Exception as e:
            logger.error(f"Failed to initialize LLM: {e}")
            return None
    
    def _build_graph(self) -> Optional[StateGraph]:
        """Build the LangGraph workflow."""
        if not LANGGRAPH_AVAILABLE:
            logger.error("LangGraph not available")
            return None
        
        if self._graph is not None:
            return self._graph
        
        # Define the graph
        graph = StateGraph(ContentAuditState)
        
        # Add nodes
        graph.add_node("critic", self._critic_node)
        graph.add_node("suggestion_generator", self._suggestion_node)
        graph.add_node("human_review", self._human_review_node)
        graph.add_node("approval", self._approval_node)
        
        # Define edges
        graph.set_entry_point("critic")
        graph.add_edge("critic", "suggestion_generator")
        
        # Conditional edge: human review or auto-approval
        graph.add_conditional_edges(
            "suggestion_generator",
            self._route_after_suggestions,
            {
                "human_review": "human_review",
                "approval": "approval"
            }
        )
        
        graph.add_edge("human_review", "approval")
        graph.add_edge("approval", END)
        
        self._graph = graph.compile()
        return self._graph
    
    async def _critic_node(self, state: ContentAuditState) -> Dict[str, Any]:
        """Critic node: Evaluate content using LLM."""
        llm = self._get_llm()
        if not llm:
            return {
                "entity_score": 0,
                "structure_score": 0,
                "authority_score": 0,
                "schema_score": 0,
                "faq_score": 0,
                "speakable_score": 0,
                "summary": "LLM not available for evaluation",
                "status": AuditStatus.REJECTED.value
            }
        
        # Prepare content for evaluation
        content = f"""
Title: {state["content_title"]}
Brand: {state["brand_name"]}
URL: {state.get("content_url", "N/A")}

Content:
{state["content_body"][:4000]}  # Limit to avoid token overflow
"""
        
        messages = [
            SystemMessage(content=CRITIC_SYSTEM_PROMPT),
            HumanMessage(content=f"Evaluate this content for GEO optimization:\n\n{content}")
        ]
        
        try:
            response = await llm.ainvoke(messages)
            
            # Parse JSON response
            response_text = response.content
            
            # Extract JSON from response
            import re
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                result = json.loads(json_match.group())
            else:
                logger.error(f"Failed to parse JSON from response: {response_text[:500]}")
                result = {}
            
            return {
                "entity_score": result.get("entity_score", 50),
                "structure_score": result.get("structure_score", 50),
                "authority_score": result.get("authority_score", 50),
                "schema_score": result.get("schema_score", 50),
                "faq_score": result.get("faq_score", 50),
                "speakable_score": result.get("speakable_score", 50),
                "summary": result.get("overall_assessment", "Evaluation complete"),
                "suggestions": result.get("suggestions", []),
                "messages": [response]
            }
            
        except Exception as e:
            logger.error(f"Critic evaluation failed: {e}")
            return {
                "entity_score": 50,
                "structure_score": 50,
                "authority_score": 50,
                "schema_score": 50,
                "faq_score": 50,
                "speakable_score": 50,
                "summary": f"Evaluation error: {str(e)}",
                "status": AuditStatus.PENDING.value
            }
    
    async def _suggestion_node(self, state: ContentAuditState) -> Dict[str, Any]:
        """Suggestion node: Generate actionable suggestions."""
        # Calculate overall score
        scores = [
            state.get("entity_score", 50),
            state.get("structure_score", 50),
            state.get("authority_score", 50),
            state.get("schema_score", 50),
            state.get("faq_score", 50),
            state.get("speakable_score", 50),
        ]
        overall_score = sum(scores) / len(scores)
        
        # Determine status based on score and suggestions
        suggestions = state.get("suggestions", [])
        has_critical = any(
            s.get("priority") == "critical" 
            for s in suggestions
        )
        
        if has_critical or overall_score < 40:
            status = AuditStatus.NEEDS_REVISION.value
        elif overall_score < 60:
            status = AuditStatus.NEEDS_REVISION.value
        else:
            status = AuditStatus.APPROVED.value
        
        return {
            "overall_score": overall_score,
            "status": status,
            "iteration": state.get("iteration", 0) + 1
        }
    
    def _route_after_suggestions(self, state: ContentAuditState) -> str:
        """Route to human review or approval."""
        if state.get("require_human_review", False):
            return "human_review"
        return "approval"
    
    async def _human_review_node(self, state: ContentAuditState) -> Dict[str, Any]:
        """Human review node: Pause for human intervention."""
        # In a real implementation, this would:
        # 1. Save state to database
        # 2. Notify human reviewer
        # 3. Wait for human input
        # For now, we just mark it as pending review
        return {
            "status": AuditStatus.HUMAN_REVIEW.value
        }
    
    async def _approval_node(self, state: ContentAuditState) -> Dict[str, Any]:
        """Approval node: Finalize the audit."""
        overall_score = state.get("overall_score", 50)
        current_status = state.get("status", AuditStatus.PENDING.value)
        
        # If already marked for revision, keep that status
        if current_status in [AuditStatus.NEEDS_REVISION.value, AuditStatus.HUMAN_REVIEW.value]:
            return {}
        
        # Final approval based on score
        if overall_score >= 70:
            return {"status": AuditStatus.APPROVED.value}
        elif overall_score >= 50:
            return {"status": AuditStatus.NEEDS_REVISION.value}
        else:
            return {"status": AuditStatus.REJECTED.value}
    
    async def audit_content(
        self,
        content_id: str,
        content_title: str,
        content_body: str,
        brand_name: str,
        content_url: Optional[str] = None,
        require_human_review: bool = False
    ) -> AuditResult:
        """
        Audit content for GEO optimization.
        
        Args:
            content_id: Unique identifier for the content
            content_title: Content title
            content_body: Full content text
            brand_name: Brand name for context
            content_url: URL of the content (optional)
            require_human_review: Force human review step
        
        Returns:
            AuditResult with scores and suggestions
        """
        # Check dependencies
        if not LANGGRAPH_AVAILABLE or not LANGCHAIN_AVAILABLE:
            logger.warning("LangGraph/LangChain not available, returning mock result")
            return AuditResult(
                content_id=content_id,
                status=AuditStatus.PENDING,
                overall_score=50,
                scores={
                    "entity_density": 50,
                    "structure": 50,
                    "authority": 50,
                    "schema": 50,
                    "faq": 50,
                    "speakable": 50
                },
                suggestions=[
                    AuditSuggestion(
                        category="system",
                        title="Dependencies Required",
                        description="Install langgraph and langchain for full audit functionality",
                        priority=SuggestionPriority.CRITICAL
                    )
                ],
                summary="Audit functionality requires LangGraph and LangChain",
                model_used="none"
            )
        
        # Build graph
        graph = self._build_graph()
        if not graph:
            return AuditResult(
                content_id=content_id,
                status=AuditStatus.REJECTED,
                overall_score=0,
                scores={},
                suggestions=[],
                summary="Failed to build audit workflow",
                model_used="none"
            )
        
        # Initial state
        initial_state: ContentAuditState = {
            "content_id": content_id,
            "content_title": content_title,
            "content_body": content_body,
            "content_url": content_url,
            "brand_name": brand_name,
            "messages": [],
            "entity_score": 0,
            "structure_score": 0,
            "authority_score": 0,
            "schema_score": 0,
            "faq_score": 0,
            "speakable_score": 0,
            "suggestions": [],
            "summary": "",
            "status": AuditStatus.PENDING.value,
            "overall_score": 0,
            "iteration": 0,
            "max_iterations": 3,
            "require_human_review": require_human_review
        }
        
        # Run the graph
        try:
            final_state = await graph.ainvoke(initial_state)
            
            # Convert suggestions to AuditSuggestion objects
            suggestions = []
            for s in final_state.get("suggestions", []):
                if isinstance(s, dict):
                    suggestions.append(AuditSuggestion(
                        category=s.get("category", "general"),
                        title=s.get("title", "Suggestion"),
                        description=s.get("description", ""),
                        priority=SuggestionPriority(s.get("priority", "medium")),
                        section=s.get("section"),
                        example=s.get("example")
                    ))
            
            return AuditResult(
                content_id=content_id,
                status=AuditStatus(final_state.get("status", AuditStatus.PENDING.value)),
                overall_score=final_state.get("overall_score", 50),
                scores={
                    "entity_density": final_state.get("entity_score", 50),
                    "structure": final_state.get("structure_score", 50),
                    "authority": final_state.get("authority_score", 50),
                    "schema": final_state.get("schema_score", 50),
                    "faq": final_state.get("faq_score", 50),
                    "speakable": final_state.get("speakable_score", 50)
                },
                suggestions=suggestions,
                summary=final_state.get("summary", ""),
                model_used=self._llm.model_name if self._llm else "unknown"
            )
            
        except Exception as e:
            logger.error(f"Audit workflow failed: {e}")
            return AuditResult(
                content_id=content_id,
                status=AuditStatus.REJECTED,
                overall_score=0,
                scores={},
                suggestions=[],
                summary=f"Workflow error: {str(e)}",
                model_used="error"
            )
    
    async def audit_batch(
        self,
        contents: List[Dict[str, str]],
        brand_name: str
    ) -> List[AuditResult]:
        """
        Audit multiple content pieces.
        
        Args:
            contents: List of {id, title, body, url} dicts
            brand_name: Brand name for context
        
        Returns:
            List of AuditResult for each content
        """
        results = []
        for content in contents:
            result = await self.audit_content(
                content_id=content.get("id", "unknown"),
                content_title=content.get("title", "Untitled"),
                content_body=content.get("body", ""),
                brand_name=brand_name,
                content_url=content.get("url")
            )
            results.append(result)
        
        return results


# Singleton instance
_content_auditor_agent: Optional[ContentAuditorAgent] = None


def get_content_auditor_agent() -> ContentAuditorAgent:
    """Get singleton instance of ContentAuditorAgent."""
    global _content_auditor_agent
    if _content_auditor_agent is None:
        _content_auditor_agent = ContentAuditorAgent()
    return _content_auditor_agent
