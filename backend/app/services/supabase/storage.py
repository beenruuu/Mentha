from supabase import create_client, Client
from fastapi import UploadFile
from typing import List, Optional
import uuid

from app.core.config import settings


class SupabaseStorageService:
    """Service for interacting with Supabase Storage."""

    def __init__(self, bucket_name: str = "default"):
        """
        Initialize the Supabase storage service.

        Args:
            bucket_name: The name of the storage bucket (default: "default")
        """
        self.supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        self.bucket_name = bucket_name

        # Ensure the bucket exists
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Ensure the bucket exists, creating it if necessary."""
        try:
            self.supabase.storage.get_bucket(self.bucket_name)
        except Exception:
            self.supabase.storage.create_bucket(self.bucket_name)

    async def upload_file(self, file: UploadFile, path: Optional[str] = None) -> str:
        """
        Upload a file to Supabase Storage.

        Args:
            file: The file to upload
            path: Optional path within the bucket

        Returns:
            The public URL of the uploaded file
        """
        # Generate a unique filename
        filename = f"{uuid.uuid4()}-{file.filename}"

        # Create the full path
        full_path = f"{path}/{filename}" if path else filename

        # Read file content
        file_content = await file.read()

        # Upload to Supabase Storage
        self.supabase.storage.from_(self.bucket_name).upload(path=full_path, file=file_content, file_options={"content-type": file.content_type})

        # Return the public URL
        public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(full_path)

        return public_url

    def get_public_url(self, path: str) -> str:
        """Get the public URL for a file."""
        return self.supabase.storage.from_(self.bucket_name).get_public_url(path)

    def delete_file(self, path: str) -> bool:
        """Delete a file from storage."""
        try:
            self.supabase.storage.from_(self.bucket_name).remove([path])
            return True
        except Exception:
            return False

    def list_files(self, path: Optional[str] = None) -> List[dict]:
        """List files in a directory."""
        response = self.supabase.storage.from_(self.bucket_name).list(path or "")
        return response
