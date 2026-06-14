"""Client portal — authentication routes (register, login, refresh, me)."""
from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse
from pydantic import EmailStr
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from database import get_session
from limiter import limiter
from middleware.api_key_auth import _hash_api_key
from middleware.client_jwt import (
    create_access_token,
    get_current_client,
    verify_access_token,
)
from models import IntegrationClient
from schemas.client import (
    ApiKeyRegenerateResponse,
    ApiKeyResponse,
    ClientAuthResponse,
    ClientLoginRequest,
    ClientLoginResponse,
    ClientProfileResponse,
    ClientRegisterRequest,
    RefreshResponse,
)

router = APIRouter(prefix="/api/v1/client", tags=["Client Portal Auth"])
TEMPLATES_DIR = Path(__file__).parent.parent / "static" / "templates"


def _hash_password(password: str) -> str:
    import hashlib as _h
    return _h.pbkdf2_hmac("sha256", password.encode(), b"logisight-client-salt", 100_000).hex()


def _verify_password(password: str, stored_hash: str) -> bool:
    import hmac as _hm
    computed = _hash_password(password)
    return _hm.compare_digest(computed, stored_hash)


def _generate_api_key() -> tuple[str, str, str]:
    from middleware.api_key_auth import API_KEY_SALT
    api_key = f"regc_{secrets.token_hex(24)}"
    api_key_hash = hashlib.sha256(f"{API_KEY_SALT}:{api_key}".encode()).hexdigest()
    api_key_prefix = api_key[:8]
    return api_key, api_key_hash, api_key_prefix


@router.post("/register", response_model=ClientAuthResponse)
@limiter.limit("5/hour")
def client_register(request: Request, body: ClientRegisterRequest, session: Session = Depends(get_session)):
    existing = session.scalar(
        select(IntegrationClient).where(IntegrationClient.contact_email == body.email)
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    password_hash = _hash_password(body.password)
    api_key, api_key_hash, api_key_prefix = _generate_api_key()

    client = IntegrationClient(
        name=body.company_name,
        company_name=body.company_name,
        contact_email=body.email,
        password_hash=password_hash,
        api_key_hash=api_key_hash,
        api_key_prefix=api_key_prefix,
        rate_limit_per_minute=1000,
        enabled=True,
    )
    session.add(client)
    session.commit()
    session.refresh(client)

    token = create_access_token(client.id, body.email)

    return ClientAuthResponse(
        access_token=token,
        client_id=client.id,
        company_name=client.company_name or client.name,
        email=body.email,
        api_key=api_key,
    )


@router.post("/login", response_model=ClientLoginResponse)
def client_login(body: ClientLoginRequest, session: Session = Depends(get_session)):
    client = session.scalar(
        select(IntegrationClient).where(IntegrationClient.contact_email == body.email)
    )
    if client is None or client.password_hash is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not _verify_password(body.password, client.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not client.enabled:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    token = create_access_token(client.id, body.email)

    return ClientLoginResponse(
        access_token=token,
        client_id=client.id,
        company_name=client.company_name or client.name,
        email=body.email,
    )


@router.post("/refresh", response_model=RefreshResponse)
def client_refresh(request: Request, session: Session = Depends(get_session)):
    """Refresh an expiring JWT. The token can be expired, but must be valid otherwise."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")

    token = auth_header.replace("Bearer ", "")
    from jose import JWTError, jwt
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm],
            options={"verify_exp": False},
        )
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    client_id = int(payload["sub"])
    email = payload.get("email", "")
    client = session.get(IntegrationClient, client_id)
    if client is None or not client.enabled:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Client not found")

    new_token = create_access_token(client_id, email)
    return RefreshResponse(access_token=new_token)


@router.get("/me", response_model=ClientProfileResponse)
def client_me(client: IntegrationClient = Depends(get_current_client), session: Session = Depends(get_session)):
    from models import DriverProfile, Facility, Objective, Vehicle
    from sqlalchemy import func

    has_facilities = session.scalar(
        select(func.count(Facility.id)).where(Facility.client_id == client.id)
    ) > 0
    has_vehicles = session.scalar(
        select(func.count(Vehicle.id)).where(Vehicle.client_id == client.id)
    ) > 0
    has_drivers = session.scalar(
        select(func.count(DriverProfile.id)).where(DriverProfile.client_id == client.id)
    ) > 0
    has_objectives = session.scalar(
        select(func.count(Objective.id)).where(Objective.client_id == client.id)
    ) > 0

    data_complete = all([has_facilities, has_vehicles, has_drivers, has_objectives])

    sim_status = None
    if data_complete:
        from models import ClientSimulation
        sim = session.scalar(
            select(ClientSimulation).where(ClientSimulation.client_id == client.id)
        )
        if sim is not None:
            sim_status = sim.status

    return ClientProfileResponse(
        id=client.id,
        name=client.name,
        company_name=client.company_name,
        email=client.contact_email,
        api_key_prefix=client.api_key_prefix,
        created_at=client.created_at,
        monthly_api_calls=client.monthly_api_calls,
        data_complete=data_complete,
        simulation_status=sim_status,
    )


@router.get("/key", response_model=ApiKeyResponse)
def client_key(client: IntegrationClient = Depends(get_current_client)):
    return ApiKeyResponse(api_key_prefix=client.api_key_prefix)


@router.post("/key/regenerate", response_model=ApiKeyRegenerateResponse)
def client_regenerate_key(client: IntegrationClient = Depends(get_current_client), session: Session = Depends(get_session)):
    api_key, api_key_hash, api_key_prefix = _generate_api_key()
    client.api_key_hash = api_key_hash
    client.api_key_prefix = api_key_prefix
    client.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    session.commit()
    return ApiKeyRegenerateResponse(api_key=api_key, api_key_prefix=api_key_prefix)


# ---------------------------------------------------------------------------
# Template Downloads
# ---------------------------------------------------------------------------

@router.get("/templates/facilities.csv")
def template_facilities():
    return FileResponse(TEMPLATES_DIR / "facilities.csv", media_type="text/csv", filename="facilities.csv")


@router.get("/templates/vehicles.csv")
def template_vehicles():
    return FileResponse(TEMPLATES_DIR / "vehicles.csv", media_type="text/csv", filename="vehicles.csv")


@router.get("/templates/drivers.csv")
def template_drivers():
    return FileResponse(TEMPLATES_DIR / "drivers.csv", media_type="text/csv", filename="drivers.csv")


@router.get("/templates/objectives.csv")
def template_objectives():
    return FileResponse(TEMPLATES_DIR / "objectives.csv", media_type="text/csv", filename="objectives.csv")
