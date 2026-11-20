import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.agents import router as agents_router
from backend.app.api.chat import router as chat_router
from backend.app.api.coding import router as coding_router
from backend.app.api.finance import router as finance_router
from backend.app.api.gmail import router as gmail_router
from backend.app.api.agents import router as agents_router

# Import API Routers
from backend.app.api.health import router as health_router
from backend.app.api.productivity import router as productivity_router
from backend.app.api.settings import router as settings_router
from backend.app.api.system import router as system_router
from backend.app.config import settings
from backend.app.database import init_db
from backend.app.security.token_middleware import SessionCapabilityMiddleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("HadesBackend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for FastAPI startup and graceful shutdown."""
    logger.info("Khởi động HADES OS Backend...")
    logger.info(f"Dữ liệu cục bộ được lưu tại: {settings.DATA_DIR}")
    # Initialize SQLite database and seed initial data
    init_db()
    logger.info("Cơ sở dữ liệu SQLite đã sẵn sàng (WAL mode enabled).")
    yield
    logger.info("Đang tắt HADES OS Backend một cách an toàn...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="HADES OS Backend — API điều phối Đa Tác nhân & Giám sát hệ thống",
    lifespan=lifespan
)

# 1. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Session Capability Security Middleware (checks Authorization Bearer token & Host header)
app.add_middleware(SessionCapabilityMiddleware)

# 3. Include Routers
app.include_router(health_router)
app.include_router(system_router)
app.include_router(finance_router)
app.include_router(coding_router)
app.include_router(productivity_router)
app.include_router(settings_router)
app.include_router(chat_router)
app.include_router(gmail_router)
app.include_router(agents_router)

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "online",
        "doc": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=False)
