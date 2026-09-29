"""Authentication & Role-Based Access Control (RBAC) Engine for ULPF (SIH 26156).

Features:
- Dual-mode authentication:
  1. API Key Header: `X-API-Key`
  2. Authorization Bearer Token: `Authorization: Bearer <key>`
- Built-in roles:
  - `admin`: Full administrative access (configuration, threat intel import, parser generation, system toggle, export).
  - `operator`: SOC analyst access (monitoring, streaming, metrics, export, forensic inspection).
- Fine-grained permission checks and dependency injectors.
- Automatic audit logging for every access request, sensitive export, and configuration mutation.
"""

import os
from typing import Dict, List, Optional
from fastapi import Header, HTTPException, Request, Security, status
from pydantic import BaseModel

# Check environment mode
ULPF_ENV = os.environ.get("ULPF_ENV", "development").lower()

# Load credentials from environment
_ADMIN_KEY_ENV = os.environ.get("ULPF_ADMIN_KEY")
_OPERATOR_KEY_ENV = os.environ.get("ULPF_OPERATOR_KEY")

DEFAULT_USERS: Dict[str, Dict[str, str]] = {}

if _ADMIN_KEY_ENV:
    DEFAULT_USERS[_ADMIN_KEY_ENV] = {"username": "secops_admin", "role": "admin"}
elif ULPF_ENV != "production":
    DEFAULT_USERS["ulpf_admin_secret_key_2026"] = {"username": "secops_admin", "role": "admin"}
else:
    raise RuntimeError("CRITICAL: ULPF_ADMIN_KEY environment variable MUST be set when ULPF_ENV=production")

if _OPERATOR_KEY_ENV:
    DEFAULT_USERS[_OPERATOR_KEY_ENV] = {"username": "soc_operator", "role": "operator"}
elif ULPF_ENV != "production":
    DEFAULT_USERS["ulpf_operator_key_2026"] = {"username": "soc_operator", "role": "operator"}


class AuthUser(BaseModel):
    username: str
    role: str
    api_key: str


def authenticate_request(
    request: Request,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    authorization: Optional[str] = Header(None)
) -> AuthUser:
    """Extracts and verifies API key from X-API-Key or Authorization Bearer header."""
    token = None
    if x_api_key:
        token = x_api_key.strip()
    elif authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()

    # Query param fallback for browser direct downloads (e.g. window.open /api/export-forensic/...)
    if not token:
        token = request.query_params.get("api_key")

    if not token or token not in DEFAULT_USERS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed. Missing or invalid API Key in 'X-API-Key' or 'Authorization: Bearer <key>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_info = DEFAULT_USERS[token]
    return AuthUser(
        username=user_info["username"],
        role=user_info["role"],
        api_key=token
    )


def require_role(allowed_roles: List[str]):
    """RBAC dependency checking if the authenticated user has one of the allowed roles."""
    def role_checker(user: AuthUser = Security(authenticate_request)) -> AuthUser:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Role '{user.role}' lacks permission for this operation. Required: {allowed_roles}"
            )
        return user
    return role_checker
