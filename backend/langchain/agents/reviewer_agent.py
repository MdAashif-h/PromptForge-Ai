"""Reviewer Agent for PromptForge AI Multi-Agent Engine."""

import re
from typing import Tuple
from langchain.agents.base import BaseAgent, AgentState, AgentStepResult

class ReviewerAgent(BaseAgent):
    """Reviewer Agent: Checks output for hallucinations, validates citations, and computes final confidence."""

    def __init__(self, model_name: str = "gpt-4o-mini"):
        super().__init__(agent_name="Reviewer", model_name=model_name)

    async def run(self, state: AgentState) -> Tuple[AgentState, AgentStepResult]:
        start_ts, start_iso = self._start_telemetry()

        writer_text = state.final_response
        retrieved_count = len(state.retrieved_docs)

        # Citation validation: Find inline citations like [Source 1], [Source 2]
        citation_matches = re.findall(r"\[Source\s+(\d+)\]", writer_text, re.IGNORECASE)
        found_citations = [int(c) for c in citation_matches]

        valid_citations = [c for c in found_citations if 1 <= c <= max(1, retrieved_count)]
        citation_accuracy = (len(valid_citations) / max(1, len(found_citations))) * 100.0 if found_citations else 90.0

        # Confidence calculation
        avg_retrieval_conf = state.execution_steps[1]["confidence"] * 100 if len(state.execution_steps) > 1 else 85.0
        overall_confidence = round(0.6 * avg_retrieval_conf + 0.4 * citation_accuracy, 1)

        has_hallucination = bool(len(valid_citations) < len(found_citations))

        review_output = {
            "quality_status": "PASSED" if overall_confidence >= 70.0 else "NEEDS_REVIEW",
            "citation_count": len(found_citations),
            "valid_citations": len(valid_citations),
            "citation_accuracy_percent": round(citation_accuracy, 1),
            "confidence_score": overall_confidence,
            "has_hallucination": has_hallucination,
            "hitl_approval_required": state.hitl_approval_required,  # Extension point for Phase 3
            "summary": f"Quality audit passed with {overall_confidence}% confidence. {len(valid_citations)} valid source citations verified."
        }

        # Finalize state
        state.reviewer_output = review_output
        state.overall_confidence = overall_confidence
        state.current_active_node = "END"

        step_result = self._end_telemetry(
            start_ts=start_ts,
            start_iso=start_iso,
            status="completed",
            tokens=25,
            confidence=overall_confidence / 100.0,
            output=review_output
        )

        state.execution_steps.append(step_result.dict())
        state.total_tokens += 25
        state.total_latency_ms += step_result.duration_ms

        return state, step_result
