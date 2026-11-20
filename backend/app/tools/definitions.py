from dataclasses import dataclass
from typing import Any, Callable


@dataclass
class ToolDefinition:
    name: str
    description: str
    parameters: dict[str, Any]
    required_permission: str
    requires_approval: bool
    risk_level: str  # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    handler: Callable[..., Any]

# In-memory registry of system tools
TOOL_REGISTRY: dict[str, ToolDefinition] = {}

def register_tool(
    name: str,
    description: str,
    parameters: dict[str, Any],
    required_permission: str,
    requires_approval: bool = False,
    risk_level: str = "LOW"
):
    def decorator(func: Callable):
        TOOL_REGISTRY[name] = ToolDefinition(
            name=name,
            description=description,
            parameters=parameters,
            required_permission=required_permission,
            requires_approval=requires_approval,
            risk_level=risk_level,
            handler=func
        )
        return func
    return decorator
