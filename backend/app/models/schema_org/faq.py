"""
FAQ Schema.org models.

FAQPage is one of the most important types for AEO because:
1. It directly matches question-answer format of AI responses
2. LLMs can easily extract and cite Q&A pairs
3. High visibility in Google's AI Overviews
"""

from typing import Any, Dict, List, Optional
from pydantic import Field, model_validator

from .base import SchemaOrgBase


class QuestionSchema(SchemaOrgBase):
    """
    Schema.org Question type for FAQ items.
    
    Best practices for GEO:
    - Question text should match natural user queries
    - Answer should be 40-60 words (optimal for AI snippets)
    - Include keywords naturally in both Q and A
    """
    
    # The question text
    name: str  # The question itself
    
    # The accepted answer
    accepted_answer: Optional["AnswerSchema"] = Field(
        default=None, alias="acceptedAnswer"
    )
    
    # Alternative answers (less common)
    suggested_answer: Optional[List["AnswerSchema"]] = Field(
        default=None, alias="suggestedAnswer"
    )
    
    # Answer count
    answer_count: Optional[int] = Field(default=None, alias="answerCount")
    
    # Upvote count (social proof)
    upvote_count: Optional[int] = Field(default=None, alias="upvoteCount")
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "Question"
    
    @classmethod
    def create(cls, question: str, answer: str) -> "QuestionSchema":
        """
        Factory method to create a Q&A pair.
        
        Args:
            question: The question text
            answer: The answer text (aim for 40-60 words)
        
        Returns:
            Configured QuestionSchema with answer
        """
        return cls(
            name=question,
            acceptedAnswer=AnswerSchema(text=answer)
        )


class AnswerSchema(SchemaOrgBase):
    """
    Schema.org Answer type.
    
    The answer portion of a Question-Answer pair.
    """
    
    text: str  # The answer content
    
    # Author of the answer
    author: Optional[Dict[str, Any]] = None
    
    # Date answered
    date_created: Optional[str] = Field(default=None, alias="dateCreated")
    
    # Social proof
    upvote_count: Optional[int] = Field(default=None, alias="upvoteCount")
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "Answer"


class FAQPageSchema(SchemaOrgBase):
    """
    Schema.org FAQPage type.
    
    Container for multiple Question-Answer pairs.
    
    GEO Best Practices:
    - Include 5-10 questions per page (not too many)
    - Questions should match real user search queries
    - Answers should be concise (40-60 words optimal)
    - Include the brand/product name in answers for attribution
    - Order by importance/frequency
    """
    
    name: Optional[str] = None
    description: Optional[str] = None
    
    # The main content - list of Q&As
    main_entity: List[QuestionSchema] = Field(alias="mainEntity")
    
    # Publisher (organization)
    publisher: Optional[Dict[str, Any]] = None
    
    # Last review date
    last_reviewed: Optional[str] = Field(default=None, alias="lastReviewed")
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "FAQPage"
    
    @classmethod
    def create_from_pairs(
        cls,
        qa_pairs: List[tuple],
        page_name: Optional[str] = None,
        page_description: Optional[str] = None
    ) -> "FAQPageSchema":
        """
        Factory method to create FAQ page from Q&A tuples.
        
        Args:
            qa_pairs: List of (question, answer) tuples
            page_name: Optional page title
            page_description: Optional page description
        
        Returns:
            Configured FAQPageSchema
        
        Example:
            faq = FAQPageSchema.create_from_pairs([
                ("What is AEO?", "AEO (Answer Engine Optimization) is..."),
                ("How does GEO work?", "GEO (Generative Engine Optimization)..."),
            ])
        """
        questions = [
            QuestionSchema.create(q, a)
            for q, a in qa_pairs
        ]
        
        return cls(
            name=page_name,
            description=page_description,
            mainEntity=questions
        )
    
    def add_question(self, question: str, answer: str) -> "FAQPageSchema":
        """
        Add a question-answer pair.
        
        Args:
            question: The question text
            answer: The answer text
        
        Returns:
            Self for chaining
        """
        self.main_entity.append(QuestionSchema.create(question, answer))
        return self
    
    @model_validator(mode="after")
    def validate_question_count(self) -> "FAQPageSchema":
        """Warn if too many questions (may dilute effectiveness)."""
        if len(self.main_entity) > 15:
            import logging
            logging.getLogger(__name__).warning(
                f"FAQPage has {len(self.main_entity)} questions. "
                "Consider splitting into multiple pages for better GEO."
            )
        return self


# Update forward references
QuestionSchema.model_rebuild()
