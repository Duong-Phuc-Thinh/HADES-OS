from datetime import UTC, datetime

from sqlalchemy.orm import Session

from backend.app.models.agent import AuditLog, PermissionGrant


class PermissionScope:
    READ_LOCAL = "READ_LOCAL"
    READ_GMAIL = "READ_GMAIL"
    WRITE_GMAIL_DRAFT = "WRITE_GMAIL_DRAFT"
    SEND_GMAIL = "SEND_GMAIL"
    READ_FINANCE = "READ_FINANCE"
    WRITE_FINANCE = "WRITE_FINANCE"
    READ_REPOSITORY = "READ_REPOSITORY"
    EDIT_REPOSITORY = "EDIT_REPOSITORY"
    RUN_APPROVED_TEST = "RUN_APPROVED_TEST"
    EXECUTE_COMMAND = "EXECUTE_COMMAND"
    EXTERNAL_NETWORK = "EXTERNAL_NETWORK"

class PermissionManager:
    """
    Deny-by-default capability-based permission manager.
    Validates permissions and handles user approval gates for sensitive operations.
    """
    
    # Sensitive permissions that strictly require one-time approval if not pre-granted
    SENSITIVE_PERMISSIONS = {
        PermissionScope.SEND_GMAIL,
        PermissionScope.EDIT_REPOSITORY,
        PermissionScope.EXECUTE_COMMAND,
    }
    
    @classmethod
    def check_permission(
        cls,
        db: Session,
        permission_name: str,
        resource: str = "*"
    ) -> bool:
        """
        Check if an active permission grant exists for this permission and resource.
        """
        now = datetime.now(UTC)
        grants = (
            db.query(PermissionGrant)
            .filter(
                PermissionGrant.permission_name == permission_name,
                PermissionGrant.is_active == True  # noqa: E712
            )
            .all()
        )
        
        for grant in grants:
            # Check expiry
            if grant.expires_at and grant.expires_at.replace(tzinfo=UTC) < now:
                continue
                
            # Check resource pattern wildcard
            pattern = grant.resource_pattern
            if pattern == "*" or pattern == resource or resource.startswith(pattern.rstrip("*")):
                return True
                
        return False
        
    @classmethod
    def log_audit(
        cls,
        db: Session,
        event_type: str,
        actor: str,
        action: str,
        details: str | None = None
    ) -> AuditLog:
        """Record an immutable audit log entry."""
        log = AuditLog(
            event_type=event_type,
            actor=actor,
            action=action,
            details_json=details
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
