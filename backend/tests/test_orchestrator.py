from backend.app.orchestrator.engine import HadesOrchestrator


def test_intent_classification():
    """Verify natural language intent routing to specialized agents."""
    assert HadesOrchestrator.classify_intent("Hôm nay tôi đã chi tiêu hết bao nhiêu tiền?") == "FINANCE"
    assert HadesOrchestrator.classify_intent("Kiểm tra git status của dự án") == "CODING"
    assert HadesOrchestrator.classify_intent("Có email mới nào từ sếp không?") == "GMAIL"
    assert HadesOrchestrator.classify_intent("Tạo cho tôi một task làm báo cáo tuần") == "PRODUCTIVITY"
    assert HadesOrchestrator.classify_intent("Kiểm tra phần cứng CPU và RAM") == "SYSTEM"
    assert HadesOrchestrator.classify_intent("Xin chào bạn là ai?") == "GENERAL"

def test_offline_fallback_system_stats(client, auth_headers):
    """Orchestrator must handle system query in offline mode with actual hardware metrics."""
    res = client.post(
        "/api/chat/message",
        json={"content": "Kiểm tra CPU và RAM hệ thống"},
        headers=auth_headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["agent_name"] == "SystemAgent"
    assert "Thông số Hệ thống Windows Thực tế" in data["reply"]
    assert len(data["tool_invocations"]) > 0
