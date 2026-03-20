"""Vision AI service — uses Qwen3-VL via Ollama for OCR and image summarization."""

import base64
import logging

import requests

from src.config import OLLAMA_BASE_URL, OLLAMA_EXTERNAL_URL

logger = logging.getLogger(__name__)

# Choose Cloudflare Tunnel route if in production, else fallback to WSL2 bridge
OLLAMA_ACTIVE_URL = OLLAMA_EXTERNAL_URL if OLLAMA_EXTERNAL_URL else OLLAMA_BASE_URL
OLLAMA_GENERATE_URL = f"{OLLAMA_ACTIVE_URL}/api/generate"
VISION_MODEL = "llama3.2-vision:latest"


def extract_text_from_image(image_data: bytes) -> str:
    """
    Send an image to Qwen3-VL via Ollama and extract all visible text.

    Uses the vision model to read handwritten + printed text from the photo.
    """
    base64_image = base64.b64encode(image_data).decode("utf-8")

    payload = {
        "model": VISION_MODEL,
        "prompt": (
            "Act as an academic OCR assistant. Extract all text, equations, and headings from this image. "
            "Format it into clean Markdown. If there are diagrams, describe them in brackets."
        ),
        "stream": False,
        "keep_alive": 0,  # Flush from VRAM immediately to prevent GPU out-of-memory
        "images": [base64_image],
    }

    try:
        response = requests.post(OLLAMA_GENERATE_URL, json=payload, timeout=600)
        response.raise_for_status()
        result = response.json()
        return result.get("response", "").strip() or "No text found in image."
    except requests.exceptions.Timeout as e:
        logger.error("Ollama OCR request timed out, VRAM limit might be hit: %s", e)
        return f"[OCR Error] Vision model timed out: {e}"
    except requests.exceptions.ConnectionError as e:
        logger.error("Ollama OCR connection refused, host might be down: %s", e)
        return f"[OCR Error] Could not connect to vision model: {e}"
    except requests.exceptions.RequestException as e:
        logger.error("Ollama OCR request failed: %s", e)
        return f"[OCR Error] Could not process image: {e}"


def summarize_image(image_data: bytes) -> str:
    """
    Send an image to Qwen3-VL via Ollama and return a detailed AI summary.

    Provides a comprehensive summary of the image content — useful for study notes.
    """
    base64_image = base64.b64encode(image_data).decode("utf-8")

    payload = {
        "model": VISION_MODEL,
        "prompt": (
            "Act as an academic OCR assistant. Extract all text, equations, and headings from this image. "
            "Format it into clean Markdown. If there are diagrams, describe them in brackets. "
            "Additionally, provide a well-structured summary that includes:\n"
            "1. **Main Topic**: What is this about?\n"
            "2. **Key Points**: List the most important concepts, definitions, or formulas.\n"
            "3. **Study Tips**: Highlight what a student should focus on."
        ),
        "stream": False,
        "keep_alive": 0,  # Flush from VRAM immediately to free the GPU
        "images": [base64_image],
    }

    try:
        response = requests.post(OLLAMA_GENERATE_URL, json=payload, timeout=600)
        response.raise_for_status()
        result = response.json()
        return result.get("response", "").strip() or "Could not generate summary."
    except requests.exceptions.Timeout as e:
        logger.error("Ollama summarize request timed out, VRAM limit might be hit: %s", e)
        return f"[Summary Error] Vision model timed out: {e}"
    except requests.exceptions.ConnectionError as e:
        logger.error("Ollama summarize connection refused, host might be down: %s", e)
        return f"[Summary Error] Could not connect to vision model: {e}"
    except requests.exceptions.RequestException as e:
        logger.error("Ollama summarize request failed: %s", e)
        return f"[Summary Error] Could not process image: {e}"
