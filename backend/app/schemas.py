from datetime import date, datetime
from typing import Any

from pydantic import BaseModel


# --- SYSTEM & HEALTH SCHEMAS ---
class HealthResponse(BaseModel):
    status: str = "ok"
    app_name: str
    version: str
    timestamp: datetime
    uptime_seconds: float
    data_dir: str

class HardwareMetric(BaseModel):
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    memory_total_mb: float
    disk_percent: float
    disk_free_gb: float
    gpu_name: str | None = None
    gpu_percent: float | None = None
    network_sent_kb: float
    network_recv_kb: float
    os_name: str
    os_version: str

# --- CHAT & AGENT SCHEMAS ---
class ChatMessagePayload(BaseModel):
    role: str = "user"
    content: str
    conversation_id: str | None = None

class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    reply: str
    agent_name: str = "HadesOrchestrator"
    tool_invocations: list[dict[str, Any]] = []

class ToolApprovalDecision(BaseModel):
    approval_request_id: str | None = None
    approved: bool
    rejection_reason: str | None = None

# --- FINANCE SCHEMAS ---
class FinanceCategoryCreate(BaseModel):
    name: str
    category_type: str = "expense"
    icon: str = "Tag"
    color: str = "#00f0ff"
    parent_id: str | None = None

class FinanceAccountCreate(BaseModel):
    name: str
    account_type: str = "bank"
    currency: str = "VND"
    initial_balance: int = 0

class FinanceTransactionCreate(BaseModel):
    account_id: str
    category_id: str
    amount: int  # in VND minor units
    currency: str = "VND"
    transaction_type: str = "expense"
    transaction_date: date
    payee: str
    notes: str | None = None
    source_email_id: str | None = None

class BudgetCreate(BaseModel):
    category_id: str
    amount: int
    month: int
    year: int
    alert_threshold_percentage: int = 80

# --- CODING SCHEMAS ---
class ProjectRegister(BaseModel):
    name: str
    path: str
    project_type: str = "spring_boot"
    description: str | None = None

class GitStatusResponse(BaseModel):
    current_branch: str
    is_clean: bool
    staged_files: list[str]
    unstaged_files: list[str]
    untracked_files: list[str]
    ahead: int = 0
    behind: int = 0

class CodeReviewRequest(BaseModel):
    project_id: str
    relative_file_path: str | None = None
    custom_instructions: str | None = None

# --- PRODUCTIVITY SCHEMAS ---
class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    priority: str = "MEDIUM"
    due_date: datetime | None = None
    project_id: str | None = None

class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    due_date: datetime | None = None

# --- SETTINGS SCHEMAS ---
class GeminiSettingsUpdate(BaseModel):
    api_key: str | None = None
    model_name: str | None = "gemini-2.5-flash"
    temperature: float | None = 0.7

class GeminiSettingsResponse(BaseModel):
    is_configured: bool
    model_name: str
    temperature: float
