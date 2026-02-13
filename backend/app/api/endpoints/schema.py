"""
Schema Generator API - Generate structured data schemas for AEO.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

from app.services.generation.schema_generator_service import get_schema_service
from app.api import deps


router = APIRouter(prefix="/schema", tags=["Schema Generator"])


class FAQSchemaRequest(BaseModel):
    questions: List[Dict[str, str]]  # [{question, answer}]
    page_url: Optional[str] = ""


class HowToSchemaRequest(BaseModel):
    name: str
    description: str
    steps: List[Dict[str, str]]  # [{name, text, image?}]
    total_time: Optional[str] = ""
    image: Optional[str] = ""
    page_url: Optional[str] = ""


class ArticleSchemaRequest(BaseModel):
    headline: str
    description: str
    author_name: str
    date_published: str
    date_modified: Optional[str] = ""
    image: Optional[str] = ""
    publisher_name: Optional[str] = ""
    publisher_logo: Optional[str] = ""
    page_url: Optional[str] = ""


class OrganizationSchemaRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    url: Optional[str] = ""
    logo: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    address: Optional[Dict[str, str]] = None
    social_links: Optional[List[str]] = None


class SchemaResponse(BaseModel):
    generated_schema: Dict[str, Any] = Field(..., alias="schema")
    script_tag: str


@router.post("/faq", response_model=SchemaResponse)
async def generate_faq_schema(
    request: FAQSchemaRequest,
    current_user = Depends(deps.get_current_user)
):
    """Generate FAQPage schema."""
    service = get_schema_service()
    schema = service.generate_faq_schema(
        questions=request.questions,
        page_url=request.page_url
    )
    return SchemaResponse(
        schema=schema,
        script_tag=service.to_script_tag(schema)
    )


@router.post("/howto", response_model=SchemaResponse)
async def generate_howto_schema(
    request: HowToSchemaRequest,
    current_user = Depends(deps.get_current_user)
):
    """Generate HowTo schema."""
    service = get_schema_service()
    schema = service.generate_howto_schema(
        name=request.name,
        description=request.description,
        steps=request.steps,
        total_time=request.total_time,
        image=request.image,
        page_url=request.page_url
    )
    return SchemaResponse(
        schema=schema,
        script_tag=service.to_script_tag(schema)
    )


@router.post("/article", response_model=SchemaResponse)
async def generate_article_schema(
    request: ArticleSchemaRequest,
    current_user = Depends(deps.get_current_user)
):
    """Generate Article schema."""
    service = get_schema_service()
    schema = service.generate_article_schema(
        headline=request.headline,
        description=request.description,
        author_name=request.author_name,
        date_published=request.date_published,
        date_modified=request.date_modified,
        image=request.image,
        publisher_name=request.publisher_name,
        publisher_logo=request.publisher_logo,
        page_url=request.page_url
    )
    return SchemaResponse(
        schema=schema,
        script_tag=service.to_script_tag(schema)
    )


@router.post("/organization", response_model=SchemaResponse)
async def generate_organization_schema(
    request: OrganizationSchemaRequest,
    current_user = Depends(deps.get_current_user)
):
    """Generate Organization schema."""
    service = get_schema_service()
    schema = service.generate_organization_schema(
        name=request.name,
        description=request.description,
        url=request.url,
        logo=request.logo,
        email=request.email,
        phone=request.phone,
        address=request.address,
        social_links=request.social_links
    )
    return SchemaResponse(
        schema=schema,
        script_tag=service.to_script_tag(schema)
    )
