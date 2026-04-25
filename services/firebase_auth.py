from __future__ import annotations

from pathlib import Path
from typing import Any

import firebase_admin
from firebase_admin import auth, credentials
from firebase_admin.auth import InvalidIdTokenError, ExpiredIdTokenError

from config import settings

# Lazy-initialized Firebase Admin app
_firebase_app: firebase_admin.App | None = None


def _get_firebase_app() -> firebase_admin.App:
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    creds_path = settings.firebase_credentials_path
    if creds_path and Path(creds_path).exists():
        cred = credentials.Certificate(creds_path)
    else:
        # Attempt default credentials (GCE, Cloud Run, etc.)
        try:
            cred = credentials.ApplicationDefault()
        except Exception as exc:
            raise RuntimeError(
                "Firebase credentials not found. "
                "Set FIREBASE_CREDENTIALS_PATH to a service-account JSON file, "
                "or configure Application Default Credentials."
            ) from exc

    _firebase_app = firebase_admin.initialize_app(cred)
    return _firebase_app


def verify_firebase_token(id_token: str) -> dict[str, Any]:
    """Verify a Firebase ID token and return the decoded claims.

    Raises ValueError if the token is invalid or expired.
    """
    _get_firebase_app()
    try:
        decoded = auth.verify_id_token(id_token, check_revoked=True)
        return decoded
    except (InvalidIdTokenError, ExpiredIdTokenError) as exc:
        raise ValueError(f"Invalid or expired Firebase token: {exc}")
    except Exception as exc:
        raise ValueError(f"Firebase token verification failed: {exc}")


def get_user_email(uid: str) -> str | None:
    """Lookup a user's email by Firebase UID."""
    _get_firebase_app()
    try:
        user = auth.get_user(uid)
        return user.email
    except Exception:
        return None
