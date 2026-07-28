"""Supabase Storage Service with local disk fallback."""

import os
from typing import Tuple
from database.supabase_client import supabase_client, is_supabase_configured

LOCAL_STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "documents")
os.makedirs(LOCAL_STORAGE_DIR, exist_ok=True)
BUCKET_NAME = "documents"


class StorageService:
    """Handles file storage in Supabase Storage with local filesystem fallback."""

    @staticmethod
    def _ensure_bucket():
        """Ensure the 'documents' bucket exists in Supabase."""
        if not supabase_client:
            return
        try:
            buckets = supabase_client.storage.list_buckets()
            bucket_names = [b.name for b in buckets] if buckets else []
            if BUCKET_NAME not in bucket_names:
                supabase_client.storage.create_bucket(BUCKET_NAME, options={"public": True})
                print(f"[Supabase Storage] Created bucket '{BUCKET_NAME}'.")
        except Exception as e:
            print(f"[Supabase Storage] Notice checking/creating bucket: {e}")

    @classmethod
    def upload_file(cls, filename: str, file_bytes: bytes, doc_id: str) -> Tuple[str, str]:
        """
        Upload file to Supabase Storage bucket 'documents'.
        Returns (storage_path, storage_url).
        Falls back to local file system if Supabase is unavailable.
        """
        file_path_in_bucket = f"{doc_id}/{filename}"
        
        # 1. Try Supabase Storage upload
        if supabase_client and is_supabase_configured():
            try:
                cls._ensure_bucket()
                res = supabase_client.storage.from_(BUCKET_NAME).upload(
                    path=file_path_in_bucket,
                    file=file_bytes,
                    file_options={"upsert": "true"}
                )
                
                # Get public URL
                public_url_resp = supabase_client.storage.from_(BUCKET_NAME).get_public_url(file_path_in_bucket)
                public_url = public_url_resp if isinstance(public_url_resp, str) else str(public_url_resp)
                
                print(f"[Supabase Storage] Successfully uploaded '{filename}' to bucket '{BUCKET_NAME}'.")
                return file_path_in_bucket, public_url
            except Exception as e:
                print(f"[Supabase Storage] Warning uploading file, using local fallback: {e}")

        # 2. Local fallback
        local_dir = os.path.join(LOCAL_STORAGE_DIR, doc_id)
        os.makedirs(local_dir, exist_ok=True)
        local_file_path = os.path.join(local_dir, filename)
        with open(local_file_path, "wb") as f:
            f.write(file_bytes)

        print(f"[Local Storage] Saved file '{filename}' to '{local_file_path}'.")
        return f"local://{doc_id}/{filename}", local_file_path

    @classmethod
    def get_file_url(cls, storage_path: str) -> str:
        """Get file URL or path for a given storage path."""
        if storage_path.startswith("local://"):
            subpath = storage_path.replace("local://", "")
            return os.path.join(LOCAL_STORAGE_DIR, subpath)

        if supabase_client and is_supabase_configured():
            try:
                url_resp = supabase_client.storage.from_(BUCKET_NAME).get_public_url(storage_path)
                return url_resp if isinstance(url_resp, str) else str(url_resp)
            except Exception:
                pass
        return f"/api/documents/download/{storage_path}"

    @classmethod
    def delete_file(cls, storage_path: str) -> bool:
        """Delete file from Supabase Storage or local disk."""
        if storage_path.startswith("local://"):
            subpath = storage_path.replace("local://", "")
            local_file_path = os.path.join(LOCAL_STORAGE_DIR, subpath)
            if os.path.exists(local_file_path):
                os.remove(local_file_path)
                return True
            return False

        if supabase_client and is_supabase_configured():
            try:
                supabase_client.storage.from_(BUCKET_NAME).remove([storage_path])
                print(f"[Supabase Storage] Deleted file '{storage_path}' from bucket '{BUCKET_NAME}'.")
                return True
            except Exception as e:
                print(f"[Supabase Storage] Notice deleting file: {e}")
        return True


storage_service = StorageService()

