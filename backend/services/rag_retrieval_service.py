"""Modular RAG Retrieval Engine with Metadata Scoping, MMR Re-ranking, & Extended Observability Metrics."""

import time
import uuid
import json
from sqlalchemy.orm import Session

from services.ai_service import ai_service
from chromadb_store.client import search_knowledge_base
from config import TOP_K, SIMILARITY_THRESHOLD, LLM_MODEL, EMBEDDING_MODEL, LANGSMITH_PROJECT


class RAGRetrievalEngine:
    """Enterprise RAG query engine with retrieval scoping and confidence scoring."""

    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def mmr_rerank(hits: list[dict], lambda_param: float = 0.7, top_k: int = 4) -> list[dict]:
        """Maximal Marginal Relevance re-ranking to balance relevance and diversity."""
        if not hits or len(hits) <= top_k:
            return hits

        sorted_hits = sorted(hits, key=lambda x: x.get("similarity", 0.0), reverse=True)
        selected = [sorted_hits[0]]
        unselected = sorted_hits[1:]

        while len(selected) < top_k and unselected:
            best_score = -1.0
            best_idx = -1

            for idx, candidate in enumerate(unselected):
                rel = candidate.get("similarity", 0.0)
                cand_words = set(candidate.get("content", "").lower().split())
                max_sim = 0.0
                for sel in selected:
                    sel_words = set(sel.get("content", "").lower().split())
                    if sel_words and cand_words:
                        overlap = len(cand_words.intersection(sel_words)) / float(max(1, len(cand_words.union(sel_words))))
                        if overlap > max_sim:
                            max_sim = overlap

                mmr_score = lambda_param * rel - (1.0 - lambda_param) * max_sim

                if mmr_score > best_score:
                    best_score = mmr_score
                    best_idx = idx

            if best_idx >= 0:
                selected.append(unselected.pop(best_idx))
            else:
                break

        return selected

    def query(
        self,
        question: str,
        top_k: int = TOP_K,
        similarity_threshold: float = SIMILARITY_THRESHOLD,
        temperature: float = 0.7,
        model: str = LLM_MODEL,
        chunk_strategy: str = "Recursive",
        scope: str = "all",
        document_ids: list[str] = None,
        workspace_id: str = "ws_default",
        project_id: str = "proj_default",
    ) -> dict:
        """Execute complete RAG retrieval & generation pipeline with scoped metadata filtering."""
        start_time = time.time()
        trace_id = f"trace_{uuid.uuid4().hex[:12]}"

        # STAGE 1: Question Embedding
        t0 = time.time()
        query_embedding = ai_service.generate_embedding(question)
        emb_latency = round((time.time() - t0) * 1000, 2)

        # STAGE 2: Scoped Vector Retrieval in ChromaDB
        t1 = time.time()
        raw_hits = search_knowledge_base(
            query_embedding=query_embedding,
            top_k=top_k * 2,
            document_ids=document_ids,
            workspace_id=workspace_id,
            project_id=project_id,
        )
        vector_latency = round((time.time() - t1) * 1000, 2)

        # Filter by similarity threshold
        filtered_hits = [h for h in raw_hits if h.get("similarity", 0.0) >= similarity_threshold]
        if not filtered_hits and raw_hits:
            filtered_hits = raw_hits[:top_k]

        # STAGE 3: MMR Re-ranking
        reranked_hits = self.mmr_rerank(filtered_hits, top_k=top_k)

        # Calculate Answer Confidence metric based on top chunk similarities
        sim_scores = [round(h.get("similarity", 0.0) * 100, 1) for h in reranked_hits]
        answer_confidence = round(sum(sim_scores) / max(1, len(sim_scores)), 1) if sim_scores else 0.0

        # Unique Source Documents
        source_docs = sorted(list(set(
            h.get("metadata", {}).get("filename", "Document") for h in reranked_hits
        )))

        # STAGE 4: Source Citations & Context Building
        context_parts = []
        citations = []

        for idx, hit in enumerate(reranked_hits):
            meta = hit.get("metadata", {})
            filename = meta.get("filename", "Document")
            page_num = meta.get("page_number", 1)
            chunk_idx = meta.get("chunk_index", idx)
            content = hit.get("content", "")
            sim_score = round(hit.get("similarity", 0.0) * 100, 1)

            context_parts.append(
                f"[Source {idx+1} | {filename} (Page {page_num}, Chunk {chunk_idx})]\n{content}"
            )

            citations.append({
                "citation_id": idx + 1,
                "chunk_id": hit.get("chunk_id", f"chunk_{idx}"),
                "document_name": filename,
                "page_number": page_num,
                "chunk_number": chunk_idx,
                "similarity_percent": sim_score,
                "content_preview": content[:150] + ("..." if len(content) > 150 else ""),
                "full_content": content,
                "metadata": meta,
            })

        context_str = "\n\n".join(context_parts) if context_parts else "No relevant documents found within the selected retrieval scope."

        # STAGE 5: Prompt Construction
        system_prompt = (
            "You are an enterprise AI assistant powered by PromptForge AI Retrieval-Augmented Generation (RAG).\n"
            "Use the provided context sources below to answer the user's question accurately.\n"
            "If the context does not contain enough information, clearly state that the answer is not fully present in the uploaded knowledge base.\n"
            "Format your answer cleanly with Markdown, bullet points, and inline source references like [Source 1] when citing specific facts."
        )

        user_prompt = f"### CONTEXT SOURCES:\n{context_str}\n\n### USER QUESTION:\n{question}"

        # STAGE 6: LLM Generation
        t2 = time.time()
        answer = ai_service.generate(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=temperature,
        )
        llm_latency = round((time.time() - t2) * 1000, 2)
        total_latency = round((time.time() - start_time) * 1000, 2)

        prompt_tokens = (len(system_prompt) + len(user_prompt)) // 4
        completion_tokens = len(answer) // 4
        total_tokens = prompt_tokens + completion_tokens

        # Extended RAG Explorer Payload
        rag_steps = [
            {
                "step": 1,
                "title": "Question Embedding",
                "description": f"Generated vector embedding for question using '{EMBEDDING_MODEL}'.",
                "latency_ms": emb_latency,
            },
            {
                "step": 2,
                "title": "ChromaDB Scoped Vector Retrieval & MMR Re-ranking",
                "description": f"Retrieved {len(raw_hits)} chunks (scope: '{scope}') and MMR re-ranked to top {len(reranked_hits)} chunks.",
                "latency_ms": vector_latency,
                "chunks_retrieved": len(reranked_hits),
            },
            {
                "step": 3,
                "title": "Prompt Context Construction",
                "description": f"Built grounded prompt context with {len(citations)} citations ({len(context_str)} chars).",
                "context_snippet": context_str[:300] + ("..." if len(context_str) > 300 else ""),
            },
            {
                "step": 4,
                "title": "OpenAI Answer Generation",
                "description": f"Generated response using model '{model}' at temperature {temperature}.",
                "latency_ms": llm_latency,
                "tokens_used": total_tokens,
            },
        ]

        langsmith_meta = {
            "trace_id": trace_id,
            "project": LANGSMITH_PROJECT,
            "latency_ms": total_latency,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
            "model_used": model,
            "trace_url": f"https://smith.langchain.com/o/default/projects/p/{LANGSMITH_PROJECT}/r/{trace_id}",
        }

        return {
            "question": question,
            "answer": answer,
            "citations": citations,
            "rag_steps": rag_steps,
            "langsmith_trace": langsmith_meta,
            "execution_metrics": {
                "total_latency_ms": total_latency,
                "embedding_latency_ms": emb_latency,
                "retrieval_latency_ms": vector_latency,
                "llm_latency_ms": llm_latency,
                "tokens_used": total_tokens,
                "chunks_count": len(reranked_hits),
                "answer_confidence": answer_confidence,
                "source_documents": source_docs,
                "similarity_scores": sim_scores,
                "scope": scope,
                "model_used": model,
                "trace_id": trace_id,
            },
        }
