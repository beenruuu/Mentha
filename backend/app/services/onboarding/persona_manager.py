"""
Persona Manager - User Persona Definition for Prompt Simulation in GEO/AEO.

AI search results vary based on the persona of the searcher. This service
manages user personas that modify how prompts are formulated when querying
LLMs for visibility analysis.

Key Insight:
"Explain to a 5-year-old" vs "Explain to a PhD" produces wildly different
results. B2B buying cycles differ from consumer browsing. Accurate persona
simulation is critical for realistic visibility measurement.

Personas are used to:
1. Modify query prompts sent to AI models during analysis
2. Simulate different user intents for the same topic
3. Generate persona-specific visibility scores
4. Identify content gaps for different audience segments

Default Personas:
- Technical Expert (CTO, Developer)
- Business Decision Maker (CEO, CMO)
- End User / Consumer
- Researcher / Analyst
- Beginner / Newcomer

Architecture:
- Persona templates with customizable attributes
- Query modification engine
- Industry-specific persona generation
- Integration with analysis service
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional, Set
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid

from app.core.config import settings

logger = logging.getLogger(__name__)


class PersonaType(str, Enum):
    """Standard persona archetypes."""
    TECHNICAL_EXPERT = "technical_expert"
    BUSINESS_LEADER = "business_leader"
    END_USER = "end_user"
    RESEARCHER = "researcher"
    BEGINNER = "beginner"
    PROCUREMENT = "procurement"
    DEVELOPER = "developer"
    MARKETING = "marketing"
    CUSTOM = "custom"


class ExpertiseLevel(str, Enum):
    """Expertise level for persona."""
    NOVICE = "novice"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class IntentType(str, Enum):
    """User intent type."""
    INFORMATIONAL = "informational"  # Learning/research
    NAVIGATIONAL = "navigational"   # Finding specific brand/page
    TRANSACTIONAL = "transactional"  # Ready to buy/act
    COMPARATIVE = "comparative"      # Comparing options


@dataclass
class UserPersona:
    """
    Represents a user persona for query simulation.
    
    Personas modify how prompts are constructed when querying AI models.
    """
    id: str
    name: str
    persona_type: PersonaType
    description: str
    
    # Persona attributes
    expertise_level: ExpertiseLevel = ExpertiseLevel.INTERMEDIATE
    primary_intent: IntentType = IntentType.INFORMATIONAL
    
    # Role-specific context
    job_title: Optional[str] = None
    industry_focus: Optional[str] = None
    pain_points: List[str] = field(default_factory=list)
    goals: List[str] = field(default_factory=list)
    
    # Query modifiers
    query_style: str = "neutral"  # "technical", "casual", "formal", "neutral"
    preferred_depth: str = "moderate"  # "overview", "moderate", "detailed", "comprehensive"
    
    # Prompt template modifiers
    system_prompt_modifier: str = ""
    query_prefix: str = ""
    query_suffix: str = ""
    
    # Metadata
    brand_id: Optional[str] = None
    is_default: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        if not self.id:
            self.id = str(uuid.uuid4())
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = self.created_at
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "persona_type": self.persona_type.value,
            "description": self.description,
            "expertise_level": self.expertise_level.value,
            "primary_intent": self.primary_intent.value,
            "job_title": self.job_title,
            "industry_focus": self.industry_focus,
            "pain_points": self.pain_points,
            "goals": self.goals,
            "query_style": self.query_style,
            "preferred_depth": self.preferred_depth,
            "system_prompt_modifier": self.system_prompt_modifier,
            "query_prefix": self.query_prefix,
            "query_suffix": self.query_suffix,
            "brand_id": self.brand_id,
            "is_default": self.is_default,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UserPersona":
        return cls(
            id=data.get("id", ""),
            name=data.get("name", ""),
            persona_type=PersonaType(data.get("persona_type", "custom")),
            description=data.get("description", ""),
            expertise_level=ExpertiseLevel(data.get("expertise_level", "intermediate")),
            primary_intent=IntentType(data.get("primary_intent", "informational")),
            job_title=data.get("job_title"),
            industry_focus=data.get("industry_focus"),
            pain_points=data.get("pain_points", []),
            goals=data.get("goals", []),
            query_style=data.get("query_style", "neutral"),
            preferred_depth=data.get("preferred_depth", "moderate"),
            system_prompt_modifier=data.get("system_prompt_modifier", ""),
            query_prefix=data.get("query_prefix", ""),
            query_suffix=data.get("query_suffix", ""),
            brand_id=data.get("brand_id"),
            is_default=data.get("is_default", False),
        )


# Default persona templates
DEFAULT_PERSONAS: Dict[PersonaType, Dict[str, Any]] = {
    PersonaType.TECHNICAL_EXPERT: {
        "name": "Technical Expert",
        "description": "Senior technical professional (CTO, Lead Developer, Architect) evaluating solutions",
        "expertise_level": ExpertiseLevel.EXPERT,
        "primary_intent": IntentType.COMPARATIVE,
        "job_title": "CTO / Technical Lead",
        "pain_points": ["Integration complexity", "Scalability concerns", "Technical debt"],
        "goals": ["Find best technical solution", "Evaluate architecture", "Assess maintainability"],
        "query_style": "technical",
        "preferred_depth": "comprehensive",
        "system_prompt_modifier": "You are responding to a senior technical expert who wants detailed technical information, including architecture details, performance characteristics, and integration capabilities.",
        "query_prefix": "From a technical architecture perspective, ",
        "query_suffix": " Include technical specifications and implementation details.",
    },
    PersonaType.BUSINESS_LEADER: {
        "name": "Business Decision Maker",
        "description": "Executive or manager focused on business outcomes and ROI",
        "expertise_level": ExpertiseLevel.INTERMEDIATE,
        "primary_intent": IntentType.TRANSACTIONAL,
        "job_title": "CEO / CMO / VP",
        "pain_points": ["ROI uncertainty", "Implementation timeline", "Team adoption"],
        "goals": ["Understand business impact", "Compare solutions", "Make informed decisions"],
        "query_style": "formal",
        "preferred_depth": "moderate",
        "system_prompt_modifier": "You are responding to a business executive who cares about ROI, competitive advantage, and strategic impact rather than technical details.",
        "query_prefix": "From a business perspective, ",
        "query_suffix": " Focus on business value and outcomes.",
    },
    PersonaType.END_USER: {
        "name": "End User / Consumer",
        "description": "Everyday user looking for practical solutions",
        "expertise_level": ExpertiseLevel.NOVICE,
        "primary_intent": IntentType.INFORMATIONAL,
        "job_title": None,
        "pain_points": ["Ease of use", "Learning curve", "Value for money"],
        "goals": ["Find easy solution", "Understand benefits", "Get started quickly"],
        "query_style": "casual",
        "preferred_depth": "overview",
        "system_prompt_modifier": "You are responding to a regular user who wants simple, easy-to-understand explanations without jargon.",
        "query_prefix": "",
        "query_suffix": " Explain in simple terms.",
    },
    PersonaType.RESEARCHER: {
        "name": "Researcher / Analyst",
        "description": "Professional doing in-depth research and analysis",
        "expertise_level": ExpertiseLevel.ADVANCED,
        "primary_intent": IntentType.INFORMATIONAL,
        "job_title": "Analyst / Researcher",
        "pain_points": ["Data accuracy", "Comprehensive coverage", "Credible sources"],
        "goals": ["Gather comprehensive data", "Compare all options", "Document findings"],
        "query_style": "neutral",
        "preferred_depth": "comprehensive",
        "system_prompt_modifier": "You are responding to a researcher who needs comprehensive, well-sourced information with multiple perspectives.",
        "query_prefix": "Provide a comprehensive analysis of ",
        "query_suffix": " Include multiple perspectives and cite sources.",
    },
    PersonaType.BEGINNER: {
        "name": "Beginner / Newcomer",
        "description": "Person new to the topic seeking foundational understanding",
        "expertise_level": ExpertiseLevel.NOVICE,
        "primary_intent": IntentType.INFORMATIONAL,
        "job_title": None,
        "pain_points": ["Information overload", "Jargon confusion", "Where to start"],
        "goals": ["Understand basics", "Find starting point", "Build foundation"],
        "query_style": "casual",
        "preferred_depth": "overview",
        "system_prompt_modifier": "You are responding to a complete beginner. Use simple language, avoid jargon, and explain concepts from first principles.",
        "query_prefix": "As a beginner, I want to understand ",
        "query_suffix": " Explain like I'm new to this topic.",
    },
    PersonaType.PROCUREMENT: {
        "name": "Procurement Professional",
        "description": "Buyer evaluating vendors and making purchasing decisions",
        "expertise_level": ExpertiseLevel.INTERMEDIATE,
        "primary_intent": IntentType.TRANSACTIONAL,
        "job_title": "Procurement Manager",
        "pain_points": ["Vendor reliability", "Pricing transparency", "Contract terms"],
        "goals": ["Compare vendors", "Evaluate pricing", "Assess reliability"],
        "query_style": "formal",
        "preferred_depth": "detailed",
        "system_prompt_modifier": "You are responding to a procurement professional who needs to evaluate vendors, pricing, and contract considerations.",
        "query_prefix": "For vendor evaluation purposes, ",
        "query_suffix": " Include pricing considerations and vendor comparison.",
    },
    PersonaType.DEVELOPER: {
        "name": "Software Developer",
        "description": "Developer looking for tools, libraries, or implementation guidance",
        "expertise_level": ExpertiseLevel.ADVANCED,
        "primary_intent": IntentType.INFORMATIONAL,
        "job_title": "Software Developer / Engineer",
        "pain_points": ["Documentation quality", "API complexity", "Integration effort"],
        "goals": ["Find best tool", "Understand implementation", "Get working code"],
        "query_style": "technical",
        "preferred_depth": "detailed",
        "system_prompt_modifier": "You are responding to a software developer who wants practical implementation details, code examples, and API documentation.",
        "query_prefix": "As a developer, ",
        "query_suffix": " Include code examples and implementation details.",
    },
    PersonaType.MARKETING: {
        "name": "Marketing Professional",
        "description": "Marketer researching trends, tools, or competitive landscape",
        "expertise_level": ExpertiseLevel.INTERMEDIATE,
        "primary_intent": IntentType.INFORMATIONAL,
        "job_title": "Marketing Manager",
        "pain_points": ["Market trends", "Competitive positioning", "ROI measurement"],
        "goals": ["Understand market", "Find opportunities", "Plan campaigns"],
        "query_style": "neutral",
        "preferred_depth": "moderate",
        "system_prompt_modifier": "You are responding to a marketing professional who cares about market positioning, competitive advantage, and customer perception.",
        "query_prefix": "From a marketing perspective, ",
        "query_suffix": " Consider market positioning and competitive landscape.",
    },
}


@dataclass
class ModifiedQuery:
    """Query modified for a specific persona."""
    original_query: str
    modified_query: str
    persona: UserPersona
    system_prompt: str
    metadata: Dict[str, Any] = field(default_factory=dict)


class PersonaManager:
    """
    Persona Manager for query simulation with different user profiles.
    
    Usage:
        manager = get_persona_manager()
        
        # Get default personas
        personas = manager.get_default_personas()
        
        # Create custom persona
        persona = await manager.create_custom_persona(
            name="Enterprise CTO",
            persona_type=PersonaType.TECHNICAL_EXPERT,
            description="CTO of Fortune 500 company",
            industry_focus="Finance"
        )
        
        # Modify query for persona
        modified = manager.modify_query_for_persona(
            "Best CRM software",
            persona
        )
        
        # Use modified.modified_query and modified.system_prompt
        # when querying AI models
    """
    
    _instance: Optional["PersonaManager"] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if hasattr(self, "_initialized") and self._initialized:
            return
        self._custom_personas: Dict[str, UserPersona] = {}  # brand_id -> list of personas
        self._initialized = True
    
    def get_default_personas(self) -> List[UserPersona]:
        """Get all default persona templates."""
        personas = []
        for persona_type, template in DEFAULT_PERSONAS.items():
            persona = UserPersona(
                id=f"default_{persona_type.value}",
                persona_type=persona_type,
                is_default=True,
                **template
            )
            personas.append(persona)
        return personas
    
    def get_default_persona(self, persona_type: PersonaType) -> Optional[UserPersona]:
        """Get a specific default persona by type."""
        template = DEFAULT_PERSONAS.get(persona_type)
        if not template:
            return None
        
        return UserPersona(
            id=f"default_{persona_type.value}",
            persona_type=persona_type,
            is_default=True,
            **template
        )
    
    async def create_custom_persona(
        self,
        brand_id: str,
        name: str,
        description: str,
        persona_type: PersonaType = PersonaType.CUSTOM,
        expertise_level: ExpertiseLevel = ExpertiseLevel.INTERMEDIATE,
        primary_intent: IntentType = IntentType.INFORMATIONAL,
        job_title: Optional[str] = None,
        industry_focus: Optional[str] = None,
        pain_points: Optional[List[str]] = None,
        goals: Optional[List[str]] = None,
        query_style: str = "neutral",
        preferred_depth: str = "moderate",
    ) -> UserPersona:
        """
        Create a custom persona for a specific brand.
        
        Args:
            brand_id: The brand this persona belongs to
            name: Display name for the persona
            description: Detailed description
            persona_type: Base persona type
            expertise_level: Technical expertise
            primary_intent: What the user is trying to achieve
            job_title: Optional job title
            industry_focus: Optional industry context
            pain_points: What problems they face
            goals: What they want to achieve
            query_style: How they phrase queries
            preferred_depth: How much detail they want
            
        Returns:
            The created UserPersona
        """
        persona = UserPersona(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            persona_type=persona_type,
            expertise_level=expertise_level,
            primary_intent=primary_intent,
            job_title=job_title,
            industry_focus=industry_focus,
            pain_points=pain_points or [],
            goals=goals or [],
            query_style=query_style,
            preferred_depth=preferred_depth,
            brand_id=brand_id,
            is_default=False,
        )
        
        # Generate prompt modifiers based on attributes
        persona.system_prompt_modifier = self._generate_system_prompt(persona)
        persona.query_prefix = self._generate_query_prefix(persona)
        persona.query_suffix = self._generate_query_suffix(persona)
        
        # Store
        if brand_id not in self._custom_personas:
            self._custom_personas[brand_id] = {}
        self._custom_personas[brand_id][persona.id] = persona
        
        return persona
    
    def _generate_system_prompt(self, persona: UserPersona) -> str:
        """Generate system prompt modifier based on persona attributes."""
        parts = [f"You are responding to a {persona.name}"]
        
        if persona.job_title:
            parts.append(f"({persona.job_title})")
        
        parts.append(f"with {persona.expertise_level.value} expertise level.")
        
        if persona.industry_focus:
            parts.append(f"They work in {persona.industry_focus}.")
        
        if persona.primary_intent == IntentType.TRANSACTIONAL:
            parts.append("They are ready to make a decision and need actionable information.")
        elif persona.primary_intent == IntentType.COMPARATIVE:
            parts.append("They want to compare options and understand trade-offs.")
        elif persona.primary_intent == IntentType.INFORMATIONAL:
            parts.append("They are researching and want comprehensive information.")
        
        if persona.goals:
            parts.append(f"Their goals: {', '.join(persona.goals[:3])}.")
        
        return " ".join(parts)
    
    def _generate_query_prefix(self, persona: UserPersona) -> str:
        """Generate query prefix based on persona style."""
        prefixes = {
            "technical": "From a technical standpoint, ",
            "formal": "For business purposes, ",
            "casual": "",
            "neutral": "",
        }
        
        base = prefixes.get(persona.query_style, "")
        
        if persona.job_title:
            base += f"As a {persona.job_title}, "
        
        return base
    
    def _generate_query_suffix(self, persona: UserPersona) -> str:
        """Generate query suffix based on preferred depth."""
        suffixes = {
            "overview": " Give me a brief overview.",
            "moderate": "",
            "detailed": " Provide detailed information.",
            "comprehensive": " Give me a comprehensive analysis with all relevant details.",
        }
        
        return suffixes.get(persona.preferred_depth, "")
    
    def get_personas_for_brand(self, brand_id: str) -> List[UserPersona]:
        """Get all personas (default + custom) for a brand."""
        personas = self.get_default_personas()
        
        if brand_id in self._custom_personas:
            personas.extend(self._custom_personas[brand_id].values())
        
        return personas
    
    def get_persona_by_id(self, persona_id: str, brand_id: Optional[str] = None) -> Optional[UserPersona]:
        """Get a specific persona by ID."""
        # Check if it's a default persona
        if persona_id.startswith("default_"):
            type_str = persona_id.replace("default_", "")
            try:
                persona_type = PersonaType(type_str)
                return self.get_default_persona(persona_type)
            except ValueError:
                return None
        
        # Check custom personas
        if brand_id and brand_id in self._custom_personas:
            return self._custom_personas[brand_id].get(persona_id)
        
        # Search all custom personas
        for brand_personas in self._custom_personas.values():
            if persona_id in brand_personas:
                return brand_personas[persona_id]
        
        return None
    
    def modify_query_for_persona(
        self,
        query: str,
        persona: UserPersona,
        include_brand_context: bool = False,
        brand_name: Optional[str] = None
    ) -> ModifiedQuery:
        """
        Modify a search query based on the given persona.
        
        This is the core function used during analysis to simulate
        how different users would phrase their queries.
        
        Args:
            query: The original search query
            persona: The persona to simulate
            include_brand_context: Whether to include brand in query
            brand_name: Optional brand name for context
            
        Returns:
            ModifiedQuery with transformed query and system prompt
        """
        modified = query
        
        # Apply prefix
        if persona.query_prefix:
            modified = persona.query_prefix + modified
        
        # Apply suffix
        if persona.query_suffix:
            modified = modified.rstrip('?. ') + persona.query_suffix
        
        # Build system prompt
        system_parts = ["You are a helpful AI assistant."]
        
        if persona.system_prompt_modifier:
            system_parts.append(persona.system_prompt_modifier)
        
        if include_brand_context and brand_name:
            system_parts.append(f"The user is particularly interested in information about {brand_name}.")
        
        system_prompt = " ".join(system_parts)
        
        return ModifiedQuery(
            original_query=query,
            modified_query=modified,
            persona=persona,
            system_prompt=system_prompt,
            metadata={
                "persona_id": persona.id,
                "persona_type": persona.persona_type.value,
                "expertise_level": persona.expertise_level.value,
                "primary_intent": persona.primary_intent.value,
            }
        )
    
    def generate_queries_for_all_personas(
        self,
        base_query: str,
        brand_id: Optional[str] = None,
        persona_types: Optional[List[PersonaType]] = None
    ) -> List[ModifiedQuery]:
        """
        Generate modified queries for multiple personas.
        
        Useful for comprehensive visibility analysis across different
        audience segments.
        
        Args:
            base_query: The base search query
            brand_id: Optional brand ID to include custom personas
            persona_types: Specific persona types to use (None = all)
            
        Returns:
            List of ModifiedQuery for each selected persona
        """
        modified_queries = []
        
        if brand_id:
            personas = self.get_personas_for_brand(brand_id)
        else:
            personas = self.get_default_personas()
        
        # Filter by type if specified
        if persona_types:
            personas = [p for p in personas if p.persona_type in persona_types]
        
        for persona in personas:
            modified = self.modify_query_for_persona(base_query, persona)
            modified_queries.append(modified)
        
        return modified_queries
    
    def get_recommended_personas_for_industry(
        self,
        industry: str
    ) -> List[PersonaType]:
        """
        Get recommended persona types for a specific industry.
        
        Args:
            industry: The brand's industry
            
        Returns:
            List of recommended PersonaType
        """
        industry_lower = industry.lower()
        
        # B2B Tech / SaaS
        if any(kw in industry_lower for kw in ["saas", "software", "tech", "enterprise"]):
            return [
                PersonaType.TECHNICAL_EXPERT,
                PersonaType.BUSINESS_LEADER,
                PersonaType.DEVELOPER,
                PersonaType.PROCUREMENT,
            ]
        
        # Consumer / E-commerce
        if any(kw in industry_lower for kw in ["consumer", "retail", "ecommerce", "shopping"]):
            return [
                PersonaType.END_USER,
                PersonaType.BEGINNER,
                PersonaType.RESEARCHER,
            ]
        
        # Professional Services
        if any(kw in industry_lower for kw in ["consulting", "agency", "services", "legal", "finance"]):
            return [
                PersonaType.BUSINESS_LEADER,
                PersonaType.RESEARCHER,
                PersonaType.PROCUREMENT,
            ]
        
        # Healthcare / Medical
        if any(kw in industry_lower for kw in ["health", "medical", "pharma", "biotech"]):
            return [
                PersonaType.RESEARCHER,
                PersonaType.TECHNICAL_EXPERT,
                PersonaType.END_USER,
            ]
        
        # Default mix
        return [
            PersonaType.TECHNICAL_EXPERT,
            PersonaType.BUSINESS_LEADER,
            PersonaType.END_USER,
            PersonaType.BEGINNER,
        ]


# Singleton instance
_persona_manager: Optional[PersonaManager] = None


def get_persona_manager() -> PersonaManager:
    """Get singleton instance."""
    global _persona_manager
    if _persona_manager is None:
        _persona_manager = PersonaManager()
    return _persona_manager
