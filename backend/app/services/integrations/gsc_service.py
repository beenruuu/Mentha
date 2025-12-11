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

    def _get_credentials(self, credentials_json: Dict[str, Any]) -> Credentials:
        """Create Credentials object from JSON and refresh if needed."""
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
                raise ValueError("Credentials are not valid and cannot be refreshed")
        
        return creds

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
        creds = self._get_credentials(credentials_json)

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
        creds = self._get_credentials(credentials_json)

        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {creds.token}"}
            response = await client.get("https://www.googleapis.com/webmasters/v3/sites", headers=headers)
            response.raise_for_status()
            data = response.json()
            return [site["siteUrl"] for site in data.get("siteEntry", [])]

    async def get_sites_with_details(self, credentials_json: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fetch list of verified sites with permission levels."""
        creds = self._get_credentials(credentials_json)

        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {creds.token}"}
            response = await client.get("https://www.googleapis.com/webmasters/v3/sites", headers=headers)
            response.raise_for_status()
            data = response.json()
            return [
                {
                    "site_url": site["siteUrl"],
                    "permission_level": site.get("permissionLevel", "unknown")
                }
                for site in data.get("siteEntry", [])
            ]

    async def sync_performance_data(
        self,
        credentials_json: Dict[str, Any],
        brand_id: str,
        site_url: str,
        days_back: int = 30
    ) -> Dict[str, Any]:
        """
        Sync GSC performance data to database.
        
        Fetches the last N days of data and persists to gsc_performance table.
        """
        try:
            from supabase import create_client
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=days_back)
            
            logger.info(f"Syncing GSC data for {site_url} from {start_date} to {end_date}")
            
            # Fetch data with query and date dimensions
            rows = await self.get_search_analytics(
                credentials_json=credentials_json,
                site_url=site_url,
                start_date=start_date.isoformat(),
                end_date=end_date.isoformat(),
                dimensions=['query', 'date']
            )
            
            inserted_count = 0
            errors = []
            
            for row in rows:
                try:
                    keys = row.get('keys', [])
                    query = keys[0] if len(keys) > 0 else ''
                    date_str = keys[1] if len(keys) > 1 else end_date.isoformat()
                    
                    record = {
                        "brand_id": brand_id,
                        "site_url": site_url,
                        "query": query,
                        "clicks": row.get("clicks", 0),
                        "impressions": row.get("impressions", 0),
                        "ctr": row.get("ctr", 0),
                        "position": row.get("position", 0),
                        "date": date_str
                    }
                    
                    # Upsert to avoid duplicates
                    supabase.table("gsc_performance").upsert(
                        record,
                        on_conflict="brand_id,site_url,query,date"
                    ).execute()
                    
                    inserted_count += 1
                    
                except Exception as row_error:
                    errors.append(str(row_error))
                    continue
            
            # Update brand's GSC sync status
            supabase.table("brands").update({
                "gsc_connected": True,
                "gsc_site_url": site_url,
                "gsc_last_sync": datetime.utcnow().isoformat() + "Z"
            }).eq("id", brand_id).execute()
            
            # Update gsc_sites table
            supabase.table("gsc_sites").upsert({
                "brand_id": brand_id,
                "site_url": site_url,
                "last_sync_at": datetime.utcnow().isoformat() + "Z",
                "sync_status": "completed"
            }, on_conflict="brand_id,site_url").execute()
            
            logger.info(f"Synced {inserted_count} GSC records for brand {brand_id}")
            
            return {
                "status": "success",
                "rows_synced": inserted_count,
                "errors": errors[:5] if errors else None,
                "date_range": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to sync GSC data: {e}")
            
            # Update sync status to failed
            try:
                from supabase import create_client
                supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
                supabase.table("gsc_sites").update({
                    "sync_status": "failed",
                    "sync_error": str(e)
                }).eq("brand_id", brand_id).eq("site_url", site_url).execute()
            except:
                pass
            
            return {
                "status": "error",
                "error": str(e)
            }

    async def get_top_queries(
        self,
        credentials_json: Dict[str, Any],
        site_url: str,
        days_back: int = 30,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get top performing queries for a site.
        """
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days_back)
        
        rows = await self.get_search_analytics(
            credentials_json=credentials_json,
            site_url=site_url,
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            dimensions=['query']
        )
        
        # Sort by clicks and limit
        sorted_rows = sorted(rows, key=lambda x: x.get('clicks', 0), reverse=True)[:limit]
        
        return [
            {
                "query": row.get('keys', [''])[0],
                "clicks": row.get('clicks', 0),
                "impressions": row.get('impressions', 0),
                "ctr": round(row.get('ctr', 0) * 100, 2),
                "position": round(row.get('position', 0), 1)
            }
            for row in sorted_rows
        ]


# Singleton
gsc_service = GSCService()

