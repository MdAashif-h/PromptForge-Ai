"""Python Tool for executing sandboxed math/data expressions."""

import time
import math
from typing import Dict, Any
from .base_tool import BaseTool, ToolResult


class PythonTool(BaseTool):
    """Evaluates mathematical, logical, or analytical Python code expressions safely."""

    def __init__(self):
        super().__init__(
            name="PythonTool",
            description="Executes python code snippets for numerical operations, array transformations, or string manipulation.",
            parameters_schema={
                "type": "object",
                "properties": {
                    "code": {"type": "string", "description": "Python expression or statement to evaluate"}
                },
                "required": ["code"]
            }
        )

    async def execute(self, code: str = "", **kwargs) -> ToolResult:
        start_ts = time.time()
        safe_globals = {"math": math, "abs": abs, "len": len, "min": min, "max": max, "sum": sum, "round": round}
        try:
            # Simple expression evaluation
            output = eval(code, {"__builtins__": None}, safe_globals)
            return ToolResult(
                tool_name=self.name,
                is_success=True,
                result={"output": str(output)},
                latency_ms=round((time.time() - start_ts) * 1000, 2)
            )
        except Exception as e:
            return ToolResult(
                tool_name=self.name,
                is_success=False,
                error=f"Python Execution Error: {e}",
                latency_ms=round((time.time() - start_ts) * 1000, 2)
            )
