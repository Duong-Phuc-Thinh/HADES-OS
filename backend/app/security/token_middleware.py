from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from backend.app.config import settings


class SessionCapabilityMiddleware(BaseHTTPMiddleware):
    """
    Validates that incoming HTTP requests originate from 127.0.0.1 / localhost
    and present the valid Session Capability Bearer Token.
    Exempt paths: /api/health (for Electron readiness probe).
    """
    
    EXEMPT_PATHS = {"/api/health", "/docs", "/openapi.json"}
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # Pre-flight OPTIONS check for CORS
        if request.method == "OPTIONS":
            return await call_next(request)
            
        path = request.url.path
        if path in self.EXEMPT_PATHS:
            return await call_next(request)
            
        # 1. Validate Host header to guard against DNS rebinding
        host = request.headers.get("host", "")
        allowed_hosts = [
            f"127.0.0.1:{settings.PORT}",
            f"localhost:{settings.PORT}",
            "127.0.0.1",
            "localhost",
            "testserver"
        ]
        if not any(host.startswith(h) for h in allowed_hosts):
            return JSONResponse(
                status_code=403,
                content={"detail": "Truy cập bị từ chối: Host không hợp lệ (DNS Rebinding Guard)"}
            )
            
        # 2. Validate Session Capability Token
        auth_header = request.headers.get("Authorization", "")
        expected_token = settings.SESSION_TOKEN
        
        token = ""
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
            
        # Also check query param ?token= for EventSource/SSE where headers cannot be easily passed in standard browser EventSource
        if not token:
            token = request.query_params.get("token", "")
            
        if not token or token != expected_token:
            return JSONResponse(
                status_code=401,
                content={"detail": "Truy cập bị từ chối: Session Capability Token không hợp lệ hoặc thiếu"}
            )
            
        return await call_next(request)
