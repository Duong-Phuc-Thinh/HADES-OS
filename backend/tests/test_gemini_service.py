from unittest.mock import MagicMock, patch

import pytest
from google.genai.errors import APIError

from backend.app.services.gemini_service import (
    GeminiAuthError,
    GeminiKeyMissingError,
    GeminiQuotaExceededError,
    GeminiService,
)


def test_gemini_service_missing_key():
    """Service should raise GeminiKeyMissingError when no key is set in vault."""
    service = GeminiService()
    with patch("backend.app.security.credential_vault.vault.get_secret", return_value=None):
        assert not service.is_configured()
        with pytest.raises(GeminiKeyMissingError) as exc_info:
            service.get_client()
        assert "Chưa cấu hình" in str(exc_info.value)

def test_gemini_service_invalid_key_handling():
    """Service should translate 400/403 API errors to GeminiAuthError."""
    service = GeminiService()
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = APIError(400, {"error": {"message": "API_KEY_INVALID"}})
    
    with patch.object(service, "get_client", return_value=mock_client):
        with pytest.raises(GeminiAuthError) as exc_info:
            service.generate_content(prompt="Test prompt")
        assert "không hợp lệ" in str(exc_info.value)

def test_gemini_service_quota_exceeded_handling():
    """Service should translate 429 ResourceExhausted to GeminiQuotaExceededError."""
    service = GeminiService()
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = APIError(429, {"error": {"message": "RESOURCE_EXHAUSTED"}})
    
    with patch.object(service, "get_client", return_value=mock_client):
        with pytest.raises(GeminiQuotaExceededError) as exc_info:
            service.generate_content(prompt="Test prompt", max_retries=0)
        assert "giới hạn" in str(exc_info.value)

def test_gemini_service_model_listing():
    """Service should provide list of supported models."""
    service = GeminiService()
    models = service.get_supported_models()
    assert len(models) >= 3
    ids = [m["id"] for m in models]
    assert "gemini-2.5-flash" in ids

def test_gemini_service_stream_generation_with_mock():
    """Service should yield chunks in stream generation."""
    service = GeminiService()
    mock_client = MagicMock()
    
    # Mock chunks
    chunk1 = MagicMock()
    chunk1.text = "Xin chào "
    chunk2 = MagicMock()
    chunk2.text = "tôi là HADES."
    
    mock_client.models.generate_content_stream.return_value = [chunk1, chunk2]
    
    with patch.object(service, "get_client", return_value=mock_client):
        generator = service.generate_stream(prompt="Xin chào")
        chunks = list(generator)
        assert chunks == ["Xin chào ", "tôi là HADES."]
