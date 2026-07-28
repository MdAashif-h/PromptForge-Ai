import axios from 'axios';
import type { AgentExecuteRequest, AgentRunHistory } from '@/types/agent';

const API_BASE_URL = 'http://127.0.0.1:8000/api/agents';

export const executeAgentWorkflow = async (req: AgentExecuteRequest) => {
  const response = await axios.post(`${API_BASE_URL}/execute`, req);
  return response.data;
};

export const fetchAgentRuns = async (): Promise<AgentRunHistory[]> => {
  const response = await axios.get(`${API_BASE_URL}/runs`);
  return response.data.runs || [];
};

export const retryAgentRun = async (runId: string, req: AgentExecuteRequest) => {
  const response = await axios.post(`${API_BASE_URL}/runs/${runId}/retry`, req);
  return response.data;
};

export const streamAgentWorkflow = (
  req: AgentExecuteRequest,
  onEvent: (data: any) => void,
  onError: (err: any) => void
) => {
  const controller = new AbortController();

  fetch(`${API_BASE_URL}/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok || !res.body) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.replace('data: ', '').trim();
              if (jsonStr) {
                const parsed = JSON.parse(jsonStr);
                onEvent(parsed);
              }
            } catch (e) {
              console.error('SSE JSON parse error:', e);
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError(err);
      }
    });

  return () => controller.abort();
};
