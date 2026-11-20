import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from backend.app.database import Base


def utc_now():
    return datetime.now(UTC)

def generate_uuid():
    return str(uuid.uuid4())

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    project_type = Column(String(50), default="spring_boot")  # 'spring_boot', 'react_typescript', 'python_extension', 'other'
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    repositories = relationship("Repository", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project")

class Repository(Base):
    __tablename__ = "repositories"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    local_path = Column(String(500), unique=True, nullable=False)  # Canonical absolute path on Windows
    default_branch = Column(String(100), default="main")
    remote_url = Column(String(500), nullable=True)
    is_allowlisted = Column(Boolean, default=True)
    last_inspected_at = Column(DateTime, nullable=True)
    
    project = relationship("Project", back_populates="repositories")
