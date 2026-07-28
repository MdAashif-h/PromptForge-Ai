"""Model Context Protocol (MCP) Adapter & Server Connector Integration Layer."""

from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field


class MCPServerConfig(BaseModel):
    service_id: str
    name: str
    endpoint_url: str = ""
    auth_type: str = "oauth2"  # oauth2 | api_key | bearer
    is_connected: bool = False
    supported_actions: List[str] = Field(default_factory=list)


class MCPIntegrationAdapter:
    """Extension point for external Model Context Protocol (MCP) servers."""

    def __init__(self):
        self._servers: Dict[str, MCPServerConfig] = {}
        self._register_default_extension_points()

    def _register_default_extension_points(self):
        default_integrations = [
            MCPServerConfig(service_id="github", name="GitHub Integration", supported_actions=["fetch_repos", "read_issue", "create_pr", "search_code"]),
            MCPServerConfig(service_id="gdrive", name="Google Drive", supported_actions=["read_file", "search_folder", "export_docs"]),
            MCPServerConfig(service_id="slack", name="Slack Messenger", supported_actions=["send_message", "read_channel", "search_messages"]),
            MCPServerConfig(service_id="notion", name="Notion Workspace", supported_actions=["query_database", "read_page", "append_block"]),
            MCPServerConfig(service_id="confluence", name="Confluence Enterprise", supported_actions=["search_pages", "read_space"]),
            MCPServerConfig(service_id="jira", name="Jira Software", supported_actions=["create_issue", "query_jql", "update_status"]),
            MCPServerConfig(service_id="gmail", name="Gmail Mailroom", supported_actions=["draft_email", "search_threads"]),
            MCPServerConfig(service_id="calendar", name="Google Calendar", supported_actions=["list_events", "create_meeting"]),
            MCPServerConfig(service_id="figma", name="Figma Design Studio", supported_actions=["get_file_nodes", "export_assets"])
        ]
        for config in default_integrations:
            self._servers[config.service_id] = config

    def list_integrations(self) -> List[Dict[str, Any]]:
        return [
            {
                "service_id": s.service_id,
                "name": s.name,
                "status": "ready_to_connect" if not s.is_connected else "connected",
                "supported_actions": s.supported_actions
            }
            for s in self._servers.values()
        ]

    def register_mcp_server(self, config: MCPServerConfig):
        self._servers[config.service_id] = config

    def connect_server(self, service_id: str, endpoint_url: str, credentials: dict) -> bool:
        if service_id in self._servers:
            self._servers[service_id].is_connected = True
            self._servers[service_id].endpoint_url = endpoint_url
            return True
        return False


mcp_adapter = MCPIntegrationAdapter()
