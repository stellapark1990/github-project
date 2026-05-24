from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    GITHUB_TOKEN: str
    DEEPSEEK_API_KEY: str
    DATABASE_URL: str = "sqlite:///./radar.db"

    # Dark horse thresholds
    MIN_STARS: int = 100
    MAX_AGE_DAYS: int = 180
    MIN_STAR_VELOCITY: float = 10.0  # stars/day (first run, no delta)
    MIN_STAR_DELTA: int = 200        # weekly star gain (subsequent runs)

    BLOCKED_ORGS: List[str] = [
        "microsoft", "google", "meta-llama", "facebookresearch",
        "apple", "amazon", "openai", "anthropics", "mistralai",
        "huggingface", "pytorch", "tensorflow", "nvidia",
        "alibaba", "baidu", "tencent", "bytedance", "deepmind",
        "googleresearch", "aws", "azure",
    ]

    # GitHub search topics for AI projects
    AI_TOPICS: List[str] = [
        "llm", "ai", "agent", "rag", "machine-learning",
        "deep-learning", "generative-ai", "chatbot",
        "vector-database", "multimodal", "inference",
    ]

    class Config:
        env_file = ".env"


settings = Settings()
