from backend.app.orchestrator.engine import HadesOrchestrator


def test_intent_classification_comprehensive():
    """Verify precise intent classification for all requested scenarios."""
    assert HadesOrchestrator.classify_intent("HADES, kiểm tra dự án GreenPhone đang ở nhánh nào.") == "CODING"
    assert HadesOrchestrator.classify_intent("HADES, tháng này tôi đã tiêu bao nhiêu tiền?") == "FINANCE"
    assert HadesOrchestrator.classify_intent("HADES, có email nào quan trọng không?") == "GMAIL"
    assert HadesOrchestrator.classify_intent("HADES, CPU máy tính đang sử dụng bao nhiêu?") == "SYSTEM"
    assert HadesOrchestrator.classify_intent("Hôm nay có những task nào cần làm?") == "PRODUCTIVITY"
    assert HadesOrchestrator.classify_intent("Xin chào HADES, bạn có thể làm được gì?") == "GENERAL"

def test_coding_agent_routing_with_registered_project(client, auth_headers):
    """CodingAgent should inspect registered project and return current branch."""
    # 1. Register GreenPhone test project if not exists
    res_reg = client.post(
        "/api/coding/projects",
        json={
            "name": "GreenPhone",
            "path": ".",  # root workspace which has .git
            "project_type": "spring_boot"
        },
        headers=auth_headers
    )
    assert res_reg.status_code in (200, 409)

    # 2. Query Orchestrator
    res_chat = client.post(
        "/api/chat/message",
        json={"content": "HADES, kiểm tra dự án GreenPhone đang ở nhánh nào."},
        headers=auth_headers
    )
    assert res_chat.status_code == 200
    data = res_chat.json()
    assert data["agent_name"] == "CodingAgent"
    assert "GreenPhone" in data["reply"]
    # Check that tool was called
    tool_names = [t["tool"] for t in data["tool_invocations"]]
    assert "get_project_git_status" in tool_names

def test_finance_agent_spending_routing(client, auth_headers):
    """FinanceAgent should call finance summary and report spending accurately."""
    res_chat = client.post(
        "/api/chat/message",
        json={"content": "HADES, tháng này tôi đã tiêu bao nhiêu tiền?"},
        headers=auth_headers
    )
    assert res_chat.status_code == 200
    data = res_chat.json()
    assert data["agent_name"] == "FinanceAgent"
    tool_names = [t["tool"] for t in data["tool_invocations"]]
    assert "get_finance_summary" in tool_names
    assert "VND" in data["reply"] or "chi tiêu" in data["reply"].lower()

def test_gmail_agent_truthful_disconnected_response(client, auth_headers):
    """When Gmail is not connected, GmailAgent must truthfully report disconnected state without inventing emails."""
    res_chat = client.post(
        "/api/chat/message",
        json={"content": "HADES, có email nào quan trọng không?"},
        headers=auth_headers
    )
    assert res_chat.status_code == 200
    data = res_chat.json()
    assert data["agent_name"] == "GmailAgent"
    # Must NOT invent fake email contents
    assert "Chưa kết nối" in data["reply"] or "OAuth 2.0" in data["reply"]
