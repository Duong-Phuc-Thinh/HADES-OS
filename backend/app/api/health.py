import time
from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.schemas import HealthResponse

router = APIRouter(prefix="/api/health", tags=["Health"])

START_TIME = time.time()

@router.get("", response_model=HealthResponse)
def get_health(db: Session = Depends(get_db)):
    """Health check endpoint used by Electron readiness probe and monitoring."""
    # Verify DB connectivity
    db.execute(text("SELECT 1"))
    
    uptime = time.time() - START_TIME
    return HealthResponse(
        status="ok",
        app_name=settings.APP_NAME,
        version=settings.VERSION,
        timestamp=datetime.now(UTC),
        uptime_seconds=round(uptime, 2),
        data_dir=str(settings.DATA_DIR)
    )
