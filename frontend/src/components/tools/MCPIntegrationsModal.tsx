import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Server, Plus, Play, CheckCircle2, XCircle, RefreshCw, X, ShieldCheck, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { fetchMCPIntegrations, connectMCPServer, fetchTools, executeTool } from '@/services/api';
import type { MCPIntegrationInfo, ToolDefinition } from '@/types';

interface MCPIntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MCPIntegrationsModal({ isOpen, onClose }: MCPIntegrationsModalProps) {
  const [integrations, setIntegrations] = useState<MCPIntegrationInfo[]>([]);
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [loading, setLoading] = useState(false);

  // New MCP Server Connect Form State
  const [name, setName] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [authHeader, setAuthHeader] = useState('');
  const [connecting, setConnecting] = useState(false);

  // Tool Execution Test State
  const [selectedTool, setSelectedTool] = useState<string>('vector_search_tool');
  const [toolArgsJson, setToolArgsJson] = useState<string>('{\n  "query": "system architecture",\n  "top_k": 3\n}');
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mcpData, toolData] = await Promise.all([
        fetchMCPIntegrations(),
        fetchTools()
      ]);
      setIntegrations(mcpData);
      setTools(toolData);
    } catch (err) {
      toast.error('Failed to load MCP integrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleConnectServer = async () => {
    if (!name.trim() || !serverUrl.trim()) {
      toast.error('Server Name and Server URL are required.');
      return;
    }
    setConnecting(true);
    const toastId = toast.loading(`Connecting to MCP Server (${name})...`);
    try {
      await connectMCPServer({
        name,
        server_url: serverUrl,
        auth_header: authHeader
      });
      toast.success(`MCP Server '${name}' connected successfully!`, { id: toastId });
      setName('');
      setServerUrl('');
      setAuthHeader('');
      await loadData();
    } catch (err) {
      toast.error('Failed to connect MCP server.', { id: toastId });
    } finally {
      setConnecting(false);
    }
  };

  const handleExecuteTool = async () => {
    if (!selectedTool) return;
    setExecuting(true);
    setExecutionResult(null);
    let parsedArgs = {};
    try {
      parsedArgs = JSON.parse(toolArgsJson);
    } catch (e) {
      toast.error('Invalid JSON arguments format.');
      setExecuting(false);
      return;
    }

    const toastId = toast.loading(`Executing tool '${selectedTool}'...`);
    try {
      const res = await executeTool(selectedTool, parsedArgs);
      setExecutionResult(res);
      toast.success(`Tool '${selectedTool}' executed successfully!`, { id: toastId });
    } catch (err) {
      toast.error('Tool execution failed.', { id: toastId });
    } finally {
      setExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#121217] border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-6 max-h-[85vh] overflow-y-auto shadow-2xl text-slate-100"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Model Context Protocol (MCP) & Tool Infrastructure</h2>
                <p className="text-xs text-slate-400">Connect external tools, APIs, and enterprise databases to agent workflows</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Connect MCP Server & Active Server List */}
            <div className="space-y-4">
              <div className="bg-[#181820] rounded-xl p-4 border border-slate-800 space-y-3">
                <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Connect External MCP Server
                </h3>
                <input
                  type="text"
                  placeholder="Server Name (e.g. GitHub MCP Server)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#121217] border border-slate-700/60 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="text"
                  placeholder="Server Endpoint (e.g. https://mcp.github.com/v1)"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="w-full bg-[#121217] border border-slate-700/60 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="password"
                  placeholder="Auth Token Header (Optional)"
                  value={authHeader}
                  onChange={(e) => setAuthHeader(e.target.value)}
                  className="w-full bg-[#121217] border border-slate-700/60 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleConnectServer}
                  disabled={connecting}
                  className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20"
                >
                  {connecting ? 'Connecting...' : 'Establish MCP Connection'}
                </button>
              </div>

              {/* Connected Integrations List */}
              <div className="bg-[#181820] rounded-xl p-4 border border-slate-800 space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Connected MCP Adapters ({integrations.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {integrations.map((mcp, idx) => (
                    <div key={mcp.name || idx} className="p-3 bg-[#121217] rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          {mcp.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{mcp.endpoint || 'Internal MCP Adapter'}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase font-bold">
                        {mcp.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Tool Testing Sandbox */}
            <div className="bg-[#181820] rounded-xl p-4 border border-slate-800 space-y-4 flex flex-col">
              <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" /> Tool Execution Sandbox
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Select Tool</label>
                <select
                  value={selectedTool}
                  onChange={(e) => setSelectedTool(e.target.value)}
                  className="w-full bg-[#121217] border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200"
                >
                  {tools.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} — {t.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tool Input Arguments (JSON)</label>
                <textarea
                  rows={4}
                  value={toolArgsJson}
                  onChange={(e) => setToolArgsJson(e.target.value)}
                  className="w-full bg-[#121217] border border-slate-700 rounded-lg p-2.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                onClick={handleExecuteTool}
                disabled={executing}
                className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2"
              >
                {executing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                Execute Tool
              </button>

              {/* Execution Result Box */}
              {executionResult && (
                <div className="flex-1 p-3 bg-[#0A0A0C] rounded-lg border border-slate-800 space-y-1 overflow-x-auto text-[11px] font-mono text-emerald-300">
                  <div className="text-slate-400 text-[9px] uppercase font-bold">Execution Output:</div>
                  <pre>{JSON.stringify(executionResult, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
