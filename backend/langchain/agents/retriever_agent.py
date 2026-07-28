"""Retriever Agent wrapping existing PromptForge AI RAG retrieval service."""

from typing import Tuple
from langchain.agents.base import BaseAgent, AgentState, AgentStepResult
from services.ai_service import ai_service
from chromadb_store.client import search_knowledge_base
from services.rag_retrieval_service import RAGRetrievalEngine
from config import TOP_K, SIMILARITY_THRESHOLD

class RetrieverAgent(BaseAgent):
    """Retriever Agent: Exclusive component querying ChromaDB with scoping (current, selected, workspace)."""

    def __init__(self, model_name: str = "text-embedding-3-small"):
        super().__init__(agent_name="Retriever", model_name=model_name)

    async def run(self, state: AgentState) -> Tuple[AgentState, AgentStepResult]:
        start_ts, start_iso = self._start_telemetry()

        # Determine retrieval query from Planner output or fallback to user query
        retrieval_query = state.planner_output.get("retrieval_query", state.user_query)
        if not retrieval_query:
            retrieval_query = state.user_query

        # Generate query vector embedding
        query_embedding = ai_service.generate_embedding(retrieval_query)

        # Scoped vector search in ChromaDB using existing client
        raw_hits = search_knowledge_base(
            query_embedding=query_embedding,
            top_k=TOP_K * 2,
            document_ids=state.document_ids if state.scope in ["current", "selected"] else None,
        )

        # Apply similarity threshold & MMR re-ranking using existing engine logic
        filtered_hits = [h for h in raw_hits if h.get("similarity", 0.0) >= SIMILARITY_THRESHOLD]
        if not filtered_hits and raw_hits:
            filtered_hits = raw_hits[:TOP_K]

        reranked_hits = RAGRetrievalEngine.mmr_rerank(filtered_hits, top_k=TOP_K)

        retrieved_docs = []
        citations = []
        sim_scores = []

        for idx, hit in enumerate(reranked_hits):
            meta = hit.get("metadata", {})
            filename = meta.get("filename", "Document")
            page_num = meta.get("page_number", 1)
            chunk_idx = meta.get("chunk_index", idx)
            content = hit.get("content", "")
            sim_score = round(hit.get("similarity", 0.0) * 100, 1)
            sim_scores.append(sim_score)

            doc_item = {
                "chunk_id": hit.get("chunk_id", f"chunk_{idx}"),
                "content": content,
                "similarity_percent": sim_score,
                "filename": filename,
                "page_number": page_num,
                "chunk_number": chunk_idx,
                "metadata": meta,
            }
            retrieved_docs.append(doc_item)

            citations.append({
                "citation_id": idx + 1,
                "chunk_id": hit.get("chunk_id", f"chunk_{idx}"),
                "document_name": filename,
                "page_number": page_num,
                "chunk_number": chunk_idx,
                "similarity_percent": sim_score,
                "content_preview": content[:150] + ("..." if len(content) > 150 else ""),
            })

        avg_confidence = round(sum(sim_scores) / max(1, len(sim_scores)), 1) if sim_scores else 0.0

        # Update global state
        state.retrieved_docs = retrieved_docs
        state.current_active_node = "Writer"

        output_summary = {
            "query_used": retrieval_query,
            "scope": state.scope,
            "chunks_retrieved": len(retrieved_docs),
            "retrieved_documents": list(set(d["filename"] for d in retrieved_docs)),
            "average_similarity": avg_confidence,
            "citations": citations,
        }

        step_result = self._end_telemetry(
            start_ts=start_ts,
            start_iso=start_iso,
            status="completed",
            tokens=15,  # Embedding call token weight
            confidence=avg_confidence / 100.0,
            output=output_summary
        )

        state.execution_steps.append(step_result.dict())
        state.total_tokens += 15
        state.total_latency_ms += step_result.duration_ms

        return state, step_result
