"""Prompt Engineer Agent for Phase 3 Intelligence."""

import os
import json
from typing import Tuple, Dict, Any, List
from langchain.agents.base import BaseAgent, AgentState, AgentStepResult
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage


class PromptEngineerAgent(BaseAgent):
    """Prompt Engineer Agent: Analyzes query intent, selects prompting strategy, assigns roles, formats instructions, and compresses context."""

    def __init__(self, model_name: str = "gpt-4o-mini"):
        super().__init__(agent_name="Prompt Engineer", model_name=model_name)

    async def run(self, state: AgentState) -> Tuple[AgentState, AgentStepResult]:
        start_ts, start_iso = self._start_telemetry()

        user_query = state.user_query
        retrieved_docs = state.retrieved_docs
        planner_output = state.planner_output

        # Context compression calculation
        raw_doc_text = " ".join([doc.get("page_content", "") for doc in retrieved_docs])
        original_length = len(raw_doc_text) + len(user_query)
        compressed_context = raw_doc_text[:3000] if len(raw_doc_text) > 3000 else raw_doc_text
        compressed_length = len(compressed_context) + len(user_query)
        compression_ratio = round((1 - (compressed_length / max(original_length, 1))) * 100, 1)

        api_key = os.getenv("OPENAI_API_KEY")
        selected_strategy = "Chain of Thought"
        role_assigned = "Senior Enterprise AI Architect"
        applied_techniques = ["Role Prompting", "Chain of Thought", "Context Compression", "XML Formatting"]
        strategy_justification = "Selected Chain of Thought because the query involves multi-step reasoning and analytical document synthesis."
        structured_prompt = f"<system_role>{role_assigned}</system_role>\n<context>\n{compressed_context}\n</context>\n<instruction>\nThink step-by-step to analyze the user request: {user_query}\n</instruction>"
        tokens_used = 150

        if api_key and not api_key.startswith("sk-placeholder"):
            try:
                llm = ChatOpenAI(model_name=self.model_name, temperature=0.2)
                sys_msg = SystemMessage(content="""You are an expert Prompt Engineer. Analyze the input task and retrieved context.
Select the optimal prompting technique from: ['Zero-shot', 'Few-shot', 'Chain of Thought', 'ReAct', 'XML Prompting', 'JSON Mode', 'Tool Calling prompts', 'Role prompting'].
Return JSON with keys:
- selected_strategy: string
- role_assigned: string
- applied_techniques: list of strings
- strategy_justification: string (why this technique was selected)
- structured_prompt: string (the optimized prompt ready for LLM generation)
""")
                user_msg = HumanMessage(content=f"Query: {user_query}\nPlan: {json.dumps(planner_output)}\nDoc Snippet: {compressed_context[:500]}")
                response = await llm.ainvoke([sys_msg, user_msg])
                tokens_used = getattr(response, "response_metadata", {}).get("token_usage", {}).get("total_tokens", 150)

                parsed = json.loads(response.content.strip("```json").strip("```"))
                selected_strategy = parsed.get("selected_strategy", selected_strategy)
                role_assigned = parsed.get("role_assigned", role_assigned)
                applied_techniques = parsed.get("applied_techniques", applied_techniques)
                strategy_justification = parsed.get("strategy_justification", strategy_justification)
                structured_prompt = parsed.get("structured_prompt", structured_prompt)
            except Exception as e:
                print(f"[PromptEngineerAgent] Falling back to default technique selection: {e}")

        output = {
            "selected_strategy": selected_strategy,
            "role_assigned": role_assigned,
            "applied_techniques": applied_techniques,
            "strategy_justification": strategy_justification,
            "structured_prompt": structured_prompt,
            "context_compression_ratio": f"{compression_ratio}%",
            "instruction_prioritization": "High priority: Accuracy & Document Grounding; Medium priority: Formatting & Tone",
            "formatted_context": compressed_context
        }

        state.prompt_engineer_output = output
        step_result = self._end_telemetry(
            start_ts=start_ts,
            start_iso=start_iso,
            status="completed",
            tokens=tokens_used,
            confidence=0.95,
            output=output
        )

        return state, step_result

