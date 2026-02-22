"""Proxy routes — forward authenticated requests to downstream services."""

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response

from src.config import NOTES_SERVICE_URL, PROGRESS_SERVICE_URL
from src.middleware.auth import verify_token

router = APIRouter(tags=["proxy"])

# Map path prefixes to downstream service URLs
SERVICE_MAP = {
    "/notes": NOTES_SERVICE_URL,
    "/subjects": PROGRESS_SERVICE_URL,
    "/chapters": PROGRESS_SERVICE_URL,
    "/progress": PROGRESS_SERVICE_URL,
}


def _resolve_service(path: str) -> str | None:
    """Return the base URL for the service that handles this path."""
    for prefix, url in SERVICE_MAP.items():
        if path.startswith(prefix):
            return url
    return None


@router.api_route(
    "/api/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
)
async def proxy(
    path: str,
    request: Request,
    user_id: str = Depends(verify_token),
):
    """Forward request to the appropriate downstream microservice."""
    full_path = f"/{path}"
    service_url = _resolve_service(full_path)

    if service_url is None:
        raise HTTPException(status_code=404, detail=f"No service found for path: {full_path}")

    # Build the downstream URL
    target_url = f"{service_url}{full_path}"

    # Forward query params + user_id
    params = dict(request.query_params)
    params["user_id"] = user_id

    body = await request.body()

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.request(
            method=request.method,
            url=target_url,
            params=params,
            content=body,
            headers={
                "content-type": request.headers.get("content-type", "application/json"),
            },
        )

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        media_type=resp.headers.get("content-type"),
    )
