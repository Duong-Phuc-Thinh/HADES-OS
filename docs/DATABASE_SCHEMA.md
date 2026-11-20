# HADES OS — DATABASE SCHEMA SPECIFICATION

Lược đồ cơ sở dữ liệu được xây dựng trên SQLite (WAL Mode enabled) thông qua SQLAlchemy ORM và Alembic Migrations.

## 1. HỆ THỐNG BẢNG DỮ LIỆU CHÍNH (20 BẢNG CHUẨN HÓA)

### 1.1. Cấu hình & Bảo mật (Configuration & Security)
- **`app_settings`**
  - `key` (VARCHAR, PK)
  - `value` (TEXT)
  - `category` (VARCHAR): `general`, `gemini`, `ui`, `voice`, `security`
  - `updated_at` (DATETIME)

- **`connected_accounts`**
  - `id` (VARCHAR, PK, UUID)
  - `provider` (VARCHAR): `gmail`, `github`
  - `account_identifier` (VARCHAR)
  - `status` (VARCHAR): `connected`, `disconnected`, `expired`
  - `scopes` (TEXT): JSON array of granted scopes
  - `credential_key` (VARCHAR): Key reference in Windows Credential Manager (KHÔNG lưu token trực tiếp)
  - `created_at` (DATETIME), `updated_at` (DATETIME)

- **`permission_grants`**
  - `id` (VARCHAR, PK, UUID)
  - `permission_name` (VARCHAR): `READ_LOCAL`, `READ_GMAIL`, `WRITE_GMAIL_DRAFT`, `SEND_GMAIL`, etc.
  - `resource_pattern` (VARCHAR): wildcard or exact path/scope
  - `is_active` (BOOLEAN)
  - `granted_at` (DATETIME), `expires_at` (DATETIME, Nullable)

- **`approval_requests`**
  - `id` (VARCHAR, PK, UUID)
  - `tool_invocation_id` (VARCHAR, FK -> tool_invocations.id)
  - `description` (TEXT)
  - `risk_level` (VARCHAR): `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
  - `status` (VARCHAR): `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`
  - `requested_at` (DATETIME), `responded_at` (DATETIME, Nullable)

- **`audit_logs`**
  - `id` (INTEGER, PK, Autoincrement)
  - `event_type` (VARCHAR): `SECURITY`, `TOOL_EXECUTION`, `AUTH`, `SYSTEM`
  - `actor` (VARCHAR): `USER`, `ORCHESTRATOR`, `GMAIL_AGENT`, etc.
  - `action` (VARCHAR)
  - `details_json` (TEXT)
  - `created_at` (DATETIME)

### 1.2. Hội thoại & Tác nhân AI (Conversations & Agents)
- **`conversations`**
  - `id` (VARCHAR, PK, UUID)
  - `title` (VARCHAR)
  - `created_at` (DATETIME), `updated_at` (DATETIME)
  - `is_archived` (BOOLEAN, default False)

- **`conversation_messages`**
  - `id` (VARCHAR, PK, UUID)
  - `conversation_id` (VARCHAR, FK -> conversations.id, Index)
  - `sender_role` (VARCHAR): `user`, `assistant`, `system`, `tool`
  - `content` (TEXT)
  - `agent_name` (VARCHAR, Nullable)
  - `token_count` (INTEGER, default 0)
  - `created_at` (DATETIME)

- **`agent_runs`**
  - `id` (VARCHAR, PK, UUID)
  - `agent_name` (VARCHAR): `Orchestrator`, `GmailAgent`, `FinanceAgent`, `CodingAgent`, etc.
  - `intent` (VARCHAR)
  - `status` (VARCHAR): `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`
  - `started_at` (DATETIME), `completed_at` (DATETIME, Nullable)
  - `error_message` (TEXT, Nullable)

- **`tool_invocations`**
  - `id` (VARCHAR, PK, UUID)
  - `agent_run_id` (VARCHAR, FK -> agent_runs.id, Index)
  - `tool_name` (VARCHAR)
  - `arguments_json` (TEXT)
  - `result_json` (TEXT, Nullable)
  - `status` (VARCHAR): `PENDING_APPROVAL`, `RUNNING`, `SUCCESS`, `ERROR`, `DENIED`
  - `requires_approval` (BOOLEAN, default False)
  - `is_approved` (BOOLEAN, default False)
  - `duration_ms` (INTEGER, default 0)
  - `created_at` (DATETIME)

### 1.3. Quản lý Tài chính (Finance Module)
- **`finance_accounts`**
  - `id` (VARCHAR, PK, UUID)
  - `name` (VARCHAR): e.g. `Ví tiền mặt`, `Tài khoản VCB`, `Thẻ tín dụng`
  - `account_type` (VARCHAR): `cash`, `bank`, `credit`, `e-wallet`
  - `currency` (VARCHAR, default 'VND')
  - `initial_balance` (INTEGER): minor units (cents / đồng)
  - `current_balance` (INTEGER)
  - `is_active` (BOOLEAN, default True)

- **`finance_categories`**
  - `id` (VARCHAR, PK, UUID)
  - `name` (VARCHAR): e.g. `Ăn uống`, `Tiền nhà`, `Học tập`, `Lương`
  - `category_type` (VARCHAR): `income`, `expense`
  - `icon` (VARCHAR)
  - `color` (VARCHAR)
  - `parent_id` (VARCHAR, FK -> finance_categories.id, Nullable)

- **`finance_transactions`**
  - `id` (VARCHAR, PK, UUID)
  - `account_id` (VARCHAR, FK -> finance_accounts.id, Index)
  - `category_id` (VARCHAR, FK -> finance_categories.id, Index)
  - `amount` (INTEGER): minor units (đồng VND)
  - `currency` (VARCHAR, default 'VND')
  - `transaction_type` (VARCHAR): `income`, `expense`, `transfer`
  - `transaction_date` (DATE, Index)
  - `payee` (VARCHAR)
  - `notes` (TEXT, Nullable)
  - `source_email_id` (VARCHAR, Nullable, Index)
  - `fingerprint` (VARCHAR, Index): MD5/SHA256 for duplicate detection
  - `created_at` (DATETIME)

- **`finance_budgets`**
  - `id` (VARCHAR, PK, UUID)
  - `category_id` (VARCHAR, FK -> finance_categories.id)
  - `amount` (INTEGER): minor units (đồng)
  - `currency` (VARCHAR, default 'VND')
  - `month` (INTEGER)
  - `year` (INTEGER)
  - `alert_threshold_percentage` (INTEGER, default 80)

- **`imported_transaction_sources`**
  - `id` (VARCHAR, PK, UUID)
  - `file_name` (VARCHAR)
  - `file_hash` (VARCHAR, Index)
  - `import_date` (DATETIME)
  - `records_count` (INTEGER)

### 1.4. Lập trình & Dự án (Coding & Repositories)
- **`projects`**
  - `id` (VARCHAR, PK, UUID)
  - `name` (VARCHAR): e.g. `GreenPhone`, `CertMaster`, `EDTOEIC Assistant`
  - `project_type` (VARCHAR): `spring_boot`, `react_typescript`, `python_extension`, `other`
  - `description` (TEXT)
  - `created_at` (DATETIME)

- **`repositories`**
  - `id` (VARCHAR, PK, UUID)
  - `project_id` (VARCHAR, FK -> projects.id)
  - `local_path` (VARCHAR, Unique): Canonical absolute path on Windows
  - `default_branch` (VARCHAR, default 'main')
  - `remote_url` (VARCHAR, Nullable)
  - `is_allowlisted` (BOOLEAN, default True)
  - `last_inspected_at` (DATETIME, Nullable)

### 1.5. Năng suất & Thông báo (Productivity & Tasks)
- **`tasks`**
  - `id` (VARCHAR, PK, UUID)
  - `title` (VARCHAR)
  - `description` (TEXT, Nullable)
  - `status` (VARCHAR): `TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`
  - `priority` (VARCHAR): `LOW`, `MEDIUM`, `HIGH`, `URGENT`
  - `due_date` (DATETIME, Nullable, Index)
  - `project_id` (VARCHAR, FK -> projects.id, Nullable)
  - `created_at` (DATETIME), `updated_at` (DATETIME)

- **`notifications`**
  - `id` (VARCHAR, PK, UUID)
  - `title` (VARCHAR)
  - `message` (TEXT)
  - `category` (VARCHAR): `SYSTEM`, `FINANCE`, `TASK`, `GMAIL`, `SECURITY`
  - `priority` (VARCHAR): `INFO`, `WARNING`, `CRITICAL`
  - `is_read` (BOOLEAN, default False)
  - `created_at` (DATETIME)

- **`email_references`**
  - `id` (VARCHAR, PK, UUID)
  - `message_id` (VARCHAR, Unique, Index)
  - `thread_id` (VARCHAR)
  - `subject` (VARCHAR)
  - `sender` (VARCHAR)
  - `received_date` (DATETIME, Index)
  - `snippet` (TEXT)
  - `is_analyzed` (BOOLEAN, default False)

- **`sync_checkpoints`**
  - `id` (VARCHAR, PK, UUID)
  - `service_name` (VARCHAR, Unique): `gmail_sync`, `system_metrics`, etc.
  - `last_sync_timestamp` (DATETIME)
  - `cursor_token` (VARCHAR, Nullable)
