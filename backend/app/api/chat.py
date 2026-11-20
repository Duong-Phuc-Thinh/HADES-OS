import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.app.database import SessionLocal, get_db
from backend.app.models.conversation import Conversation, ConversationMessage
from backend.app.models.settings import AppSetting
from backend.app.orchestrator.engine import HadesOrchestrator
from backend.app.schemas import ChatMessagePayload, ChatResponse
from backend.app.services.gemini_service import GeminiError, gemini_service
from backend.app.tools.gateway import ToolGateway

router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.post("/message", response_model=ChatResponse)
def send_chat_message(payload: ChatMessagePayload, db: Session = Depends(get_db)):
    """Dispatch user chat message to the Hades Orchestrator."""
    if not payload.content or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Nội dung tin nhắn không được để trống")
        
    result = HadesOrchestrator.process_message(
        db=db,
        content=payload.content.strip(),
        conversation_id=payload.conversation_id
    )
    return ChatResponse(
        conversation_id=result["conversation_id"],
        message_id=result["message_id"],
        reply=result["reply"],
        agent_name=result["agent_name"],
        tool_invocations=result["tool_invocations"]
    )

@router.get("/conversations")
def list_conversations(limit: int = 30, db: Session = Depends(get_db)):
    convs = (
        db.query(Conversation)
        .filter(Conversation.is_archived == False)
        .order_by(Conversation.updated_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": c.id,
            "title": c.title,
            "created_at": c.created_at.isoformat(),
            "updated_at": c.updated_at.isoformat()
        }
        for c in convs
    ]

@router.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(conversation_id: str, db: Session = Depends(get_db)):
    messages = (
        db.query(ConversationMessage)
        .filter(ConversationMessage.conversation_id == conversation_id)
        .order_by(ConversationMessage.created_at.asc())
        .all()
    )
    return [
        {
            "id": m.id,
            "role": m.sender_role,
            "content": m.content,
            "agent_name": m.agent_name,
            "created_at": m.created_at.isoformat()
        }
        for m in messages
    ]

@router.get("/stream")
async def stream_chat(
    request: Request,
    prompt: str = Query(...),
    conversation_id: str | None = Query(None)
):
    """
    Real-time SSE streaming endpoint with request cancellation and live token delivery.
    Emits typed events: start, tool_start, tool_result, token, done, error.
    """
    async def event_generator():
        db = SessionLocal()
        try:
            # 1. Manage conversation
            nonlocal conversation_id
            if not conversation_id:
                conv = Conversation(title=prompt[:30] + ("..." if len(prompt) > 30 else ""))
                db.add(conv)
                db.commit()
                db.refresh(conv)
                conversation_id = conv.id
            else:
                conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
                if not conv:
                    conv = Conversation(id=conversation_id, title=prompt[:30])
                    db.add(conv)
                    db.commit()

            # 2. Save user message
            user_msg = ConversationMessage(
                conversation_id=conversation_id,
                sender_role="user",
                content=prompt
            )
            db.add(user_msg)
            db.commit()

            # 3. Classify intent
            intent = HadesOrchestrator.classify_intent(prompt)
            agent_name = HadesOrchestrator.get_agent_name_for_intent(intent)

            # Send start event
            yield f"event: start\ndata: {json.dumps({'agent_name': agent_name, 'intent': intent, 'conversation_id': conversation_id}, ensure_ascii=False)}\n\n"

            # 4. Execute tool if applicable
            from backend.app.models.agent import AgentRun
            agent_run = AgentRun(agent_name=agent_name, intent=intent, status="RUNNING")
            db.add(agent_run)
            db.commit()
            db.refresh(agent_run)

            tool_results = []
            if intent == "SYSTEM":
                yield f"event: tool_start\ndata: {json.dumps({'tool': 'get_system_stats'}, ensure_ascii=False)}\n\n"
                status, res = ToolGateway.execute_tool(db, agent_run.id, "get_system_stats", {})
                tool_results.append({"tool": "get_system_stats", "status": status, "result": res})
                yield f"event: tool_result\ndata: {json.dumps({'tool': 'get_system_stats', 'status': status, 'result': res}, ensure_ascii=False)}\n\n"
            elif intent == "CODING":
                proj_name = "GreenPhone"
                for candidate in ["GreenPhone", "CertMaster", "EDTOEIC"]:
                    if candidate.lower() in prompt.lower():
                        proj_name = candidate
                        break
                yield f"event: tool_start\ndata: {json.dumps({'tool': 'get_project_git_status'}, ensure_ascii=False)}\n\n"
                status, res = ToolGateway.execute_tool(db, agent_run.id, "get_project_git_status", {"project_name": proj_name})
                tool_results.append({"tool": "get_project_git_status", "status": status, "result": res})
                yield f"event: tool_result\ndata: {json.dumps({'tool': 'get_project_git_status', 'status': status, 'result': res}, ensure_ascii=False)}\n\n"
            elif intent == "FINANCE":
                from datetime import date
                today = date.today()
                yield f"event: tool_start\ndata: {json.dumps({'tool': 'get_finance_summary'}, ensure_ascii=False)}\n\n"
                status, res = ToolGateway.execute_tool(db, agent_run.id, "get_finance_summary", {"month": today.month, "year": today.year})
                tool_results.append({"tool": "get_finance_summary", "status": status, "result": res})
                yield f"event: tool_result\ndata: {json.dumps({'tool': 'get_finance_summary', 'status': status, 'result': res}, ensure_ascii=False)}\n\n"
            elif intent == "PRODUCTIVITY":
                yield f"event: tool_start\ndata: {json.dumps({'tool': 'list_tasks'}, ensure_ascii=False)}\n\n"
                status, res = ToolGateway.execute_tool(db, agent_run.id, "list_tasks", {})
                tool_results.append({"tool": "list_tasks", "status": status, "result": res})
                yield f"event: tool_result\ndata: {json.dumps({'tool': 'list_tasks', 'status': status, 'result': res}, ensure_ascii=False)}\n\n"

            # 5. Stream content from Gemini or offline fallback
            full_reply = ""
            model_setting = db.query(AppSetting).filter(AppSetting.key == "gemini_model").first()
            model_name = model_setting.value if model_setting else "gemini-2.5-flash"

            if gemini_service.is_configured():
                try:
                    system_instruction = (
                        "Bạn là HADES OS, trợ lý AI chỉ huy máy tính cá nhân tương lai cho Windows 10/11. "
                        "Hãy trả lời người dùng một cách chính xác, sắc bén, chuyên nghiệp bằng Tiếng Việt. "
                        f"Bạn đang đại diện cho Tác nhân chuyên môn: {agent_name}."
                    )
                    prompt_payload = f"Người dùng hỏi: {prompt}\n"
                    if tool_results:
                        prompt_payload += f"Dữ liệu công cụ thu thập được:\n{json.dumps(tool_results, ensure_ascii=False)}"

                    for chunk in gemini_service.generate_stream(
                        prompt=prompt_payload,
                        model=model_name,
                        system_instruction=system_instruction
                    ):
                        if await request.is_disconnected():
                            break
                        full_reply += chunk
                        yield f"event: token\ndata: {json.dumps({'token': chunk}, ensure_ascii=False)}\n\n"
                        await asyncio.sleep(0.01)
                except GeminiError as e:
                    fallback = HadesOrchestrator._generate_offline_fallback(prompt, intent, agent_name, tool_results, error_str=str(e))
                    full_reply = fallback
                    for w in fallback.split(" "):
                        if await request.is_disconnected():
                            break
                        yield f"event: token\ndata: {json.dumps({'token': w + ' '}, ensure_ascii=False)}\n\n"
                        await asyncio.sleep(0.015)
            else:
                fallback = HadesOrchestrator._generate_offline_fallback(prompt, intent, agent_name, tool_results)
                full_reply = fallback
                for w in fallback.split(" "):
                    if await request.is_disconnected():
                        break
                    yield f"event: token\ndata: {json.dumps({'token': w + ' '}, ensure_ascii=False)}\n\n"
                    await asyncio.sleep(0.015)

            # 6. Save assistant message
            assistant_msg = ConversationMessage(
                conversation_id=conversation_id,
                sender_role="assistant",
                content=full_reply,
                agent_name=agent_name
            )
            db.add(assistant_msg)
            agent_run.status = "COMPLETED"
            db.commit()
            db.refresh(assistant_msg)

            yield f"event: done\ndata: {json.dumps({'status': 'completed', 'conversation_id': conversation_id, 'message_id': assistant_msg.id}, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"
        finally:
            db.close()

    return StreamingResponse(event_generator(), media_type="text/event-stream")
