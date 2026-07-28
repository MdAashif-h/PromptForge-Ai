"""Base Tool abstraction for PromptForge AI dynamic agent tool calling."""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class ToolResult(BaseModel):
    tool_name: str
    is_success: bool = True
    result: Any = None
    error: Optional[str] = None
    latency_ms: float = 0.0


class BaseTool(ABC):
    """Abstract base class for all enterprise agent tools."""

    name: str
    description: str
    parameters_schema: Dict[str, Any]

    def __init__(self, name: str, description: str, parameters_schema: Dict[str, Any] = None):
        self.name = name
        self.description = description
        self.parameters_schema = parameters_schema or {}

    @abstractmethod
    async def execute(self, **kwargs) -> ToolResult:
        """Execute the tool with given key-value arguments."""
        pass
