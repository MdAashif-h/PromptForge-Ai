"""SQL Tool for querying relational database tables."""

import time
from typing import Dict, Any
from .base_tool import BaseTool, ToolResult
from sqlalchemy import text
from database.database import engine


class SQLTool(BaseTool):
    """Executes safe read-only SQL queries over the database."""

    def __init__(self):
        super().__init__(
            name="SQLTool",
            description="Executes read-only SQL SELECT queries over system tables to retrieve structured data.",
            parameters_schema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Read-only SQL SELECT query"}
                },
                "required": ["query"]
            }
        )

    async def execute(self, query: str = "", **kwargs) -> ToolResult:
        start_ts = time.time()
        query_clean = query.strip()
        if not query_clean.upper().startswith("SELECT"):
            return ToolResult(
                tool_name=self.name,
                is_success=False,
                error="Security Violation: Only SELECT queries are permitted.",
                latency_ms=round((time.time() - start_ts) * 1000, 2)
            )

        try:
            with engine.connect() as conn:
                result = conn.execute(text(query_clean))
                keys = result.keys()
                rows = [dict(zip(keys, row)) for row in result.fetchall()[:50]]
            
            return ToolResult(
                tool_name=self.name,
                is_success=True,
                result={"row_count": len(rows), "rows": rows},
                latency_ms=round((time.time() - start_ts) * 1000, 2)
            )
        except Exception as e:
            return ToolResult(
                tool_name=self.name,
                is_success=False,
                error=str(e),
                latency_ms=round((time.time() - start_ts) * 1000, 2)
            )
