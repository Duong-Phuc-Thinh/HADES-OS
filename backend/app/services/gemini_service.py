import logging
import time
from typing import Any, Generator

from google import genai
from google.genai.errors import APIError

from backend.app.security.credential_vault import vault

logger = logging.getLogger("HadesGeminiService")

GEMINI_KEY_NAME = "GEMINI_API_KEY"

# Custom Exception Hierarchy with clear Vietnamese user explanations
class GeminiError(Exception):
    """Base class for Gemini service exceptions."""
    pass

class GeminiKeyMissingError(GeminiError):
    """Raised when the API key is not configured."""
    def __init__(self, message: str = "Chưa cấu hình Gemini API Key. Vui lòng vào Cài đặt để thêm khóa."):
        super().__init__(message)

class GeminiAuthError(GeminiError):
    """Raised when authentication fails (invalid, expired or revoked API key)."""
    def __init__(self, message: str = "Khóa Gemini API không hợp lệ hoặc đã bị vô hiệu hóa bởi Google."):
        super().__init__(message)

class GeminiQuotaExceededError(GeminiError):
    """Raised when API rate limits or quota are exhausted."""
    def __init__(self, message: str = "Hệ thống đã vượt quá giới hạn lượt gọi (Rate Limit / Quota Exceeded). Vui lòng thử lại sau giây lát."):
        super().__init__(message)

class GeminiNetworkError(GeminiError):
    """Raised on connection timeouts or network failures."""
    def __init__(self, message: str = "Không thể kết nối đến máy chủ Google Gemini. Vui lòng kiểm tra kết nối mạng."):
        super().__init__(message)


class GeminiService:
    """
    Official Google GenAI SDK wrapper.
    Handles credential retrieval from Windows Credential Vault, connection testing,
    streaming generation, retries with exponential backoff, and robust error translation.
    """

    SUPPORTED_MODELS: list[dict[str, str]] = [
        {
            "id": "gemini-2.5-flash",
            "name": "Gemini 2.5 Flash",
            "description": "Tối ưu hóa độ trễ, phản hồi tức thì, thông minh và tiết kiệm tài nguyên."
        },
        {
            "id": "gemini-2.5-pro",
            "name": "Gemini 2.5 Pro",
            "description": "Suy luận chuyên sâu, lập luận phức tạp và phân tích mã nguồn chi tiết."
        },
        {
            "id": "gemini-2.0-flash",
            "name": "Gemini 2.0 Flash",
            "description": "Thế hệ 2.0 tốc độ cao cho các tác vụ tổng quát."
        }
    ]

    def __init__(self):
        pass

    def get_api_key(self) -> str | None:
        return vault.get_secret(GEMINI_KEY_NAME)

    def is_configured(self) -> bool:
        key = self.get_api_key()
        return bool(key and len(key.strip()) > 5)

    def get_client(self, api_key: str | None = None) -> genai.Client:
        key = api_key or self.get_api_key()
        if not key or len(key.strip()) < 5:
            raise GeminiKeyMissingError()
        return genai.Client(api_key=key.strip())

    def get_supported_models(self) -> list[dict[str, str]]:
        return self.SUPPORTED_MODELS

    def test_connection(self, api_key: str | None = None) -> dict[str, Any]:
        """Test the validity of the Gemini API key by making a minimal ping call."""
        client = self.get_client(api_key=api_key)
        try:
            # Lightweight verification prompt
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents="ping",
                config={"max_output_tokens": 5}
            )
            return {
                "valid": True,
                "message": "Kết nối Gemini API thành công!",
                "timestamp": time.time()
            }
        except APIError as e:
            self._handle_api_error(e)
        except Exception as e:
            raise GeminiNetworkError(f"Lỗi kết nối Gemini: {str(e)}")

    def generate_content(
        self,
        prompt: str,
        model: str = "gemini-2.5-flash",
        system_instruction: str | None = None,
        max_retries: int = 2
    ) -> str:
        """Synchronous content generation with retry logic for transient errors."""
        client = self.get_client()
        last_error = None

        config: dict[str, Any] = {}
        if system_instruction:
            config["system_instruction"] = system_instruction

        for attempt in range(max_retries + 1):
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=config if config else None
                )
                return response.text or ""
            except APIError as e:
                # If rate limited and has attempts left, back off
                if e.code == 429 and attempt < max_retries:
                    time.sleep(1.5 * (2 ** attempt))
                    continue
                self._handle_api_error(e)
            except Exception as e:
                last_error = e
                if attempt < max_retries:
                    time.sleep(1.0)
                    continue

        raise GeminiNetworkError(f"Không thể hoàn thành yêu cầu sau {max_retries} lần thử: {last_error}")

    def generate_stream(
        self,
        prompt: str,
        model: str = "gemini-2.5-flash",
        system_instruction: str | None = None
    ) -> Generator[str, None, None]:
        """
        Stream generator yielding response text chunks as they arrive from Google.
        Translates API errors into clear Vietnamese exceptions.
        """
        client = self.get_client()
        config: dict[str, Any] = {}
        if system_instruction:
            config["system_instruction"] = system_instruction

        try:
            stream = client.models.generate_content_stream(
                model=model,
                contents=prompt,
                config=config if config else None
            )
            for chunk in stream:
                if chunk.text:
                    yield chunk.text
        except APIError as e:
            self._handle_api_error(e)
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            raise GeminiNetworkError(f"Lỗi khi truyền dữ liệu trực tiếp: {str(e)}")

    def _handle_api_error(self, e: APIError):
        """Translate Google APIError codes to domain-specific Vietnamese exceptions."""
        logger.error(f"Gemini API Error [{e.code}]: {e.message}")
        if e.code in (400, 401, 403):
            raise GeminiAuthError(f"Khóa Gemini API không hợp lệ hoặc không có quyền truy cập (Mã lỗi {e.code}).")
        elif e.code == 429:
            raise GeminiQuotaExceededError(
                "Hệ thống đã đạt giới hạn yêu cầu (Rate limit / Quota Exceeded). Vui lòng đợi ít phút hoặc nâng cấp gói API."
            )
        elif e.code and e.code >= 500:
            raise GeminiNetworkError(f"Máy chủ Google Gemini đang gặp sự cố tạm thời (Mã lỗi {e.code}). Vui lòng thử lại sau.")
        else:
            raise GeminiError(f"Lỗi Gemini API: {e.message}")

# Global singleton
gemini_service = GeminiService()
