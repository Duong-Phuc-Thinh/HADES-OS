import json
import logging
from typing import Any

from sqlalchemy.orm import Session

from backend.app.models.agent import AgentRun
from backend.app.models.conversation import Conversation, ConversationMessage
from backend.app.models.settings import AppSetting
from backend.app.security.credential_vault import vault
from backend.app.tools.gateway import ToolGateway

logger = logging.getLogger("HadesOrchestrator")

GEMINI_KEY_NAME = "GEMINI_API_KEY"

class HadesOrchestrator:
    """
    Central Multi-Agent Orchestrator.
    Routes queries to specialized agents, plans tool executions, calls Gemini API or local fallback.
    """
    
    @classmethod
    def classify_intent(cls, prompt: str) -> str:
        prompt_lower = prompt.lower()
        if any(w in prompt_lower for w in ["greenphone", "certmaster", "edtoeic", "nhánh", "branch", "git", "commit", "diff", "code", "spring boot", "react", "repo", "dự án"]):
            return "CODING"
        if any(w in prompt_lower for w in ["tiêu bao nhiêu", "chi tiêu", "thu chi", "tiền", "ngân sách", "giao dịch", "ví", "lương"]):
            return "FINANCE"
        if any(w in prompt_lower for w in ["email", "thư", "hộp thư", "gmail", "soạn thư"]):
            return "GMAIL"
        if any(w in prompt_lower for w in ["task", "nhiệm vụ", "công việc", "nhắc nhở", "hạn chót", "lịch trình"]):
            return "PRODUCTIVITY"
        if any(w in prompt_lower for w in ["cpu", "ram", "phần cứng", "ổ cứng", "hệ thống", "windows"]):
            return "SYSTEM"
        return "GENERAL"

    @classmethod
    def get_agent_name_for_intent(cls, intent: str) -> str:
        mapping = {
            "FINANCE": "FinanceAgent",
            "CODING": "CodingAgent",
            "GMAIL": "GmailAgent",
            "PRODUCTIVITY": "ProductivityAgent",
            "SYSTEM": "SystemAgent",
            "GENERAL": "HadesCore"
        }
        return mapping.get(intent, "HadesOrchestrator")

    @classmethod
    def process_message(
        cls,
        db: Session,
        content: str,
        conversation_id: str | None = None
    ) -> dict[str, Any]:
        """
        Receives user prompt, saves message, invokes agent/tools, and returns structured response.
        """
        # 1. Ensure conversation exists
        if not conversation_id:
            conv = Conversation(title=content[:30] + ("..." if len(content) > 30 else ""))
            db.add(conv)
            db.commit()
            db.refresh(conv)
            conversation_id = conv.id
        else:
            conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
            if not conv:
                conv = Conversation(id=conversation_id, title=content[:30])
                db.add(conv)
                db.commit()

        # 2. Save user message
        user_msg = ConversationMessage(
            conversation_id=conversation_id,
            sender_role="user",
            content=content
        )
        db.add(user_msg)
        db.commit()

        # 3. Classify intent and assign Agent
        intent = cls.classify_intent(content)
        agent_name = cls.get_agent_name_for_intent(intent)

        # 4. Start Agent Run
        agent_run = AgentRun(
            agent_name=agent_name,
            intent=intent,
            status="RUNNING"
        )
        db.add(agent_run)
        db.commit()
        db.refresh(agent_run)

        # 5. Check if local tool can immediately answer query
        tool_results = []
        if intent == "SYSTEM":
            status, res = ToolGateway.execute_tool(db, agent_run.id, "get_system_stats", {})
            tool_results.append({"tool": "get_system_stats", "status": status, "result": res})
        elif intent == "PRODUCTIVITY":
            status, res = ToolGateway.execute_tool(db, agent_run.id, "list_tasks", {})
            tool_results.append({"tool": "list_tasks", "status": status, "result": res})
        elif intent == "CODING":
            proj_name = "GreenPhone"
            for candidate in ["GreenPhone", "CertMaster", "EDTOEIC"]:
                if candidate.lower() in content.lower():
                    proj_name = candidate
                    break
            status, res = ToolGateway.execute_tool(db, agent_run.id, "get_project_git_status", {"project_name": proj_name})
            tool_results.append({"tool": "get_project_git_status", "status": status, "result": res})
        elif intent == "FINANCE":
            from datetime import date
            today = date.today()
            status, res = ToolGateway.execute_tool(db, agent_run.id, "get_finance_summary", {"month": today.month, "year": today.year})
            tool_results.append({"tool": "get_finance_summary", "status": status, "result": res})
        elif intent == "GMAIL":
            has_token = bool(vault.get_secret("GMAIL_REFRESH_TOKEN"))
            tool_results.append({
                "tool": "check_gmail_status",
                "status": "SUCCESS",
                "result": {"is_connected": has_token}
            })

        # 6. Try Gemini AI generation with official SDK
        from backend.app.services.gemini_service import GeminiError, gemini_service
        model_setting = db.query(AppSetting).filter(AppSetting.key == "gemini_model").first()
        model_name = model_setting.value if model_setting else "gemini-2.5-flash"

        reply_text = ""
        if gemini_service.is_configured():
            try:
                system_instruction = (
                    "Bạn là HADES OS, trợ lý AI chỉ huy máy tính cá nhân tương lai cho Windows 10/11. "
                    "Hãy trả lời người dùng một cách chính xác, sắc bén, chuyên nghiệp bằng Tiếng Việt. "
                    f"Bạn đang đại diện cho Tác nhân chuyên môn: {agent_name}."
                )

                prompt_payload = f"Người dùng hỏi: {content}\n"
                if tool_results:
                    prompt_payload += f"Dữ liệu công cụ thu thập được:\n{json.dumps(tool_results, ensure_ascii=False)}"

                reply_text = gemini_service.generate_content(
                    prompt=prompt_payload,
                    model=model_name,
                    system_instruction=system_instruction
                )
                if not reply_text:
                    reply_text = "HADES OS đã xử lý xong yêu cầu của bạn."
            except GeminiError as e:
                logger.error(f"Gemini API invocation error: {e}")
                reply_text = cls._generate_offline_fallback(content, intent, agent_name, tool_results, error_str=str(e))
            except Exception as e:
                logger.error(f"Unexpected error in Gemini generation: {e}")
                reply_text = cls._generate_offline_fallback(content, intent, agent_name, tool_results, error_str=str(e))
        else:
            # Offline local fallback mode (No API Key required)
            reply_text = cls._generate_offline_fallback(content, intent, agent_name, tool_results)

        # 7. Complete Agent Run
        agent_run.status = "COMPLETED"
        db.commit()

        # 8. Save Assistant Message
        assistant_msg = ConversationMessage(
            conversation_id=conversation_id,
            sender_role="assistant",
            content=reply_text,
            agent_name=agent_name
        )
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)

        return {
            "conversation_id": conversation_id,
            "message_id": assistant_msg.id,
            "reply": reply_text,
            "agent_name": agent_name,
            "intent": intent,
            "tool_invocations": tool_results
        }

    @classmethod
    def _generate_offline_fallback(
        cls,
        prompt: str,
        intent: str,
        agent_name: str,
        tool_results: list[dict[str, Any]],
        error_str: str | None = None
    ) -> str:
        """
        Generates functional offline Vietnamese responses when Gemini API Key is missing or unreachable.
        Adheres strictly to rule #8 and #7: no fake data, functional local capabilities.
        """
        prefix = f"**[HADES OS • {agent_name}]**\n\n"
        if error_str:
            prefix += f"*(Thông báo: Đang hoạt động ở chế độ Ngoại tuyến do lỗi kết nối AI: {error_str})*\n\n"
        else:
            prefix += "*(Chế độ Cục bộ / Offline: Chưa cấu hình Gemini API Key tại Trung tâm Cài đặt)*\n\n"

        if intent == "SYSTEM":
            if tool_results and tool_results[0]["status"] == "SUCCESS":
                stats = tool_results[0]["result"]
                return (
                    f"{prefix}**Báo cáo Thông số Hệ thống Windows Thực tế:**\n"
                    f"- **CPU:** {stats.get('cpu_percent')}% hoạt động\n"
                    f"- **RAM:** {stats.get('memory_percent')}% (Đã dùng {stats.get('memory_used_mb')} MB / {stats.get('memory_total_mb')} MB)\n"
                    f"- **Ổ đĩa C:** Đã dùng {stats.get('disk_percent')}% (Còn trống {stats.get('disk_free_gb')} GB)\n"
                    f"- **Card đồ họa (GPU):** {stats.get('gpu_name') or 'Không hỗ trợ'}\n"
                    f"- **Hệ điều hành:** {stats.get('os_name')} (Phiên bản {stats.get('os_version')})"
                )
            return f"{prefix}Không thể truy xuất thông số hệ thống cục bộ."

        if intent == "FINANCE":
            for tr in tool_results:
                if tr["tool"] == "get_finance_summary" and tr["status"] == "SUCCESS":
                    summary = tr["result"]
                    total_expense = summary.get("total_expense", 0)
                    total_income = summary.get("total_income", 0)
                    net_savings = summary.get("net_savings", 0)
                    month = summary.get("month", "")
                    year = summary.get("year", "")
                    return (
                        f"{prefix}**Báo cáo Chi tiêu Cá nhân (Tháng {month}/{year}) • FinanceAgent:**\n"
                        f"- **Tổng chi tiêu:** {total_expense:,} VND\n"
                        f"- **Tổng thu nhập:** {total_income:,} VND\n"
                        f"- **Tiết kiệm ròng:** {net_savings:,} VND\n"
                        "Bạn có thể mở mục **Tài chính** trên thanh điều hướng để xem chi tiết biểu đồ từng danh mục hoặc xuất file CSV."
                    )
            return (
                f"{prefix}Yêu cầu liên quan đến **Trung tâm Tài chính (Finance Center)**.\n"
                "Bạn có thể mở trực tiếp mục **Tài chính** trên thanh điều hướng để xem thu chi bằng VND, quản lý ngân sách tháng, hoặc nhập file CSV."
            )

        if intent == "CODING":
            for tr in tool_results:
                if tr["tool"] == "get_project_git_status" and tr["status"] == "SUCCESS":
                    git_info = tr["result"]
                    if "error" in git_info:
                        return f"{prefix}{git_info['error']}"
                    proj_name = git_info.get("project_name", "GreenPhone")
                    branch = git_info.get("current_branch", "main")
                    is_clean = git_info.get("is_clean", True)
                    status_text = "Thư mục làm việc sạch sẽ (Clean)" if is_clean else "Có thay đổi chưa commit"
                    return (
                        f"{prefix}**Báo cáo Trạng thái Dự án {proj_name} • CodingAgent:**\n"
                        f"- **Nhánh hiện tại (Branch):** `{branch}`\n"
                        f"- **Trạng thái thư mục:** {status_text}\n"
                        "Hệ thống tuân thủ chế độ đọc an toàn (Read-Only) đối với các lệnh Git CLI."
                    )
            return (
                f"{prefix}Yêu cầu liên quan đến **Trung tâm Lập trình (Coding Center)**.\n"
                "Hệ thống hỗ trợ kiểm tra an toàn trạng thái Git (`git status`, `git log`, `git diff`) và xem các dự án GreenPhone, CertMaster, EDTOEIC Assistant."
            )

        if intent == "GMAIL":
            return (
                f"{prefix}**Trạng thái Hộp thư Gmail • GmailAgent:**\n"
                "Tài khoản Gmail hiện **Chưa kết nối** (Trạng thái: Disconnected). "
                "HADES OS tuân thủ nghiêm ngặt nguyên tắc trung thực và không tự tạo email giả mạo. "
                "Vui lòng vào tab **GMAIL** trên thanh điều hướng và bấm **Kết nối tài khoản Google** qua OAuth 2.0 PKCE để đồng bộ hộp thư an toàn."
            )

        if intent == "PRODUCTIVITY":
            if tool_results and tool_results[0]["status"] == "SUCCESS":
                tasks = tool_results[0]["result"]
                count = len(tasks)
                return (
                    f"{prefix}Bạn hiện có **{count} nhiệm vụ** trong danh sách công việc cục bộ. "
                    "Hãy mở mục **Năng suất** để xem hạn chót hoặc thêm nhiệm vụ mới."
                )
            return f"{prefix}Bạn có thể quản lý nhiệm vụ và nhắc nhở tại mục **Năng suất**."

        return (
            f"{prefix}HADES OS đã ghi nhận lệnh: *\"{prompt}\"*.\n\n"
            "Để kích hoạt năng lực đàm thoại suy luận đầy đủ với Gemini AI, vui lòng truy cập **Cài đặt -> Cấu hình Gemini** và nhập API Key của bạn."
        )
