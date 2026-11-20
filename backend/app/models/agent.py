import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from backend.app.database import Base


def utc_now():
    return datetime.now(UTC)

def generate_uuid():
    return str(uuid.uuid4())

class AgentRun(Base):
    __tablename__ = "agent_runs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_name = Column(String(50), nullable=False)  # 'Orchestrator', 'GmailAgent', 'FinanceAgent', etc.
    intent = Column(String(100), nullable=True)
    status = Column(String(30), default="RUNNING")  # 'RUNNING', 'COMPLETED', 'FAILED', 'WAITING_APPROVAL'
    started_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    
    tools = relationship("ToolInvocation", back_populates="agent_run", cascade="all, delete-orphan")

class ToolInvocation(Base):
    __tablename__ = "tool_invocations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_run_id = Column(String(36), ForeignKey("agent_runs.id", ondelete="CASCADE"), index=True, nullable=False)
    tool_name = Column(String(100), nullable=False)
    arguments_json = Column(Text, nullable=False)
    result_json = Column(Text, nullable=True)
    status = Column(String(30), default="PENDING_APPROVAL")  # 'PENDING_APPROVAL', 'RUNNING', 'SUCCESS', 'ERROR', 'DENIED'
    requires_approval = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=False)
    duration_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)
    
    agent_run = relationship("AgentRun", back_populates="tools")
    approval_request = relationship("ApprovalRequest", back_populates="tool_invocation", uselist=False, cascade="all, delete-orphan")

class PermissionGrant(Base):
    __tablename__ = "permission_grants"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    permission_name = Column(String(50), nullable=False)  # 'READ_LOCAL', 'READ_GMAIL', 'WRITE_FINANCE', etc.
    scope = Column(String(100), default="global")
    resource_pattern = Column(String(255), default="*")
    is_active = Column(Boolean, default=True)
    granted_at = Column(DateTime, default=utc_now)
    expires_at = Column(DateTime, nullable=True)

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    tool_invocation_id = Column(String(36), ForeignKey("tool_invocations.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=False)
    risk_level = Column(String(20), default="MEDIUM")  # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    status = Column(String(20), default="PENDING")  # 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'
    requested_at = Column(DateTime, default=utc_now)
    responded_at = Column(DateTime, nullable=True)
    
    tool_invocation = relationship("ToolInvocation", back_populates="approval_request")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String(50), nullable=False)  # 'SECURITY', 'TOOL_EXECUTION', 'AUTH', 'SYSTEM'
    actor = Column(String(50), default="ORCHESTRATOR")
    action = Column(String(100), nullable=False)
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
