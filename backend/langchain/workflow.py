"""LangGraph Workflow & Sequential Fallback Orchestrator for PromptForge AI."""

import json
import time
import uuid
import asyncio
from typing import AsyncGenerator, Dict, Any, List
from datetime import datetime

from langchain.agents.base import AgentState, AgentStepResult
from langchain.agents.planner_agent import PlannerAgent
from langchain.agents.retriever_agent import RetrieverAgent
from langchain.agents.prompt_engineer_agent import PromptEngineerAgent
from langchain.agents.writer_agent import WriterAgent
from langchain.agents.reviewer_agent import ReviewerAgent
from langchain.agents.evaluator_agent import EvaluatorAgent
from config import LANGSMITH_PROJECT

# Check LangGraph availability
LANGGRAPH_AVAILABLE = False
try:
    from langgraph.graph import StateGraph, START, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False


class MultiAgentWorkflowManager:
    """Manages Multi-Agent execution via LangGraph StateGraph with Phase 3 Prompt Engineering, Human Approval, and Evaluator nodes."""

    def __init__(self):
        self.planner = PlannerAgent()
        self.retriever = RetrieverAgent()
        self.prompt_engineer = PromptEngineerAgent()
        self.writer = WriterAgent()
        self.reviewer = ReviewerAgent()
        self.evaluator = EvaluatorAgent()
        self.langgraph_app = None

        if LANGGRAPH_AVAILABLE:
            try:
                self._init_langgraph()
            except Exception as e:
                print(f"[WorkflowManager] LangGraph init warning, using Sequential Fallback: {e}")
                self.langgraph_app = None

    def _init_langgraph(self):
        """Construct LangGraph StateGraph instance: START -> Planner -> Retriever -> Prompt Engineer -> Writer -> Reviewer -> Evaluator -> END."""
        builder = StateGraph(dict)

        async def node_planner(state_dict: dict) -> dict:
            state = AgentState(**state_dict)
            updated_state, _ = await self.planner.run(state)
            return updated_state.dict()

        async def node_retriever(state_dict: dict) -> dict:
            state = AgentState(**state_dict)
            updated_state, _ = await self.retriever.run(state)
            return updated_state.dict()

        async def node_prompt_engineer(state_dict: dict) -> dict:
            state = AgentState(**state_dict)
            updated_state, _ = await self.prompt_engineer.run(state)
            return updated_state.dict()

        async def node_writer(state_dict: dict) -> dict:
            state = AgentState(**state_dict)
            updated_state, _ = await self.writer.run(state)
            return updated_state.dict()

        async def node_reviewer(state_dict: dict) -> dict:
            state = AgentState(**state_dict)
            updated_state, _ = await self.reviewer.run(state)
            return updated_state.dict()

        async def node_evaluator(state_dict: dict) -> dict:
            state = AgentState(**state_dict)
            updated_state, _ = await self.evaluator.run(state)
            return updated_state.dict()

        builder.add_node("Planner", node_planner)
        builder.add_node("Retriever", node_retriever)
        builder.add_node("Prompt Engineer", node_prompt_engineer)
        builder.add_node("Writer", node_writer)
        builder.add_node("Reviewer", node_reviewer)
        builder.add_node("Evaluator", node_evaluator)

        builder.add_edge(START, "Planner")
        builder.add_edge("Planner", "Retriever")
        builder.add_edge("Retriever", "Prompt Engineer")
        builder.add_edge("Prompt Engineer", "Writer")
        builder.add_edge("Writer", "Reviewer")
        builder.add_edge("Reviewer", "Evaluator")
        builder.add_edge("Evaluator", END)

        self.langgraph_app = builder.compile()

    async def execute_sequential_fallback(self, state: AgentState) -> AgentState:
        """Sequential Fallback Orchestration."""
        state, _ = await self.planner.run(state)
        state, _ = await self.retriever.run(state)
        state, _ = await self.prompt_engineer.run(state)
        state, _ = await self.writer.run(state)
        state, _ = await self.reviewer.run(state)
        state, _ = await self.evaluator.run(state)
        return state

    async def execute_full(self, state: AgentState) -> AgentState:
        """Full non-streaming execution method."""
        trace_id = f"trace_{uuid.uuid4().hex[:12]}"
        state.langsmith_trace_id = trace_id

        if self.langgraph_app:
            try:
                res_dict = await self.langgraph_app.ainvoke(state.dict())
                return AgentState(**res_dict)
            except Exception as e:
                print(f"[WorkflowManager] LangGraph execution error, using Fallback: {e}")
                return await self.execute_sequential_fallback(state)
        else:
            return await self.execute_sequential_fallback(state)

    async def stream_workflow_events(self, state: AgentState) -> AsyncGenerator[str, None]:
        """Real-time SSE event stream for live UI updates in Multi-Agent Studio."""
        trace_id = f"trace_{uuid.uuid4().hex[:12]}"
        state.langsmith_trace_id = trace_id

        pipeline_nodes = [
            ("Planner", self.planner),
            ("Retriever", self.retriever),
            ("Prompt Engineer", self.prompt_engineer),
            ("Writer", self.writer),
            ("Reviewer", self.reviewer),
            ("Evaluator", self.evaluator),
        ]

        yield f"data: {json.dumps({'event': 'start', 'run_id': state.run_id, 'trace_id': trace_id, 'active_node': 'Planner'})}\n\n"

        for node_name, agent_instance in pipeline_nodes:
            state.current_active_node = node_name

            # Emit Node Running Event
            running_event = {
                "event": "node_status",
                "node": node_name,
                "status": "running",
                "start_time": datetime.utcnow().isoformat(),
            }
            yield f"data: {json.dumps(running_event)}\n\n"

            # Execute agent node
            try:
                state, step_result = await agent_instance.run(state)
                completed_event = {
                    "event": "node_status",
                    "node": node_name,
                    "status": "completed",
                    "step_result": step_result.dict(),
                    "accumulated_tokens": state.total_tokens,
                    "accumulated_latency": state.total_latency_ms,
                }
                yield f"data: {json.dumps(completed_event)}\n\n"
            except Exception as e:
                error_event = {
                    "event": "node_status",
                    "node": node_name,
                    "status": "error",
                    "error": str(e),
                }
                yield f"data: {json.dumps(error_event)}\n\n"
                break

        # Final completion payload
        final_payload = {
            "event": "completed",
            "run_id": state.run_id,
            "final_response": state.writer_output.get("draft_response", state.final_response),
            "overall_confidence": state.overall_confidence,
            "total_tokens": state.total_tokens,
            "total_latency_ms": state.total_latency_ms,
            "langsmith_trace_id": trace_id,
            "langsmith_url": f"https://smith.langchain.com/o/default/projects/p/{LANGSMITH_PROJECT}/r/{trace_id}",
            "execution_steps": state.execution_steps,
            "prompt_engineer_output": state.prompt_engineer_output,
            "reviewer_output": state.reviewer_output,
            "evaluator_output": state.evaluator_output,
            "hitl_approval_required": state.hitl_approval_required,
            "retrieved_docs_count": len(state.retrieved_docs),
        }
        yield f"data: {json.dumps(final_payload)}\n\n"


workflow_manager = MultiAgentWorkflowManager()

