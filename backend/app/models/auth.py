from pydantic import BaseModel, EmailStr
from typing import Optional


class UserProfile(BaseModel):
    """User profile information."""

    id: str
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    country: Optional[str] = None
    industry: Optional[str] = None
    role: Optional[str] = None
    company_name: Optional[str] = None
    discovery_source: Optional[str] = None

class UserProfileUpdate(BaseModel):
    """User profile update information."""
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    country: Optional[str] = None
    industry: Optional[str] = None
    role: Optional[str] = None
    company_name: Optional[str] = None
    discovery_source: Optional[str] = None


class TokenResponse(BaseModel):
    """OAuth token response."""

    access_token: str
    token_type: str
