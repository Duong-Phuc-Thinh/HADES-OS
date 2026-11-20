from unittest.mock import patch

from backend.app.services.gemini_service import gemini_service


def test_chat_stream_structure(client, auth_headers):
    """SSE streaming endpoint emits start, token, and done events."""
    # Mock offline fallback to generate controlled stream
    with patch.object(gemini_service, "is_configured", return_value=False):
        response = client.get(
            "/api/chat/stream?prompt=Kiểm tra CPU",
            headers=auth_headers
        )
        assert response.status_code == 200
        text = response.text
        assert "event: start" in text
        assert "event: token" in text
        assert "event: done" in text
        assert "SystemAgent" in text

def test_chat_stream_with_mock_gemini(client, auth_headers):
    """When Gemini is configured, SSE endpoint streams real chunks from GeminiService."""
    with patch.object(gemini_service, "is_configured", return_value=True), \
         patch.object(gemini_service, "generate_stream", return_value=iter(["Chào bạn, ", "tôi là HADES."])):
        response = client.get(
            "/api/chat/stream?prompt=Xin chào",
            headers=auth_headers
        )
        assert response.status_code == 200
        text = response.text
        assert "event: start" in text
        assert "Chào bạn" in text
        assert "tôi là HADES" in text
        assert "event: done" in text
