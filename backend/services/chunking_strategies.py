"""ChunkingStrategyFactory supporting Recursive, Fixed Size, and Semantic stubs."""

from langchain_text_splitters import RecursiveCharacterTextSplitter


class ChunkingStrategyFactory:
    """Factory to create and execute document chunking strategies."""

    SUPPORTED_STRATEGIES = {"Recursive", "Fixed Size", "Display", "Semantic"}

    @classmethod
    def chunk_pages(
        cls,
        pages: list[dict],
        strategy: str = "Recursive",
        chunk_size: int = 1000,
        chunk_overlap: int = 150,
    ) -> list[dict]:
        """Split document pages into text chunks with metadata."""
        if strategy not in cls.SUPPORTED_STRATEGIES:
            strategy = "Recursive"

        chunks = []
        chunk_index = 0

        if strategy in {"Recursive", "Semantic"}:
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                separators=["\n\n", "\n", ". ", " ", ""],
            )
        elif strategy == "Fixed Size":
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                separators=[""],
            )
        else:  # Display or fallback
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=max(500, chunk_size),
                chunk_overlap=50,
            )

        for page_data in pages:
            page_num = page_data.get("page_number", 1)
            page_text = page_data.get("content", "")

            if not page_text.strip():
                continue

            raw_chunks = splitter.split_text(page_text)
            for text in raw_chunks:
                clean_text = text.strip()
                if not clean_text:
                    continue

                # Estimate token count (rough rule of thumb: ~4 chars per token)
                token_count = max(1, len(clean_text) // 4)

                chunks.append({
                    "chunk_index": chunk_index,
                    "page_number": page_num,
                    "content": clean_text,
                    "token_count": token_count,
                    "strategy": strategy,
                })
                chunk_index += 1

        return chunks
