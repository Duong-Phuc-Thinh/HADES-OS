import os
import secrets
from pathlib import Path

from pydantic import BaseModel


def get_default_data_dir() -> Path:
    """Return standard Windows AppData directory or fallback to local directory."""
    appdata = os.environ.get("APPDATA")
    if appdata:
        data_dir = Path(appdata) / "HadesOS"
    else:
        data_dir = Path.home() / ".hades-os"
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir

class Settings(BaseModel):
    APP_NAME: str = "HADES OS Backend"
    VERSION: str = "1.0.0"
    HOST: str = "127.0.0.1"
    PORT: int = int(os.environ.get("HADES_PORT", "8765"))
    DATA_DIR: Path = get_default_data_dir()
    DATABASE_PATH: Path = get_default_data_dir() / "hades.db"
    
    # Session Capability Token: generated per launch or passed via env by Electron Main
    SESSION_TOKEN: str = os.environ.get("HADES_SESSION_TOKEN") or secrets.token_hex(32)
    
    # OS Credential Service Identifier
    KEYRING_SERVICE_NAME: str = "HADES_OS_KEYRING"
    
    # Allowed origin for Electron renderer
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "app://.",
        "file://"
    ]
    
    # Default currency
    DEFAULT_CURRENCY: str = "VND"
    
    # Default Gemini Model
    DEFAULT_GEMINI_MODEL: str = "gemini-2.5-flash"

settings = Settings()
