"""DocumentLoaderFactory and TextNormalizer for Enterprise RAG Ingestion."""

import os
import io
import re
import csv
from pypdf import PdfReader
from docx import Document as DocxDocument


class TextNormalizer:
    """Cleans, normalizes text content, and extracts basic character/word statistics."""

    @staticmethod
    def clean(text: str) -> str:
        """Strip invalid characters, normalize whitespace, and trim string."""
        if not text:
            return ""
        # Replace multiple whitespace/newlines with single whitespace while keeping sentence breaks
        cleaned = re.sub(r'[\r\n]+', '\n', text)
        cleaned = re.sub(r'[ \t]+', ' ', cleaned)
        return cleaned.strip()

    @staticmethod
    def get_stats(text: str) -> dict:
        """Calculate word count, character count, and line count."""
        cleaned = text.strip()
        words = cleaned.split() if cleaned else []
        return {
            "char_count": len(cleaned),
            "word_count": len(words),
            "line_count": len(cleaned.splitlines()) if cleaned else 0,
        }


class DocumentLoaderFactory:
    """Factory to load text content and page metadata from supported file formats."""

    SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".csv"}

    @classmethod
    def get_loader(cls, filename: str, file_bytes: bytes) -> list[dict]:
        """Parse document bytes and return list of page dicts: [{"page_number": int, "content": str}]."""
        ext = os.path.splitext(filename)[1].lower()

        if ext not in cls.SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file format '{ext}'. Supported formats: {', '.join(cls.SUPPORTED_EXTENSIONS)}")

        if not file_bytes:
            raise ValueError("File content is empty.")

        if ext == ".pdf":
            return cls._load_pdf(file_bytes)
        elif ext == ".docx":
            return cls._load_docx(file_bytes)
        elif ext == ".csv":
            return cls._load_csv(file_bytes)
        elif ext in {".txt", ".md"}:
            return cls._load_text(file_bytes)
        else:
            raise ValueError(f"No loader available for extension '{ext}'")

    @staticmethod
    def _load_pdf(file_bytes: bytes) -> list[dict]:
        pages = []
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                cleaned = TextNormalizer.clean(text)
                if cleaned:
                    pages.append({"page_number": i + 1, "content": cleaned})
        except Exception as e:
            raise ValueError(f"Failed to parse PDF document: {str(e)}")

        if not pages:
            pages.append({"page_number": 1, "content": "Empty PDF document"})
        return pages

    @staticmethod
    def _load_docx(file_bytes: bytes) -> list[dict]:
        try:
            doc = DocxDocument(io.BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            full_text = TextNormalizer.clean("\n".join(paragraphs))
            return [{"page_number": 1, "content": full_text or "Empty DOCX document"}]
        except Exception as e:
            raise ValueError(f"Failed to parse DOCX document: {str(e)}")

    @staticmethod
    def _load_text(file_bytes: bytes) -> list[dict]:
        try:
            text = file_bytes.decode("utf-8", errors="ignore")
            cleaned = TextNormalizer.clean(text)
            return [{"page_number": 1, "content": cleaned or "Empty document"}]
        except Exception as e:
            raise ValueError(f"Failed to read text file: {str(e)}")

    @staticmethod
    def _load_csv(file_bytes: bytes) -> list[dict]:
        try:
            text = file_bytes.decode("utf-8", errors="ignore")
            reader = csv.reader(io.StringIO(text))
            rows = [", ".join(row) for row in reader if any(row)]
            cleaned = TextNormalizer.clean("\n".join(rows))
            return [{"page_number": 1, "content": cleaned or "Empty CSV document"}]
        except Exception as e:
            raise ValueError(f"Failed to parse CSV document: {str(e)}")
