"""FastAPI router for Enterprise Agent Tools & Model Context Protocol (MCP) integrations."""

from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from langchain.tools.tool_registry import tool_registry
from langchain.mcp.adapter import mcp_adapter

router = APIRouter(prefix="/api", tags=["Tools & MCP Integrations"])


class ToolExecutionRequest(BaseModel):
    tool_name: str
    params: Dict[str, Any] = Field(default_factory=dict)


class MCPConnectRequest(BaseModel):
    service_id: str
    endpoint_url: str
    credentials: Dict[str, Any] = Field(default_factory=dict)


@router.get("/tools")
async def list_tools():
    """List all registered dynamic tools available to agents."""
    return {"tools": tool_registry.list_tools()}


@router.post("/tools/execute")
async def execute_tool(req: ToolExecutionRequest):
    """Dynamically execute a tool with input parameters."""
    res = await tool_registry.execute_tool(req.tool_name, **req.params)
    return res.dict()


@router.get("/mcp/integrations")
async def list_mcp_integrations():
    """List available Model Context Protocol (MCP) server extension points."""
    return {"integrations": mcp_adapter.list_integrations()}


@router.post("/mcp/connect")
async def connect_mcp_server(req: MCPConnectRequest):
    """Connect an external MCP server integration."""
    success = mcp_adapter.connect_server(req.service_id, req.endpoint_url, req.credentials)
    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to connect MCP server '{req.service_id}'.")
    return {"status": "connected", "service_id": req.service_id}
