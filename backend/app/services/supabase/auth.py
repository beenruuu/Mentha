from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions  # Import this
from app.core.config import settings


class SupabaseAuthService:
    """Service for handling Supabase authentication."""

    def __init__(self):
        """Initialize the Supabase client."""
        # Initialize with proper options structure
        # The headers attribute is needed by the Supabase client
        options = {"auto_refresh_token": True, "persist_session": True, "headers": {"X-Client-Info": "backend-api"}}

        # Create the client with the properly structured options
        self.supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    async def get_user(self, jwt_token: str):
        """Get user data from a JWT token."""
        # Use the Supabase client to get user information
        response = self.supabase.auth.get_user(jwt_token)
        return response.user

    async def sign_in_with_provider_token(self, provider: str, token: str) -> str:
        """Exchange a provider token (Google, LinkedIn) for a Supabase token."""
        if provider not in ["google", "linkedin"]:
            raise ValueError(f"Unsupported provider: {provider}")

        response = self.supabase.auth.sign_in_with_oauth_provider(provider=provider, access_token=token)

        if not response.session or not response.session.access_token:
            raise ValueError(f"Failed to authenticate with {provider}")

        return response.session.access_token


# Dependency to get the auth service
def get_auth_service() -> SupabaseAuthService:
    """Return an instance of the Supabase auth service."""
    return SupabaseAuthService()
