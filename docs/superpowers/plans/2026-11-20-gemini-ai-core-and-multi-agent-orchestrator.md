# HADES OS — Phase 2: Gemini AI Core & Multi-Agent Orchestrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform HADES OS from a desktop interface into a genuinely functional, Gemini-powered, multi-agent AI assistant with real-time streaming, strict tool gateway, capability-based permission enforcement, event-driven 3D robot synchronization, and robust error handling.

**Architecture:** Client-Server Local-First Architecture. Electron frontend connects to local FastAPI backend via Session Capability Bearer token. Central `HadesOrchestrator` receives queries, identifies intent, routes to specialized agents (`SystemAgent`, `FinanceAgent`, `CodingAgent`, `GmailAgent`, `ProductivityAgent`, `HadesCore`), enforces deny-by-default permissions via `ToolGateway`, streams tokens via SSE, and emits real-time events to drive the 3D robot HUD.

**Tech Stack:** 
- Backend: Python 3.14, FastAPI, `google-genai` SDK, Pydantic v2, SQLAlchemy, SQLite WAL, Keyring (Windows DPAPI), Pytest, Ruff.
- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Three.js, React Three Fiber, Zustand, Lucide React, Vitest.

**Spec:** Phase 2 specification from user prompt.

## Global Constraints
- SDK: Official `google-genai` SDK (`from google import genai`).
- Security: API Keys stored strictly in Windows Credential Manager (`keyring` / DPAPI), never plaintext in SQLite, source code, or frontend localStorage.
- Safety: Deny-by-default execution. No LLM raw string execution in `shell=True`. No automatic commit/push/merge/PR or auto-sending email.
- Truthfulness: No fabricated data or fake mock connections. When credentials are missing or services are disconnected, explicitly show Disconnected state with setup instructions.
- Localization: All user-facing explanations, tool summaries, error messages, and commit suggestions in Vietnamese.

## Review Focus
1. Gemini API key missing or invalid -> System must return explicit disconnected state with Vietnamese setup instructions, not crash or fake AI responses.
2. Rate limits (`429 ResourceExhausted` / Quota Exceeded) -> System must catch exception, report clear Vietnamese error, and not crash backend.
3. Stream cancellation -> Client aborting connection must cleanly terminate server streaming and close session.
4. Tool Permission denial -> Unapproved sensitive tools must enter `WAITING_APPROVAL` status and never execute without explicit user approval.
5. Path Traversal & Shell Injection -> All paths must resolve within allowlisted roots; shell metacharacters must be rejected.

---

### Task 1: Gemini Service Client & Error Handling Engine
**Files:**
- Create: `backend/app/services/gemini_service.py`
- Modify: `backend/app/config.py`
- Modify: `backend/app/api/settings.py`
- Test: `backend/tests/test_gemini_service.py`

- [ ] Write failing tests for `GeminiService`:
  - `test_gemini_service_missing_key_status`
  - `test_gemini_service_invalid_key_handling`
  - `test_gemini_service_model_listing`
  - `test_gemini_service_stream_generation_with_mock`
  - `test_gemini_service_rate_limit_error_handling`
- [ ] Implement `GeminiService` in `backend/app/services/gemini_service.py`:
  - `get_client()`: pulls key from `vault.get_secret("GEMINI_API_KEY")`
  - `test_connection(api_key)`: validates key against Gemini API
  - `generate_stream(...)`: async generator yielding chunks with timeout and error mapping
  - Custom exceptions with friendly Vietnamese error messages (`GeminiKeyMissingError`, `GeminiQuotaExceededError`, `GeminiAuthError`)
- [ ] Update `backend/app/api/settings.py` with `/api/settings/gemini/test` endpoint
- [ ] Run pytest on `test_gemini_service.py` and confirm all pass.

---

### Task 2: Advanced Intent Classifier & Agent Router
**Files:**
- Modify: `backend/app/orchestrator/engine.py`
- Modify: `backend/app/schemas.py`
- Test: `backend/tests/test_orchestrator_routing.py`

- [ ] Write failing tests for intent routing and context assembling:
  - `test_routing_coding_agent_greenphone`
  - `test_routing_finance_agent_spending`
  - `test_routing_system_agent_cpu`
  - `test_routing_gmail_agent_email`
  - `test_routing_productivity_agent_task`
  - `test_disconnected_agent_truthful_response`
- [ ] Implement multi-agent routing in `backend/app/orchestrator/engine.py`:
  - Intent analyzer with specialized keyword and context heuristics
  - Context assembly: retrieves authorized context (e.g., project branch for CodingAgent, summary for FinanceAgent, hardware metrics for SystemAgent)
  - Explicit disconnected messaging for unconfigured integrations (Gmail without token, external banks)
- [ ] Run pytest on `test_orchestrator_routing.py` and confirm all pass.

---

### Task 3: Secure Tool Gateway & Approval Pipeline
**Files:**
- Modify: `backend/app/tools/gateway.py`
- Modify: `backend/app/tools/definitions.py`
- Create: `backend/app/api/agents.py`
- Test: `backend/tests/test_tool_gateway.py`

- [ ] Write failing tests for tool execution & approvals:
  - `test_tool_gateway_argument_validation`
  - `test_tool_gateway_permission_denial`
  - `test_tool_gateway_sensitive_requires_approval`
  - `test_tool_gateway_user_approval_flow`
  - `test_tool_gateway_audit_logging`
- [ ] Enhance `ToolGateway` in `backend/app/tools/gateway.py`:
  - Strict argument schema validation
  - Deny-by-default check for permissions
  - Create ApprovalRequest for sensitive actions (`SEND_GMAIL`, `EDIT_REPOSITORY`, `EXECUTE_COMMAND`)
  - Endpoint `POST /api/agents/approve` to approve or reject pending tool calls
- [ ] Add Coding tools: `get_project_git_info`, `run_project_diagnostics` (Read-only, strictly allowlisted)
- [ ] Run pytest on `test_tool_gateway.py` and confirm all pass.

---

### Task 4: Server-Sent Events (SSE) Real-Time Chat Stream & Cancellation
**Files:**
- Modify: `backend/app/api/chat.py`
- Modify: `backend/app/orchestrator/engine.py`
- Test: `backend/tests/test_chat_stream.py`

- [ ] Write failing tests for SSE endpoint:
  - `test_chat_stream_events_structure` (start, agent, tool, token, done)
  - `test_chat_stream_with_mocked_gemini`
  - `test_chat_stream_offline_fallback`
  - `test_chat_stream_cancellation_cleanup`
- [ ] Implement enhanced streaming endpoint in `backend/app/api/chat.py`:
  - Sends typed SSE events:
    - `event: metadata` (agent_name, intent, conversation_id)
    - `event: tool_start` (tool_name)
    - `event: tool_result` (status, result_summary)
    - `event: token` (content_chunk)
    - `event: done` (full_message_id)
    - `event: error` (error_message)
  - Detects client disconnect and aborts active generation
- [ ] Run pytest on `test_chat_stream.py` and confirm all pass.

---

### Task 5: Frontend Chat Store, Stream Consumer & Robot State Sync
**Files:**
- Modify: `src/store/useChatStore.ts`
- Modify: `src/store/useAgentStore.ts`
- Modify: `src/api/client.ts`
- Modify: `src/components/hud/CommandBar.tsx`
- Modify: `src/pages/Home.tsx`
- Test: `src/tests/chatStream.test.tsx`

- [ ] Write unit test for `useChatStore` stream consumption and robot state transitions:
  - Initial state -> `THINKING`
  - Tool execution -> `PROCESSING`
  - Token streaming -> `SPEAKING`
  - Completion -> `SUCCESS` -> `IDLE`
  - Error -> `ERROR` -> `IDLE`
- [ ] Update `src/api/client.ts` with `streamChatMessage(content, convId, callbacks, abortSignal)`
- [ ] Update `src/store/useChatStore.ts`:
  - Real-time token appending to active message
  - Stop button abort controller
  - Event-driven sync with `useAgentStore.setRobotState`
- [ ] Update `src/components/hud/CommandBar.tsx`:
  - Stop generation button (red neon square) while streaming
  - Shift+Enter for new line support
  - Active agent indicator badge
- [ ] Update `src/pages/Home.tsx`:
  - Rich markdown/code styling for chat messages
  - Tool execution visual cards inside chat stream
  - Display error messages cleanly in Vietnamese
- [ ] Run Vitest tests and confirm all pass.

---

### Task 6: Full Integration Verification & Quality Gates
**Files:**
- Run: Full backend Pytest suite
- Run: Ruff check
- Run: Vitest frontend suite
- Run: TypeScript build check
- Report: Final Phase 2 verification report in Vietnamese
