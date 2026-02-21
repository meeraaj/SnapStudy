"""Azure AI Document Intelligence (Form Recognizer) — OCR service."""

from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential

from src.config import AZURE_FORM_RECOGNIZER_ENDPOINT, AZURE_FORM_RECOGNIZER_KEY


def get_document_client() -> DocumentAnalysisClient:
    return DocumentAnalysisClient(
        endpoint=AZURE_FORM_RECOGNIZER_ENDPOINT,
        credential=AzureKeyCredential(AZURE_FORM_RECOGNIZER_KEY),
    )


def extract_text_from_image(image_data: bytes) -> str:
    """
    Send an image to Azure AI Document Intelligence and return extracted text.

    Uses the prebuilt-read model which handles handwritten + printed text.
    """
    client = get_document_client()
    poller = client.begin_analyze_document("prebuilt-read", document=image_data)
    result = poller.result()

    lines: list[str] = []
    for page in result.pages:
        for line in page.lines:
            lines.append(line.content)

    return "\n".join(lines)
