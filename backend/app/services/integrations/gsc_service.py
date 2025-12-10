import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import httpx
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from app.core.config import settings

logger = logging.getLogger(__name__)

class GSCService:
    """
    Service to interact with Google Search Console API.
    Handles OAuth flow and data fetching.
    """
    
    SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']
    
    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI
        
    def get_authorization_url(self, state: str) -> str:
        """Generate the authorization URL for the user."""
        if not self.client_id or not self.client_secret:
            raise ValueError("Google Client ID and Secret are not configured")
            
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=self.SCOPES,
            redirect_uri=self.redirect_uri
        )
        
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=state
        )
        return authorization_url

    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange the auth code for access and refresh tokens."""
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=self.SCOPES,
            redirect_uri=self.redirect_uri
        )
        
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        return {
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": credentials.scopes,
            "expiry": credentials.expiry.isoformat() if credentials.expiry else None
        }

    async def get_search_analytics(
        self, 
        credentials_json: Dict[str, Any], 
        site_url: str, 
        start_date: str, 
        end_date: str,
        dimensions: List[str] = ['query']
    ) -> List[Dict[str, Any]]:
        """
        Fetch search analytics data (clicks, impressions, ctr, position).
        """
        creds = Credentials(
            token=credentials_json.get("access_token"),
            refresh_token=credentials_json.get("refresh_token"),
            token_uri=credentials_json.get("token_uri"),
            client_id=credentials_json.get("client_id"),
            client_secret=credentials_json.get("client_secret"),
            scopes=credentials_json.get("scopes")
        )

        if not creds.valid:
            if creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                raise ValueError("Credentials are not valid")

        api_url = f"https://www.googleapis.com/webmasters/v3/sites/{site_url}/searchAnalytics/query"
        
        payload = {
            "startDate": start_date,
            "endDate": end_date,
            "dimensions": dimensions,
            "rowLimit": 5000
        }
        
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {creds.token}"}
            response = await client.post(api_url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            return data.get("rows", [])

    async def get_sites(self, credentials_json: Dict[str, Any]) -> List[str]:
        """Fetch list of verified sites."""
        creds = Credentials(
            token=credentials_json.get("access_token"),
            refresh_token=credentials_json.get("refresh_token"),
            token_uri=credentials_json.get("token_uri"),
            client_id=credentials_json.get("client_id"),
            client_secret=credentials_json.get("client_secret"),
            scopes=credentials_json.get("scopes")
        )

        if not creds.valid:
            if creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                raise ValueError("Credentials are not valid")

        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {creds.token}"}
            response = await client.get("https://www.googleapis.com/webmasters/v3/sites", headers=headers)
            response.raise_for_status()
            data = response.json()
            return [site["siteUrl"] for site in data.get("siteEntry", [])]

# Singleton
gsc_service = GSCService()
