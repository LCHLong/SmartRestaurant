"""
evaluation/__init__.py
Framework thẩm định khoa học tự động với LLM-as-a-Judge cho SmartRestaurant Hybrid RAG.
Paper reference: Advancing RAG for Structured Enterprise and Internal Data (IIT Roorkee, 2025 - Mục 4).
"""

from .golden_dataset import GOLDEN_BENCHMARK_DATASET, UserGroup
from .judge import RAGJudge, EvaluationResult

__all__ = [
    "GOLDEN_BENCHMARK_DATASET",
    "UserGroup",
    "RAGJudge",
    "EvaluationResult"
]
