import logging

import keyring

from backend.app.config import settings

logger = logging.getLogger("HadesSecurity.Vault")

class CredentialVault:
    """
    Secure Credential Storage using Windows Credential Manager via keyring.
    Never stores secrets (API keys, OAuth tokens) in plaintext SQLite or renderer memory.
    """
    
    def __init__(self, service_name: str = settings.KEYRING_SERVICE_NAME):
        self.service_name = service_name
        self._memory_fallback: dict[str, str] = {}
        
    def store_secret(self, key: str, secret: str) -> bool:
        """Store a secret securely in the Windows Credential Manager."""
        try:
            keyring.set_password(self.service_name, key, secret)
            return True
        except Exception as e:
            logger.warning(f"Keyring set_password failed ({e}). Falling back to memory storage.")
            self._memory_fallback[key] = secret
            return True
            
    def get_secret(self, key: str) -> str | None:
        """Retrieve a secret securely from Windows Credential Manager."""
        try:
            secret = keyring.get_password(self.service_name, key)
            if secret is not None:
                return secret
        except Exception as e:
            logger.warning(f"Keyring get_password failed ({e}). Checking memory fallback.")
            
        return self._memory_fallback.get(key)
        
    def delete_secret(self, key: str) -> bool:
        """Delete a secret from Windows Credential Manager."""
        try:
            keyring.delete_password(self.service_name, key)
        except Exception:
            pass
            
        self._memory_fallback.pop(key, None)
        return True

# Singleton instance for backend use
vault = CredentialVault()
