from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.agent import AuditLog
from backend.app.models.settings import AppSetting
from backend.app.schemas import GeminiSettingsResponse, GeminiSettingsUpdate
from backend.app.security.credential_vault import vault
from backend.app.services.gemini_service import gemini_service, GeminiError

router = APIRouter(prefix="/api/settings", tags=["Settings"])

GEMINI_KEY_NAME = "GEMINI_API_KEY"

@router.get("/gemini/models")
def get_gemini_models():
    """Return list of recommended and verified Gemini models."""
    return gemini_service.get_supported_models()

@router.post("/gemini/test")
def test_gemini_connection(payload: GeminiSettingsUpdate):
    """Test Gemini API connectivity with provided or stored key."""
    try:
        result = gemini_service.test_connection(payload.api_key)
        return result
    except GeminiError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi không xác định: {str(e)}")

@router.get("/gemini", response_model=GeminiSettingsResponse)
def get_gemini_settings(db: Session = Depends(get_db)):
    """Check if Gemini API Key is configured in Windows Credential Manager without exposing the secret."""
    key = vault.get_secret(GEMINI_KEY_NAME)
    model_setting = db.query(AppSetting).filter(AppSetting.key == "gemini_model").first()
    temp_setting = db.query(AppSetting).filter(AppSetting.key == "gemini_temperature").first()
    
    return GeminiSettingsResponse(
        is_configured=bool(key and len(key) > 5),
        model_name=model_setting.value if model_setting else "gemini-2.5-flash",
        temperature=float(temp_setting.value) if temp_setting else 0.7
    )

@router.post("/gemini")
def update_gemini_settings(payload: GeminiSettingsUpdate, db: Session = Depends(get_db)):
    """Update Gemini API Key in Windows Credential Manager and model preferences."""
    if payload.api_key is not None:
        if payload.api_key.strip():
            vault.store_secret(GEMINI_KEY_NAME, payload.api_key.strip())
        else:
            vault.delete_secret(GEMINI_KEY_NAME)
            
    if payload.model_name:
        setting = db.query(AppSetting).filter(AppSetting.key == "gemini_model").first()
        if not setting:
            setting = AppSetting(key="gemini_model", value=payload.model_name, category="gemini")
            db.add(setting)
        else:
            setting.value = payload.model_name
            
    if payload.temperature is not None:
        setting = db.query(AppSetting).filter(AppSetting.key == "gemini_temperature").first()
        if not setting:
            setting = AppSetting(key="gemini_temperature", value=str(payload.temperature), category="gemini")
            db.add(setting)
        else:
            setting.value = str(payload.temperature)
            
    db.commit()
    return {"message": "Cấu hình Gemini đã được cập nhật an toàn vào Windows Credential Manager"}

@router.get("/audit-logs")
def get_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "event_type": log.event_type,
            "actor": log.actor,
            "action": log.action,
            "details": log.details_json,
            "created_at": log.created_at.isoformat()
        }
        for log in logs
    ]
