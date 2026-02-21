"""Azure Blob Storage service — upload and delete photo-notes."""

from azure.storage.blob import BlobServiceClient, ContentSettings

from src.config import AZURE_STORAGE_CONNECTION_STRING, AZURE_STORAGE_CONTAINER_NAME


def get_blob_service_client() -> BlobServiceClient:
    return BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)


def upload_blob(blob_key: str, data: bytes, content_type: str = "image/jpeg") -> str:
    """Upload a file to Azure Blob Storage. Returns the blob URL."""
    client = get_blob_service_client()
    blob_client = client.get_blob_client(
        container=AZURE_STORAGE_CONTAINER_NAME, blob=blob_key
    )
    blob_client.upload_blob(
        data,
        overwrite=True,
        content_settings=ContentSettings(content_type=content_type),
    )
    return blob_client.url


def delete_blob(blob_key: str) -> None:
    """Delete a file from Azure Blob Storage."""
    client = get_blob_service_client()
    blob_client = client.get_blob_client(
        container=AZURE_STORAGE_CONTAINER_NAME, blob=blob_key
    )
    blob_client.delete_blob()
