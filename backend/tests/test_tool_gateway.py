from backend.app.models.agent import AgentRun, ApprovalRequest
from backend.app.tools.gateway import ToolGateway


def test_tool_gateway_argument_validation(client, auth_headers):
    """Calling registered tool with valid arguments returns SUCCESS."""
    from backend.app.database import SessionLocal
    db = SessionLocal()
    try:
        run = AgentRun(agent_name="SystemAgent", intent="SYSTEM")
        db.add(run)
        db.commit()
        db.refresh(run)

        status, res = ToolGateway.execute_tool(
            db=db,
            agent_run_id=run.id,
            tool_name="get_system_stats",
            arguments={}
        )
        assert status == "SUCCESS"
        assert "cpu_percent" in res
    finally:
        db.close()

def test_tool_gateway_unknown_tool():
    """Calling an unregistered tool returns ERROR status."""
    from backend.app.database import SessionLocal
    db = SessionLocal()
    try:
        status, res = ToolGateway.execute_tool(
            db=db,
            agent_run_id="non-existent",
            tool_name="malicious_unregistered_tool",
            arguments={}
        )
        assert status == "ERROR"
        assert "không tồn tại" in res
    finally:
        db.close()

def test_tool_gateway_sensitive_requires_approval(client, auth_headers):
    """Sensitive tools (e.g. sending email) must require Approval Gate if not pre-approved."""
    from backend.app.database import SessionLocal
    db = SessionLocal()
    try:
        run = AgentRun(agent_name="GmailAgent", intent="GMAIL")
        db.add(run)
        db.commit()
        db.refresh(run)

        status, res = ToolGateway.execute_tool(
            db=db,
            agent_run_id=run.id,
            tool_name="send_gmail_message",
            arguments={"to": "recipient@example.com", "subject": "Test", "body": "Hello"}
        )
        assert status == "WAITING_APPROVAL"
        assert "approval_id" in res
        approval_id = res["approval_id"]

        # Check ApprovalRequest record in database
        req = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()
        assert req is not None
        assert req.status == "PENDING"
        assert req.risk_level in ("HIGH", "CRITICAL")
    finally:
        db.close()

def test_tool_approval_decision_endpoint(client, auth_headers):
    """User can approve or reject pending approvals via /api/agents/approvals/{id}/decide."""
    # 1. Trigger a tool needing approval
    from backend.app.database import SessionLocal
    db = SessionLocal()
    run = AgentRun(agent_name="GmailAgent", intent="GMAIL")
    db.add(run)
    db.commit()
    db.refresh(run)

    status, res = ToolGateway.execute_tool(
        db=db,
        agent_run_id=run.id,
        tool_name="send_gmail_message",
        arguments={"to": "boss@company.com", "subject": "Report", "body": "Weekly status"}
    )
    approval_id = res["approval_id"]
    db.close()

    # 2. Check pending list
    res_list = client.get("/api/agents/approvals/pending", headers=auth_headers)
    assert res_list.status_code == 200
    pending = res_list.json()
    assert any(p["id"] == approval_id for p in pending)

    # 3. Reject first
    res_decide = client.post(
        f"/api/agents/approvals/{approval_id}/decide",
        json={"approved": False, "rejection_reason": "Nội dung chưa chuẩn"},
        headers=auth_headers
    )
    assert res_decide.status_code == 200
    assert res_decide.json()["status"] == "REJECTED"
