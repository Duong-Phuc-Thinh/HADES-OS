import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from backend.app.database import Base


def utc_now():
    return datetime.now(UTC)

def generate_uuid():
    return str(uuid.uuid4())

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(30), default="TODO")  # 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'
    priority = Column(String(20), default="MEDIUM")  # 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
    due_date = Column(DateTime, nullable=True, index=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    
    project = relationship("Project", back_populates="tasks")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="SYSTEM")  # 'SYSTEM', 'FINANCE', 'TASK', 'GMAIL', 'SECURITY'
    priority = Column(String(20), default="INFO")  # 'INFO', 'WARNING', 'CRITICAL'
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

class EmailReference(Base):
    __tablename__ = "email_references"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    message_id = Column(String(100), unique=True, index=True, nullable=False)
    thread_id = Column(String(100), nullable=True)
    subject = Column(String(500), nullable=False)
    sender = Column(String(255), nullable=False)
    received_date = Column(DateTime, index=True, nullable=False)
    snippet = Column(Text, nullable=True)
    is_analyzed = Column(Boolean, default=False)

class SyncCheckpoint(Base):
    __tablename__ = "sync_checkpoints"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    service_name = Column(String(50), unique=True, nullable=False)
    last_sync_timestamp = Column(DateTime, default=utc_now)
    cursor_token = Column(String(255), nullable=True)
