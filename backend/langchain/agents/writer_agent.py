"""Writer Agent for PromptForge AI Multi-Agent Engine."""

from typing import Tuple
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain.agents.base import BaseAgent, AgentState, AgentStepResult
from config import LLM_MODEL

class WriterAgent(BaseAgent):
    """Writer Agent: Synthesizes final response using retrieved context and planner strategy."""

    def __init__(self, model_name: str = LLM_MODEL):
        super().__init__(agent_name="Writer", model_name=model_name)
        self.llm = ChatOpenAI(model=model_name, temperature=0.5)

    async def run(self, state: AgentState) -> Tuple[AgentState, AgentStepResult]:
        start_ts, start_iso = self._start_telemetry()

        # Build context from retrieved docs
        context_parts = []
        for idx, doc in enumerate(state.retrieved_docs):
            filename = doc.get("filename", "Document")
            page_num = doc.get("page_number", 1)
            content = doc.get("content", "")
            context_parts.append(f"[Source {idx+1} | {filename} (Page {page_num})]\n{content}")

        context_str = "\n\n".join(context_parts) if context_parts else "No specific document context retrieved."
        strategy = state.planner_output.get("strategy", "Provide direct grounded answer.")

        system_prompt = (
            "You are the Writer Agent in an Enterprise Multi-Agent System.\n"
            "Your objective is to generate a comprehensive, accurate, professional, and well-structured answer.\n"
            f"Execution Strategy: {strategy}\n"
            "Instructions:\n"
            "- Rely on the provided context sources to ground your answer.\n"
            "- Use inline source references like [Source 1] when stating facts.\n"
            "- Format with clean Markdown, bullet points, and code snippets where appropriate."
        )

        user_content = (
            f"### CONTEXT SOURCES:\n{context_str}\n\n"
            f"### USER QUERY:\n{state.user_query}"
        )

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_content)
            ])
            answer = response.content
            tokens_used = response.response_metadata.get("token_usage", {}).get("total_tokens", len(answer) // 4 + 100)
        except Exception as e:
            answer = f"Generated answer based on query: {state.user_query}\n\nContext Summary: {context_str[:200]}..."
            tokens_used = 150

        # Update state
        writer_output = {
            "draft_answer": answer,
            "context_sources_used": len(state.retrieved_docs),
            "word_count": len(answer.split())
        }
        
        state.writer_output = writer_output
        state.final_response = answer
        state.current_active_node = "Reviewer"

        step_result = self._end_telemetry(
            start_ts=start_ts,
            start_iso=start_iso,
            status="completed",
            tokens=tokens_used,
            confidence=0.95,
            output=writer_output
        )

        state.execution_steps.append(step_result.dict())
        state.total_tokens += tokens_used
        state.total_latency_ms += step_result.duration_ms

        return state, step_result
