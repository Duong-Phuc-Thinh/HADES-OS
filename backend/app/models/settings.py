import uuid
from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, String, Text

from backend.app.database import Base


def utc_now():
    return datetime.now(UTC)

def generate_uuid():
    return str(uuid.uuid4())

class AppSetting(Base):
    __tablename__ = "app_settings"
    
    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    category = Column(String(50), default="general")
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

class ConnectedAccount(Base):
    __tablename__ = "connected_accounts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider = Column(String(50), nullable=False)  # 'gmail', 'github'
    account_identifier = Column(String(255), nullable=False)
    status = Column(String(50), default="connected")  # 'connected', 'disconnected', 'expired'
    scopes = Column(Text, nullable=True)  # JSON string
    credential_key = Column(String(255), nullable=False)  # Reference in OS Keyring
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
