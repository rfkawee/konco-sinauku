import hashlib
from typing import Optional
from fastapi import Header

def get_current_member_id(
    x_member_id: Optional[str] = Header(None, alias="X-Member-Id"),
    authorization: Optional[str] = Header(None)
) -> str:
    """
    Mengambil member_id dari header request.
    Prioritas:
    1. Header eksplisit X-Member-Id (contoh: MBR-A1B2C3D4)
    2. Header Authorization Bearer token (diambil 8 karakter awal hash)
    3. Fallback: MBR-GUEST (tamu)
    """
    if x_member_id and x_member_id.strip():
        clean_id = x_member_id.strip()
        if not clean_id.startswith("MBR-") and clean_id != "guest-student":
            return f"MBR-{clean_id[:8].upper()}"
        return clean_id

    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
        if len(token) >= 8:
            return f"MBR-{token[:8].upper()}"

    return "MBR-GUEST"

def generate_member_id(identifier: str) -> str:
    """Menghasilkan member_id unik yang konsisten berdasarkan email/user_id."""
    clean = identifier.strip().lower()
    digest = hashlib.sha256(clean.encode("utf-8")).hexdigest()[:8].upper()
    return f"MBR-{digest}"
