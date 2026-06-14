"""JWT authentication middleware for client portal."""
from __future__ import annotations

from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from database import get_session
from models import IntegrationClient


def _get_token_from_header(request: Request) -> str:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )
    return auth_header.replace("Bearer ", "")


def _get_token_from_query(request: Request) -> str:
    token = request.query_params.get("token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing token query parameter",
        )
    return token


def create_access_token(client_id: int, email: str) -> str:
    from datetime import datetime, timedelta, timezone

    expire = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expiry_hours)
    payload = {
        "sub": str(client_id),
        "email": email,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def verify_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        client_id = payload.get("sub")
        if client_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


def get_current_client(request: Request, session: Session = Depends(get_session)) -> IntegrationClient:
    token = _get_token_from_header(request)
    payload = verify_access_token(token)
    client_id = int(payload["sub"])

    client = session.get(IntegrationClient, client_id)
    if client is None or not client.enabled:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Client not found or disabled")

    return client


def get_current_client_ws(request: Request, session: Session = Depends(get_session)) -> IntegrationClient:
    """Get client from WebSocket query param token. Does NOT use Depends injection
    since WebSocket endpoints don't support it. Call manually inside the WS handler."""
    token = _get_token_from_query(request)
    payload = verify_access_token(token)
    client_id = int(payload["sub"])

    client = session.get(IntegrationClient, client_id)
    if client is None or not client.enabled:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Client not found or disabled")

    return client


def resolve_client_from_token(token: str, session: Session) -> IntegrationClient | None:
    """Resolve client from a raw JWT token string. Returns None if invalid."""
    try:
        payload = verify_access_token(token)
        client_id = int(payload["sub"])
        return session.get(IntegrationClient, client_id)
    except Exception:
        return None
