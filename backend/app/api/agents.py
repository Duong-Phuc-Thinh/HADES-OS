import json
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.agent import ApprovalRequest
from backend.app.schemas import ToolApprovalDecision
from backend.app.security.permissions import PermissionManager
from backend.app.tools.gateway import ToolGateway

router = APIRouter(prefix="/api/agents", tags=["Agents"])

@router.get("/approvals/pending")
def list_pending_approvals(db: Session = Depends(get_db)):
    """List all pending sensitive tool execution approval requests."""
    pending = (
        db.query(ApprovalRequest)
        .filter(ApprovalRequest.status == "PENDING")
        .order_by(ApprovalRequest.requested_at.desc())
        .all()
    )
    results = []
    for p in pending:
        invocation = p.tool_invocation
        results.append({
            "id": p.id,
            "tool_invocation_id": p.tool_invocation_id,
            "tool_name": invocation.tool_name if invocation else "N/A",
            "arguments": json.loads(invocation.arguments_json) if invocation and invocation.arguments_json else {},
            "description": p.description,
            "risk_level": p.risk_level,
            "status": p.status,
            "requested_at": p.requested_at.isoformat()
        })
    return results

@router.post("/approvals/{approval_id}/decide")
def decide_approval(
    approval_id: str,
    payload: ToolApprovalDecision,
    db: Session = Depends(get_db)
):
    """Approve or reject a sensitive tool approval request."""
    req = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu phê duyệt")
        
    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Yêu cầu này đã được xử lý (Trạng thái: {req.status})")
        
    invocation = req.tool_invocation
    now = datetime.now(UTC)
    req.responded_at = now
    
    if payload.approved:
        req.status = "APPROVED"
        if invocation:
            invocation.is_approved = True
            # Execute tool with is_pre_approved=True
            args = json.loads(invocation.arguments_json) if invocation.arguments_json else {}
            status, result = ToolGateway.execute_tool(
                db=db,
                agent_run_id=invocation.agent_run_id,
                tool_name=invocation.tool_name,
                arguments=args,
                is_pre_approved=True
            )
            invocation.status = status
            invocation.result_json = json.dumps(result, ensure_ascii=False) if isinstance(result, (dict, list, str, int, bool)) else str(result)
            
        PermissionManager.log_audit(
            db,
            event_type="APPROVAL_DECISION",
            actor="USER",
            action=f"APPROVE:{invocation.tool_name if invocation else 'N/A'}",
            details=json.dumps({"approval_id": approval_id})
        )
        db.commit()
        return {"status": "APPROVED", "message": "Đã phê duyệt và thực thi công cụ thành công"}
    else:
        req.status = "REJECTED"
        if invocation:
            invocation.status = "DENIED"
            invocation.result_json = json.dumps({"reason": payload.rejection_reason or "Người dùng từ chối phê duyệt"}, ensure_ascii=False)
            
        PermissionManager.log_audit(
            db,
            event_type="APPROVAL_DECISION",
            actor="USER",
            action=f"REJECT:{invocation.tool_name if invocation else 'N/A'}",
            details=json.dumps({"reason": payload.rejection_reason})
        )
        db.commit()
        return {"status": "REJECTED", "message": "Đã từ chối thực thi công cụ an toàn"}
