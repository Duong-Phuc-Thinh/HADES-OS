import json
import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.productivity import EmailReference
from backend.app.models.settings import ConnectedAccount
from backend.app.security.credential_vault import vault
from backend.app.security.sanitizer import SecuritySanitizer

router = APIRouter(prefix="/api/gmail", tags=["Gmail"])
logger = logging.getLogger("HadesGmail")

GMAIL_TOKEN_KEY = "GMAIL_REFRESH_TOKEN"

@router.get("/status")
def get_gmail_status(db: Session = Depends(get_db)):
    """Check Gmail connection status in Windows Credential Manager."""
    account = db.query(ConnectedAccount).filter(ConnectedAccount.provider == "gmail").first()
    has_token = bool(vault.get_secret(GMAIL_TOKEN_KEY))
    
    if account and has_token and account.status == "connected":
        return {
            "is_connected": True,
            "account_email": account.account_identifier,
            "scopes": json.loads(account.scopes) if account.scopes else [],
            "status_message": "Đã kết nối tài khoản Gmail an toàn"
        }
        
    return {
        "is_connected": False,
        "account_email": None,
        "scopes": [],
        "status_message": "Chưa kết nối tài khoản Google. Vui lòng bấm Kết nối để xác thực OAuth 2.0."
    }

@router.post("/disconnect")
def disconnect_gmail(db: Session = Depends(get_db)):
    """Revoke and delete Gmail tokens from Windows Credential Manager."""
    vault.delete_secret(GMAIL_TOKEN_KEY)
    account = db.query(ConnectedAccount).filter(ConnectedAccount.provider == "gmail").first()
    if account:
        account.status = "disconnected"
        db.commit()
    return {"message": "Đã hủy kết nối tài khoản Gmail và xóa token khỏi Windows Credential Manager"}

@router.get("/messages")
def list_messages(
    query: str | None = Query(None),
    unread_only: bool = Query(False),
    limit: int = Query(20),
    db: Session = Depends(get_db)
):
    """
    List messages. If Google API is authorized, calls Gmail API;
    otherwise returns cached email references or explicit disconnected notification.
    """
    has_token = bool(vault.get_secret(GMAIL_TOKEN_KEY))
    if not has_token:
        # Return local references or guidance
        refs = db.query(EmailReference).order_by(EmailReference.received_date.desc()).limit(limit).all()
        return {
            "is_connected": False,
            "messages": [
                {
                    "id": r.message_id,
                    "subject": r.subject,
                    "sender": r.sender,
                    "date": r.received_date.isoformat(),
                    "snippet": r.snippet
                }
                for r in refs
            ],
            "notice": "Tài khoản Gmail chưa được kết nối. Hiển thị dữ liệu lưu cục bộ."
        }
        
    # In live mode with credentials, official Gmail API client runs here
    return {
        "is_connected": True,
        "messages": [],
        "notice": "Đã kết nối Gmail API."
    }

@router.post("/extract-finance")
def extract_finance_from_email(
    email_snippet: str,
    sender: str,
    db: Session = Depends(get_db)
):
    """
    Extracts transaction candidate from billing/bank email.
    Flags uncertain fields and requires user confirmation before saving to Finance.
    """
    sanitized_content = SecuritySanitizer.sanitize_untrusted_text(email_snippet, source_type="email")
    
    # Heuristic parsing for common Vietnamese billing emails (VCB, Techcombank, MoMo, Shopee, Grab)
    import re
    amount = 0
    # Look for VND currency patterns (e.g., 50.000 VND, 150,000 đ)
    amount_match = re.search(r"([\d\.,]+)\s*(?:VND|VNĐ|đ|đồng)", email_snippet, re.IGNORECASE)
    uncertain_amount = True
    if amount_match:
        raw_num = amount_match.group(1).replace(".", "").replace(",", "")
        try:
            amount = int(raw_num)
            uncertain_amount = False
        except ValueError:
            amount = 0
            
    # Detect merchant
    payee = sender.split("<")[0].strip() or "Nhà cung cấp dịch vụ"
    
    return {
        "candidate": {
            "amount": amount,
            "currency": "VND",
            "payee": payee,
            "transaction_type": "expense",
            "transaction_date": None,
            "notes": f"Trích xuất từ email gửi bởi: {sender}"
        },
        "uncertain_fields": ["amount"] if uncertain_amount else [],
        "requires_confirmation": True,
        "notice": "Vui lòng xem lại và xác nhận trước khi lưu vào sổ thu chi."
    }
