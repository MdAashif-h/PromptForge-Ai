import os
from openai import OpenAI
from dotenv import load_dotenv
import json

load_dotenv()


try:
    from langsmith.wrappers import wrap_openai
    HAS_LANGSMITH = True
except ImportError:
    HAS_LANGSMITH = False


class AIService:
    """Centralized OpenAI client wrapper. All AI calls go through this class."""

    def __init__(self):
        self._init_client()

    def _init_client(self):
        load_dotenv(override=True)
        self.api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

        # Auto-fix missing 's' prefix if user typed 'k-...' instead of 'sk-...'
        if self.api_key and self.api_key.startswith("k-"):
            self.api_key = "s" + self.api_key

        if not self.api_key or "your_openai" in self.api_key:
            self.client = None
        else:
            raw_client = OpenAI(api_key=self.api_key)
            if HAS_LANGSMITH and (os.getenv("LANGCHAIN_API_KEY") or os.getenv("LANGSMITH_API_KEY")):
                try:
                    self.client = wrap_openai(raw_client)
                except Exception:
                    self.client = raw_client
            else:
                self.client = raw_client

    def _ensure_client(self):
        self._init_client()
        if not self.client:
            raise RuntimeError(
                "OPENAI_API_KEY is missing or invalid. Please check backend/.env file."
            )

    def generate(self, system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
        """Generate a completion using the OpenAI chat API."""
        self._ensure_client()
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            raise RuntimeError(f"OpenAI API call failed: {str(e)}")

    def generate_json(self, system_prompt: str, user_prompt: str, temperature: float = 0.7) -> dict:
        """Generate a JSON response using the OpenAI chat API."""
        self._ensure_client()
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content or "{}"
            return json.loads(content)
        except json.JSONDecodeError:
            raise RuntimeError("Failed to parse JSON response from OpenAI")
        except Exception as e:
            raise RuntimeError(f"OpenAI API call failed: {str(e)}")

    def generate_embedding(self, text: str) -> list[float]:
        """Generate an embedding vector for the given text."""
        self._ensure_client()
        try:
            response = self.client.embeddings.create(
                model="text-embedding-3-small",
                input=text,
            )
            return response.data[0].embedding
        except Exception as e:
            raise RuntimeError(f"Embedding generation failed: {str(e)}")


# Singleton instance
ai_service = AIService()
