"""
HowTo Schema.org models.

HowTo is critical for GEO because:
1. Matches "how to" user intent directly
2. LLMs can extract and present steps clearly
3. High visibility in Google's featured snippets and AI Overviews
"""

from datetime import timedelta
from typing import Any, Dict, List, Optional, Union
from pydantic import Field

from .base import SchemaOrgBase, ImageObject


class HowToStepSchema(SchemaOrgBase):
    """
    Schema.org HowToStep type.
    
    Individual step in a how-to guide.
    
    GEO Best Practices:
    - Keep step text concise (1-2 sentences)
    - Include action verbs at the start
    - Add images when visual guidance helps
    """
    
    # Step content
    name: Optional[str] = None  # Brief title
    text: str  # Detailed instruction
    
    # Position in sequence
    position: Optional[int] = None
    
    # Visual aids
    image: Optional[Union[str, ImageObject]] = None
    
    # URL to this step (if on separate page)
    url: Optional[str] = None
    
    # Time estimate for this step
    time_required: Optional[str] = Field(default=None, alias="timeRequired")
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "HowToStep"


class HowToSectionSchema(SchemaOrgBase):
    """
    Schema.org HowToSection type.
    
    Groups related steps under a section heading.
    Use for complex how-tos with distinct phases.
    """
    
    name: str  # Section title
    item_list_element: List[HowToStepSchema] = Field(alias="itemListElement")
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "HowToSection"


class HowToSchema(SchemaOrgBase):
    """
    Schema.org HowTo type.
    
    Complete how-to guide with steps.
    
    GEO Best Practices:
    - Name should match user search intent ("How to...")
    - Include estimated time (totalTime)
    - Supply and tool lists help with featured snippets
    - 5-10 steps is optimal for readability
    - Include cost estimate if relevant
    """
    
    # Core content
    name: str  # Title (should start with "How to")
    description: Optional[str] = None
    
    # Steps (can be flat or sectioned)
    step: List[Union[HowToStepSchema, HowToSectionSchema]] = Field(
        default_factory=list
    )
    
    # Time estimates
    total_time: Optional[str] = Field(default=None, alias="totalTime")
    prep_time: Optional[str] = Field(default=None, alias="prepTime")
    perform_time: Optional[str] = Field(default=None, alias="performTime")
    
    # Requirements
    supply: Optional[List[Dict[str, Any]]] = None
    tool: Optional[List[Dict[str, Any]]] = None
    
    # Cost
    estimated_cost: Optional[Dict[str, Any]] = Field(
        default=None, alias="estimatedCost"
    )
    
    # Visual
    image: Optional[Union[str, List[str], ImageObject]] = None
    video: Optional[Dict[str, Any]] = None
    
    # Yield (what you get at the end)
    yield_value: Optional[str] = Field(default=None, alias="yield")
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "HowTo"
    
    @classmethod
    def create_simple(
        cls,
        title: str,
        steps: List[str],
        description: Optional[str] = None,
        total_minutes: Optional[int] = None
    ) -> "HowToSchema":
        """
        Factory method to create a simple how-to from step strings.
        
        Args:
            title: Title (should start with "How to")
            steps: List of step instruction strings
            description: Optional description
            total_minutes: Optional total time in minutes
        
        Returns:
            Configured HowToSchema
        
        Example:
            howto = HowToSchema.create_simple(
                "How to Optimize for AI Search",
                [
                    "Implement structured data markup on all pages",
                    "Create an llms.txt file at your domain root",
                    "Build a knowledge graph of your content",
                ],
                total_minutes=60
            )
        """
        step_objects = [
            HowToStepSchema(text=text, position=i+1)
            for i, text in enumerate(steps)
        ]
        
        total_time = None
        if total_minutes:
            total_time = f"PT{total_minutes}M"
        
        return cls(
            name=title,
            description=description,
            step=step_objects,
            totalTime=total_time
        )
    
    def add_step(
        self,
        text: str,
        name: Optional[str] = None,
        image: Optional[str] = None
    ) -> "HowToSchema":
        """
        Add a step to the how-to.
        
        Args:
            text: Step instruction text
            name: Optional step title
            image: Optional image URL
        
        Returns:
            Self for chaining
        """
        position = len(self.step) + 1
        self.step.append(HowToStepSchema(
            text=text,
            name=name,
            image=image,
            position=position
        ))
        return self
    
    def add_supply(self, name: str, url: Optional[str] = None) -> "HowToSchema":
        """Add a required supply/material."""
        if self.supply is None:
            self.supply = []
        
        supply = {"@type": "HowToSupply", "name": name}
        if url:
            supply["url"] = url
        
        self.supply.append(supply)
        return self
    
    def add_tool(self, name: str, url: Optional[str] = None) -> "HowToSchema":
        """Add a required tool."""
        if self.tool is None:
            self.tool = []
        
        tool = {"@type": "HowToTool", "name": name}
        if url:
            tool["url"] = url
        
        self.tool.append(tool)
        return self
    
    def set_estimated_cost(
        self,
        value: float,
        currency: str = "USD"
    ) -> "HowToSchema":
        """Set the estimated cost."""
        self.estimated_cost = {
            "@type": "MonetaryAmount",
            "value": value,
            "currency": currency
        }
        return self
