"""ChromaDB client for prompt vector storage and enterprise knowledge base RAG with metadata scoping."""

import os
from typing import Optional, List, Dict, Any, cast
import chromadb
from config import DOCUMENT_COLLECTION, PROMPT_COLLECTION

CHROMA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "chromadb")
os.makedirs(CHROMA_DIR, exist_ok=True)

chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)

# Prompt collection
prompt_collection = chroma_client.get_or_create_collection(
    name=PROMPT_COLLECTION,
    metadata={"hnsw:space": "cosine"},
)

# Knowledge Base Document Chunks collection
doc_collection = chroma_client.get_or_create_collection(
    name=DOCUMENT_COLLECTION,
    metadata={"hnsw:space": "cosine"},
)


def add_prompt_embedding(prompt_id: str, embedding: list[float]):
    """Add an embedding to ChromaDB linked by prompt ID."""
    prompt_collection.add(
        ids=[prompt_id],
        embeddings=cast(Any, [embedding]),
    )


def delete_prompt_embedding(prompt_id: str):
    """Remove an embedding from ChromaDB."""
    try:
        prompt_collection.delete(ids=[prompt_id])
    except Exception:
        pass


def search_similar(query_embedding: list[float], top_n: int = 10) -> list[str]:
    """Search for similar prompts and return their IDs."""
    results = prompt_collection.query(
        query_embeddings=cast(Any, [query_embedding]),
        n_results=top_n,
    )
    return results["ids"][0] if results["ids"] else []


# Knowledge Base Operations
def add_knowledge_chunks(
    chunk_ids: List[str],
    embeddings: List[List[float]],
    documents: List[str],
    metadatas: List[Dict[str, Any]],
):
    """Add document chunk embeddings and metadata to ChromaDB knowledge base."""
    doc_collection.add(
        ids=chunk_ids,
        embeddings=cast(Any, embeddings),
        documents=documents,
        metadatas=cast(Any, metadatas),
    )


def delete_knowledge_document(document_id: str):
    """Delete all chunks belonging to a document from ChromaDB."""
    try:
        doc_collection.delete(where={"document_id": document_id})
    except Exception:
        pass


def search_knowledge_base(
    query_embedding: List[float],
    top_k: int = 4,
    document_ids: Optional[List[str]] = None,
    workspace_id: Optional[str] = None,
    project_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Query knowledge base with metadata scope filter (workspace_id, project_id, document_ids) before vector retrieval."""
    query_kwargs = {
        "query_embeddings": cast(Any, [query_embedding]),
        "n_results": top_k,
        "include": cast(Any, ["documents", "metadatas", "distances"]),
    }

    where_conditions = []
    if workspace_id and workspace_id != "all":
        where_conditions.append({
            "$or": [
                {"workspace_id": workspace_id},
                {"workspace_id": "system_default"}
            ]
        })
    if project_id and project_id != "all":
        where_conditions.append({"project_id": project_id})
    if document_ids and len(document_ids) > 0:
        if len(document_ids) == 1:
            where_conditions.append({"document_id": document_ids[0]})
        else:
            where_conditions.append({"document_id": {"$in": document_ids}})

    if len(where_conditions) == 1:
        query_kwargs["where"] = where_conditions[0]
    elif len(where_conditions) > 1:
        query_kwargs["where"] = {"$and": where_conditions}

    results = doc_collection.query(**query_kwargs)

    if not results["ids"] or not results["ids"][0]:
        return []

    hits = []
    for i in range(len(results["ids"][0])):
        chunk_id = results["ids"][0][i]
        doc_text = results["documents"][0][i] if results.get("documents") else ""
        meta = results["metadatas"][0][i] if results.get("metadatas") else {}
        dist = results["distances"][0][i] if results.get("distances") else 1.0
        similarity = max(0.0, min(1.0, 1.0 - dist))

        hits.append({
            "chunk_id": chunk_id,
            "content": doc_text,
            "metadata": meta,
            "distance": dist,
            "similarity": similarity,
        })
    return hits
