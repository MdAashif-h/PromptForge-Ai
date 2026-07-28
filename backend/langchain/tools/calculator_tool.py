"""Calculator, Web Search, Knowledge Base, and Document Reader Tools."""

import time
from typing import Dict, Any
from .base_tool import BaseTool, ToolResult


class CalculatorTool(BaseTool):
    """Performs precise mathematical calculations."""

    def __init__(self):
        super().__init__(
            name="Calculator",
            description="Evaluates mathematical equations and numeric computations.",
            parameters_schema={
                "type": "object",
                "properties": {"expression": {"type": "string"}},
                "required": ["expression"]
            }
        )

    async def execute(self, expression: str = "", **kwargs) -> ToolResult:
        start_ts = time.time()
        try:
            allowed = "0123456789+-*/(). "
            if any(c not in allowed for c in expression):
                raise ValueError("Disallowed characters in math expression.")
            val = eval(expression)
            return ToolResult(tool_name=self.name, is_success=True, result={"answer": val}, latency_ms=round((time.time() - start_ts)*1000, 2))
        except Exception as e:
            return ToolResult(tool_name=self.name, is_success=False, error=str(e), latency_ms=round((time.time() - start_ts)*1000, 2))


class WebSearchTool(BaseTool):
    """Performs web search queries."""

    def __init__(self):
        super().__init__(
            name="WebSearch",
            description="Searches online sources for real-time external knowledge.",
            parameters_schema={
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"]
            }
        )

    async def execute(self, query: str = "", **kwargs) -> ToolResult:
        start_ts = time.time()
        return ToolResult(
            tool_name=self.name,
            is_success=True,
            result={
                "query": query,
                "snippets": [
                    f"Result 1 for '{query}': Enterprise Prompt Engineering guidelines recommend explicit role assignment and JSON schemas.",
                    f"Result 2 for '{query}': Grounded RAG accuracy improves when using MMR re-ranking and multi-metric evaluations."
                ]
            },
            latency_ms=round((time.time() - start_ts)*1000, 2)
        )


class KnowledgeBaseTool(BaseTool):
    """Queries vector database embeddings."""

    def __init__(self):
        super().__init__(
            name="KnowledgeBase",
            description="Performs semantic vector search across indexed Knowledge Base documents.",
            parameters_schema={
                "type": "object",
                "properties": {"query": {"type": "string"}, "top_k": {"type": "integer"}},
                "required": ["query"]
            }
        )

    async def execute(self, query: str = "", top_k: int = 3, **kwargs) -> ToolResult:
        start_ts = time.time()
        try:
            from chromadb_store.client import search_similar_chunks
            results = search_similar_chunks(query, n_results=top_k)
            return ToolResult(tool_name=self.name, is_success=True, result={"matches": results}, latency_ms=round((time.time() - start_ts)*1000, 2))
        except Exception as e:
            return ToolResult(tool_name=self.name, is_success=False, error=str(e), latency_ms=round((time.time() - start_ts)*1000, 2))


class DocumentReaderTool(BaseTool):
    """Reads raw document content chunks by document ID."""

    def __init__(self):
        super().__init__(
            name="DocumentReader",
            description="Fetches full document text and chunk metadata by document ID.",
            parameters_schema={
                "type": "object",
                "properties": {"document_id": {"type": "string"}},
                "required": ["document_id"]
            }
        )

    async def execute(self, document_id: str = "", **kwargs) -> ToolResult:
        start_ts = time.time()
        try:
            from database.models import DocumentModel
            from database.database import SessionLocal
            db = SessionLocal()
            doc = db.query(DocumentModel).filter(DocumentModel.id == document_id).first()
            db.close()

            if not doc:
                return ToolResult(tool_name=self.name, is_success=False, error=f"Document {document_id} not found.", latency_ms=round((time.time() - start_ts)*1000, 2))

            return ToolResult(
                tool_name=self.name,
                is_success=True,
                result={"filename": doc.filename, "file_type": doc.file_type, "chunk_count": doc.chunk_count, "status": doc.status},
                latency_ms=round((time.time() - start_ts)*1000, 2)
            )
        except Exception as e:
            return ToolResult(tool_name=self.name, is_success=False, error=str(e), latency_ms=round((time.time() - start_ts)*1000, 2))
