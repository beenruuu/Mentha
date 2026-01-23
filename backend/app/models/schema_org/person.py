"""
Person Schema.org model.

Provides strict typing for authors, experts, and contributors.
Critical for E-E-A-T signals in GEO/AEO.
"""

from typing import Any, Dict, List, Optional, Union
from pydantic import Field

from .base import SchemaOrgBase, ImageObject


class PersonSchema(SchemaOrgBase):
    """
    Schema.org Person type.
    
    Use for authors, experts, team members.
    
    Key GEO/E-E-A-T properties:
    - sameAs: Links to professional profiles (LinkedIn, ORCID, Twitter)
    - jobTitle: Establishes expertise context
    - worksFor: Organizational affiliation
    - alumniOf: Educational credentials
    - knowsAbout: Declared expertise areas
    - hasCredential: Professional certifications
    """
    
    # Core identity
    name: str
    given_name: Optional[str] = Field(default=None, alias="givenName")
    family_name: Optional[str] = Field(default=None, alias="familyName")
    
    # Professional identity (critical for E-E-A-T)
    job_title: Optional[str] = Field(default=None, alias="jobTitle")
    works_for: Optional[Dict[str, Any]] = Field(default=None, alias="worksFor")
    
    # Contact
    email: Optional[str] = None
    telephone: Optional[str] = None
    
    # Image
    image: Optional[Union[str, ImageObject]] = None
    
    # Credentials (E-E-A-T signals)
    alumni_of: Optional[Union[str, List[str], Dict[str, Any]]] = Field(
        default=None, alias="alumniOf"
    )
    has_credential: Optional[List[Dict[str, Any]]] = Field(
        default=None, alias="hasCredential"
    )
    award: Optional[Union[str, List[str]]] = None
    
    # Expertise declaration (helps topic matching)
    knows_about: Optional[List[str]] = Field(default=None, alias="knowsAbout")
    knows_language: Optional[List[str]] = Field(default=None, alias="knowsLanguage")
    
    # Nationality/location (for geo-relevance)
    nationality: Optional[str] = None
    home_location: Optional[str] = Field(default=None, alias="homeLocation")
    
    # Published works (establishes authority)
    # These would typically be populated from the Knowledge Graph
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "Person"
    
    @classmethod
    def create_author(
        cls,
        name: str,
        job_title: Optional[str] = None,
        url: Optional[str] = None,
        linkedin_url: Optional[str] = None,
        twitter_url: Optional[str] = None,
        orcid_url: Optional[str] = None
    ) -> "PersonSchema":
        """
        Factory method to create an author with common fields.
        
        Args:
            name: Full name
            job_title: Professional title
            url: Author page URL
            linkedin_url: LinkedIn profile URL
            twitter_url: Twitter/X profile URL
            orcid_url: ORCID profile URL (academic)
        
        Returns:
            Configured PersonSchema for use as article author
        """
        same_as = []
        if linkedin_url:
            same_as.append(linkedin_url)
        if twitter_url:
            same_as.append(twitter_url)
        if orcid_url:
            same_as.append(orcid_url)
        
        return cls(
            name=name,
            job_title=job_title,
            url=url,
            sameAs=same_as if same_as else None
        )
