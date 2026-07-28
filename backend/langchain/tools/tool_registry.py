"""Tool Registry for discovering and executing enterprise agent tools."""

from typing import Dict, List, Any, Optional
from .base_tool import BaseTool, ToolResult
from .sql_tool import SQLTool
from .python_tool import PythonTool
from .calculator_tool import CalculatorTool, WebSearchTool, KnowledgeBaseTool, DocumentReaderTool


class ToolRegistry:
    """Central registry holding all agent tool instances."""

    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
        self._register_default_tools()

    def _register_default_tools(self):
        self.register(SQLTool())
        self.register(PythonTool())
        self.register(CalculatorTool())
        self.register(WebSearchTool())
        self.register(KnowledgeBaseTool())
        self.register(DocumentReaderTool())

    def register(self, tool: BaseTool):
        self._tools[tool.name.lower()] = tool

    def get_tool(self, name: str) -> Optional[BaseTool]:
        return self._tools.get(name.lower())

    def list_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.parameters_schema,
                "is_active": True
            }
            for tool in self._tools.values()
        ]

    async def execute_tool(self, name: str, **kwargs) -> ToolResult:
        tool = self.get_tool(name)
        if not tool:
            return ToolResult(tool_name=name, is_success=False, error=f"Tool '{name}' is not registered.")
        return await tool.execute(**kwargs)


tool_registry = ToolRegistry()
