import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Database,
  FileText,
  Bot,
  Zap,
  Clock,
  ShieldCheck,
  DollarSign,
  Layers,
  Activity,
} from 'lucide-react';
import { fetchAnalyticsSummary } from '@/services/analyticsApi';
import type { AnalyticsSummary } from '@/services/analyticsApi';
import { useWorkspace } from '@/context/WorkspaceContext';

const MODEL_COLORS = ['#FF7F11', '#00D4FF', '#22C55E', '#A855F7'];

export default function AnalyticsPage() {
  const { activeWorkspace, activeProject } = useWorkspace();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const summary = await fetchAnalyticsSummary(
          activeWorkspace?.id || 'ws_default',
          activeProject?.id || 'proj_default'
        );
        setData(summary);
      } catch (err) {
        console.error('Failed to load analytics data:', err);
        // Fallback data structure if backend is unreachable or empty
        setData({
          workspace_id: activeWorkspace?.id || 'ws_default',
          project_id: activeProject?.id || 'proj_default',
          document_count: 0,
          prompt_count: 0,
          chroma_vector_count: 0,
          agent_run_count: 0,
          total_tokens_used: 0,
          average_latency_ms: 0,
          average_confidence_percent: 0,
          langsmith_trace_count: 0,
          cost_estimate_usd: 0,
          prompt_success_rate: 0,
          model_usage: [],
          daily_activity: [],
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeWorkspace, activeProject]);

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-[#A3A3A3]">
          <div className="w-5 h-5 rounded-full border-2 border-[#FF7F11] border-t-transparent animate-spin" />
          <span className="text-sm font-mono">Aggregating live telemetry...</span>
        </div>
      </div>
    );
  }

  const hasDailyActivity = data.daily_activity && data.daily_activity.length > 0 && data.daily_activity.some(d => d.tokens > 0 || d.runs > 0);
  const hasModelUsage = data.model_usage && data.model_usage.length > 0 && data.model_usage.some(m => m.usage_percent > 0 || m.tokens > 0);

  const metricCards = [
    { title: 'Total Documents', value: data.document_count, icon: FileText, color: '#FF7F11' },
    { title: 'ChromaDB Vectors', value: data.chroma_vector_count, icon: Database, color: '#00D4FF' },
    { title: 'Prompt Library Count', value: data.prompt_count, icon: BarChart3, color: '#A855F7' },
    { title: 'Agent Runs', value: data.agent_run_count, icon: Bot, color: '#3B82F6' },
    { title: 'Total Tokens Used', value: data.total_tokens_used.toLocaleString(), icon: Zap, color: '#22C55E' },
    { title: 'Avg Latency', value: `${data.average_latency_ms} ms`, icon: Clock, color: '#F59E0B' },
    { title: 'Avg Quality Confidence', value: `${data.average_confidence_percent}%`, icon: ShieldCheck, color: '#10B981' },
    { title: 'Cost Estimate (USD)', value: `$${data.cost_estimate_usd}`, icon: DollarSign, color: '#EC4899' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 md:gap-12 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121212] p-6 rounded-2xl border border-[#3A3A3A]">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#F5F5F5] tracking-tight">Real Runtime Analytics</h1>
              <p className="text-xs text-[#A3A3A3] mt-0.5">
                Live telemetry aggregated across {activeWorkspace?.name || 'Workspace'} • {activeProject?.name || 'Project'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-fr">
        {metricCards.map((card, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl bg-[#121212] border border-[#3A3A3A] flex flex-col justify-between h-full space-y-3 hover:border-[#FF7F11]/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A3A3A3]">{card.title}</span>
              <div className="p-1.5 rounded-lg shrink-0" style={{ background: `${card.color}15`, color: card.color }}>
                <card.icon size={16} />
              </div>
            </div>
            <div className="text-xl font-mono font-bold text-[#F5F5F5] pt-1">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Token & Execution Activity */}
        <div className="lg:col-span-2 bg-[#121212] p-6 rounded-2xl border border-[#3A3A3A] space-y-4">
          <h2 className="text-sm font-semibold text-[#A3A3A3] tracking-wide uppercase flex items-center gap-2">
            <Zap size={16} className="text-[#FF7F11]" />
            <span>Daily Workflow Execution & Token Volume</span>
          </h2>

          {hasDailyActivity ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.daily_activity}>
                  <XAxis dataKey="day" stroke="#737373" fontSize={12} />
                  <YAxis stroke="#737373" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: '#0A0A0A', borderColor: '#3A3A3A', borderRadius: '12px', color: '#F5F5F5' }}
                  />
                  <Bar dataKey="tokens" fill="#FF7F11" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 w-full flex flex-col items-center justify-center bg-[#0A0A0A] rounded-xl border border-[#3A3A3A]/50 p-6 text-center">
              <BarChart3 className="w-8 h-8 text-[#737373] mb-2" />
              <p className="text-xs font-mono text-[#A3A3A3]">No analytics data available.</p>
              <p className="text-[11px] text-[#737373] mt-1 font-sans">Run RAG workflows or agent executions to record daily token volume telemetry.</p>
            </div>
          )}
        </div>

        {/* Model Usage Share */}
        <div className="bg-[#121212] p-6 rounded-2xl border border-[#3A3A3A] space-y-4">
          <h2 className="text-sm font-semibold text-[#A3A3A3] tracking-wide uppercase flex items-center gap-2">
            <Layers size={16} className="text-[#00D4FF]" />
            <span>Model Usage Share</span>
          </h2>

          {hasModelUsage ? (
            <>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.model_usage}
                      dataKey="usage_percent"
                      nameKey="model"
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                      innerRadius={35}
                    >
                      {data.model_usage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={MODEL_COLORS[index % MODEL_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0A0A0A', borderColor: '#3A3A3A', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#3A3A3A]/40">
                {data.model_usage.map((m, idx) => (
                  <div key={m.model} className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: MODEL_COLORS[idx % MODEL_COLORS.length] }}
                      />
                      <span className="text-[#F5F5F5]">{m.model}</span>
                    </div>
                    <span className="text-[#A3A3A3]">{m.usage_percent}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 w-full flex flex-col items-center justify-center bg-[#0A0A0A] rounded-xl border border-[#3A3A3A]/50 p-6 text-center">
              <Layers className="w-8 h-8 text-[#737373] mb-2" />
              <p className="text-xs font-mono text-[#A3A3A3]">No analytics data available.</p>
              <p className="text-[11px] text-[#737373] mt-1 font-sans">Model distribution telemetry will appear here after LLM executions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
